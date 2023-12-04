import React, { useState, useEffect } from "react";
import { Button, Heading } from "@chakra-ui/react";
import { hex2str, inspect } from "./util";
import Challenges from "./Challenges";

function ListChallenges({ signer }) {
    const [currentChallenges, setCurrentChallenges] = useState([]);
    const [myChallenge, setMyChallenge] = useState(undefined);
    const [myOldChallenges, setMyOldChallenges] = useState([]);
    const [oldChallenges, setOldChallenges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState("");

    useEffect(() => {
        signer?.getAddress().then((addr) => setAddress(addr.toLowerCase()));
    }, [signer]);

    useEffect(() => {
        getChallenges();
    }, [address]);

    async function getChallenges() {
        setLoading(true);

        let results;
        results = await inspect({ method: "get_challenges" });
        results = JSON.parse(hex2str(results[0].payload))["challenges"];

        const currentChallenges = [];
        let myChallenge = undefined;
        const oldChallenges = [];
        const myOldChallenges = [];

        for (const challenge of results) {
            const userParticipated =
                challenge.opponent === address || challenge.creator === address;

            const challengeDone =
                challenge.winner ||
                (challenge.opponent_move && challenge.creator_move);

            if (challengeDone && userParticipated) {
                myOldChallenges.push(challenge);
            } else if (userParticipated) {
                myChallenge = challenge;
            } else if (challengeDone) {
                oldChallenges.push(challenge);
            } else {
                currentChallenges.push(challenge);
            }
        }

        setCurrentChallenges(currentChallenges);
        setMyChallenge(myChallenge);
        setOldChallenges(oldChallenges);
        setMyOldChallenges(myOldChallenges);
        setLoading(false);
    }

    let buttonProps = {};
    if (loading) buttonProps.isLoading = true;

    if (!address) return <></>;

    return (
        <div className="center">
            <Heading size="lg">Active Challenges</Heading>
            {myChallenge ? (
                <Challenges
                    challenges={[myChallenge]}
                    address={address}
                    signer={signer}
                />
            ) : (
                <Challenges
                    challenges={currentChallenges}
                    address={address}
                    signer={signer}
                    showAccept={true}
                />
            )}
            {oldChallenges.length > 0 && (
                <>
                    <Heading size="lg">Old Challenges</Heading>
                    <Challenges
                        challenges={oldChallenges}
                        address={address}
                        signer={signer}
                    />
                </>
            )}
            {myOldChallenges.length > 0 && (
                <>
                    <Heading size="lg">My History</Heading>
                    <Challenges
                        challenges={myOldChallenges}
                        address={address}
                        signer={signer}
                    />
                </>
            )}
            <Button {...buttonProps} onClick={getChallenges} colorScheme="blue">
                Update Challenges
            </Button>
        </div>
    );
}

export default ListChallenges;
