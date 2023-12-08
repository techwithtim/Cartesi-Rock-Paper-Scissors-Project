import {
    NONCE_KEY,
    MOVE_KEY,
    INPUTBOX_ADDRESS,
    DAPP_ADDRESS,
    DEFAULT_URL,
} from "./constants";
import { InputBox__factory } from "@cartesi/rollups";
import { ethers } from "ethers";

export async function generateHash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

export const generateCommitment = async (choice, signer) => {
    const address = await signer.getAddress();

    const nonce = Math.random() * 1000;
    localStorage.setItem(NONCE_KEY + address.toLowerCase(), nonce);
    localStorage.setItem(MOVE_KEY + address.toLowerCase(), choice);

    const commitment = await generateHash(nonce.toString() + choice);
    return commitment;
};

export const sendInput = async (value, signer, toast) => {
    console.log(DAPP_ADDRESS)
    const inputBox = InputBox__factory.connect(INPUTBOX_ADDRESS, signer);
    const inputBytes = ethers.utils.isBytesLike(value)
        ? value
        : ethers.utils.toUtf8Bytes(value);
    const tx = await inputBox.addInput(DAPP_ADDRESS, inputBytes);
    return await waitForTransaction(tx, toast)
};

export const waitForTransaction = async (tx, toast) => {
    toast({
        title: "Transaction sent",
        description: "waiting for confirmation",
        status: "success",
        duration: 9000,
        isClosable: true,
        position: "top-left",
    });
    const receipt = await tx.wait(1)
    const event = receipt.events?.find((e) => e.event === "InputAdded");
    toast({
        title: "Confirmed",
        description: `Input added => index: ${event.args.inboxInputIndex}`,
        status: "success",
        duration: 9000,
        isClosable: true,
        position: "top-left",
    });
    return receipt
};

export const inspect = async (payload) => {
    const response = await fetch(`${DEFAULT_URL}/${JSON.stringify(payload)}`)

    if (response.status === 200) {
        const result = await response.json()
        console.log(result.reports)
        return result.reports
    } else {
        console.log(await response.text());
    }
}

export const hex2str = (hex) => {
    try {
        return ethers.utils.toUtf8String(hex)
    } catch (_e) {
        return hex
    }
}