from os import environ
import logging
import requests
from util import str2hex, hex2str
from challenge import Challenge, Move
import json

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
logger.info(f"HTTP rollup_server url is {rollup_server}")

challenges = {}
player_challenges = {}
next_id = 0

def add_notice(data):
    logger.info(f"Adding notice {data}")
    notice = {"payload": str2hex(data)}
    response = requests.post(rollup_server + "/notice", json=notice)
    logger.info(f"Received notice status {response.status_code} body {response.content}")

def add_report(output=""):
    logger.info("Adding report " + output)
    report = {"payload": str2hex(output)}
    response = requests.post(rollup_server + "/report", json=report)
    logger.info(f"Received report status {response.status_code}")

def handle_advance(data):
    try:
        payload = json.loads(hex2str(data["payload"]))
    except:
        return "reject"
    
    method = payload.get("method")
    sender = data["metadata"]["msg_sender"]
    logger.info(f"Received advance request data {payload}")

    handler = advance_method_handlers.get(method)
    if not handler:
        add_report("Invalid method.")
        return "reject"
    
    return handler(payload, sender)

def handle_inspect(data):
    try:
        payload = json.loads(hex2str(data["payload"]))
    except:
        return "reject"
    
    method = payload.get("method")
    logger.info(f"Received inspect request data {payload}")

    handler = inspect_method_handlers.get(method)
    if not handler:
        add_report("Invalid method.")
        return "reject"
    
    return handler()

def create_challenge(payload, sender):
    global next_id
    commitment = payload.get("commitment")

    if not commitment:
        add_report("no commitment")
        return "reject"

    if player_challenges.get(sender) is not None:
        add_report("Player is already in a challenge")
        return "reject"
    
    challenge = Challenge(sender, next_id, commitment)
    challenges[next_id] = challenge
    player_challenges[sender] = next_id

    add_notice(f"challenge with id {next_id} was created by {sender}")
    next_id += 1

    return "accept"

def accept_challenge(payload, sender):
    commitment = payload.get("commitment")
    challenge_id = payload.get("challenge_id")

    challenge = challenges.get(challenge_id)

    if not challenge:
        add_report("challenge does not exist")
        return "reject"
    
    if not commitment:
        add_report("no commitment")
        return "reject"

    if player_challenges.get(sender) is not None:
        add_report("Player is already in a challenge")
        return "reject"

    challenge.add_opponent(sender, commitment)
    player_challenges[sender] = challenge_id
    add_notice(f"challenge with id {challenge_id} was accepted by {sender}")

    return "accept"

def reveal(payload, sender):
    move = payload.get("move")
    nonce = payload.get("nonce")

    challenge_id = player_challenges.get(sender)
    if challenge_id is None:
        add_report("challenge does not exist")
        return "reject"
    
    challenge = challenges.get(challenge_id)
    try:
        challenge.reveal(sender, move, nonce)
        add_notice(f"Challenge {challenge_id}: {sender} revealed their move of {Move.move_to_str(int(move))}")

        if challenge.both_revealed():
            winner = challenge.evaluate_winner()
            if not winner:
                add_notice(f"Challenge {challenge_id} ended in a draw")
            else:
                add_notice(f"Challenge {challenge_id} was won by {winner}")

            delete_challenge(challenge)

        return "accept"
    except Exception as e:
        add_report("Error: " + str(e))
        return "reject"

def delete_challenge(challenge):
    if player_challenges.get(challenge.opponent_address) is not None:
        del player_challenges[challenge.opponent_address]
    
    if player_challenges.get(challenge.creator_address) is not None:
        del player_challenges[challenge.creator_address]

def get_challenges():
    challenge_keys = challenges.keys()
    challenge_list = []

    for challenge_id in challenge_keys:
        challenge = challenges.get(challenge_id)
        opponent_move = challenge.commitments.get(challenge.opponent_address)
        creator_move = challenge.commitments.get(challenge.creator_address)

        challenge_list.append({
            "challenge_id": challenge_id,
            "creator": challenge.creator_address,
            "opponent": challenge.opponent_address,
            "winner": challenge.winner_address,
            "opponent_committed": challenge.has_opponent_committed(),
            "opponent_move": opponent_move.move if opponent_move else None,
            "creator_move": creator_move.move
        })
    
    output = json.dumps({"challenges": challenge_list})
    add_report(output)
    return "accept"

handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
}

advance_method_handlers = {
    "create_challenge": create_challenge,
    "reveal": reveal,
    "accept_challenge": accept_challenge
}

inspect_method_handlers = {
    "get_challenges": get_challenges
}

finish = {"status": "accept"}

while True:
    logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    logger.info(f"Received finish status {response.status_code}")
    if response.status_code == 202:
        logger.info("No pending rollup request, trying again")
    else:
        rollup_request = response.json()
        data = rollup_request["data"]
        
        handler = handlers[rollup_request["request_type"]]
        finish["status"] = handler(rollup_request["data"])
