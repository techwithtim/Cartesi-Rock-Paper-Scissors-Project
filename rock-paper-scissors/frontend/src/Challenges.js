import React, { useState } from "react";
import { Button, useToast, Heading, Select } from "@chakra-ui/react";
import { generateCommitment, sendInput } from "./util";
import { MOVE_KEY, NONCE_KEY } from "./constants";

function Challenges({ challenges, address, signer, showAccept = false }) {
    const toast = useToast();

    const [choice, setChoice] = useState(1);

    const isAddressUser = (addr) => {
        if (addr === address)
            return <strong style={{ color: "green" }}>You</strong>;
        return <strong style={{ color: "red" }}>Opponent</strong>;
    };

    const moveToString = (move) => {
        return {
            0: "HIDDEN",
            1: "ROCK",
            2: "PAPER",
            3: "SCISSORS",
        }[move];
    };

    const acceptChallenge = async (id) => {
        const commitment = await generateCommitment(choice, signer);
        await sendInput(
            JSON.stringify({
                method: "accept_challenge",
                commitment: commitment,
                challenge_id: id,
            }),
            signer,
            toast
        );
    };

    const revealMove = async () => {
        const nonce = localStorage.getItem(NONCE_KEY + address);
        const move = localStorage.getItem(MOVE_KEY + address);

        await sendInput(
            JSON.stringify({
                method: "reveal",
                move: move,
                nonce: nonce,
            }),
            signer,
            toast
        );
    };

    const showReveal = (challenge) => {
        if (challenge.opponent === address && challenge.opponent_move !== 0)
            return false;
        if (challenge.creator === address && challenge.creator_move !== 0)
            return false;

        return (
            challenge.opponent_move != undefined &&
            challenge.creator_move != undefined &&
            !challenge.winner
        );
    };

    return (
        <div className="challenges">
            {challenges.map((challenge) => {
                let data = {
                    opponentMove: "",
                    yourMove: "",
                    opponent: "",
                };

                if (challenge.creator === address) {
                    data = {
                        opponentMove: challenge.opponent_move,
                        yourMove: challenge.creator_move,
                        opponent: challenge.opponent,
                    };
                } else {
                    data = {
                        opponentMove: challenge.creator_move,
                        yourMove: challenge.opponent_move,
                        opponent: challenge.creator,
                    };
                }

                return (
                    <div className="challenge" key={challenge.challenge_id}>
                        <Heading>Challenge #{challenge.challenge_id}</Heading>
                        {data.opponent && (
                            <p>
                                <strong>Opponent</strong>: {data.opponent}
                            </p>
                        )}
                        {challenge.winner && (
                            <p>
                                <strong>Winner</strong>:{" "}
                                {isAddressUser(challenge.winner)}
                            </p>
                        )}
                        {data.opponentMove != undefined && (
                            <p>
                                <strong>Opponent Move:</strong>{" "}
                                {moveToString(data.opponentMove)}
                            </p>
                        )}
                        {data.yourMove != undefined && (
                            <p>
                                <strong>Your Move:</strong>{" "}
                                {moveToString(data.yourMove)}
                            </p>
                        )}
                        {showReveal(challenge) && (
                            <Button colorScheme="green" onClick={revealMove}>
                                Reveal Move
                            </Button>
                        )}
                        
                        {showAccept && (
                            <>
                                <Select
                                    focusBorderColor="yellow"
                                    size="md"
                                    value={choice}
                                    onChange={(event) =>
                                        setChoice(event.target.value)
                                    }
                                >
                                    <option value="1">ROCK</option>
                                    <option value="2">PAPER</option>
                                    <option value="3">SCISSORS</option>
                                </Select>
                                <Button
                                    onClick={() => {
                                        acceptChallenge(challenge.challenge_id);
                                    }}
                                    colorScheme="green"
                                >
                                    Accept Challenge
                                </Button>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default Challenges;
