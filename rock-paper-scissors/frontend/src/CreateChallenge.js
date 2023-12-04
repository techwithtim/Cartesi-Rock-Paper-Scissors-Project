import React, { useState } from "react";
import { Button, useToast, Select, Heading } from "@chakra-ui/react";
import { generateCommitment, sendInput } from "./util";

function CreateChallenge({ signer }) {
    const [choice, setChoice] = useState("1");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    async function createChallenge() {
        const commitment = await generateCommitment(choice, signer);
        await sendInput(
            JSON.stringify({
                method: "create_challenge",
                commitment: commitment,
            }),
            signer,
            toast
        );
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        await createChallenge();
        setLoading(false);
    }

    let buttonProps = {};
    if (loading) buttonProps.isLoading = true;

    return (
        <div className="challengeForm">
            <form onSubmit={handleSubmit}>
                <Heading size="lg">Create Challenge</Heading>
                <div>
                    <label>
                        <p>Choice</p>
                    </label>
                    <Select
                        focusBorderColor="yellow"
                        size="md"
                        value={choice}
                        onChange={(event) => setChoice(event.target.value)}
                    >
                        <option value="1">ROCK</option>
                        <option value="2">PAPER</option>
                        <option value="3">SCISSORS</option>
                    </Select>
                </div>
                <Button {...buttonProps} type="submit" colorScheme={"yellow"}>
                    Create Challenge
                </Button>
            </form>
        </div>
    );
}

export default CreateChallenge;
