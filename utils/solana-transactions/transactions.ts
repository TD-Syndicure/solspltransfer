import bs58 from "bs58";
import {
    Connection,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import { getPriorityFeeEstimate, mainConnection, simulateAndGetTxCu } from "./solana-helper-functions";
import {
    computeUnitIx,
    createMemo,
    priorityFeeIx,
} from "../solana-intructions/misc-instructions";
import { splTransferIxAndCreateAta } from "../solana-intructions/spl-instructions";

export async function prepareV0Transaction(
    connection: Connection,
    instructions: TransactionInstruction[],
    payer: PublicKey
) {
    const blockhash = await connection
        .getLatestBlockhash({ commitment: "max" })
        .then((res) => res.blockhash);

    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
}

export async function transferUSDC(
    fromAddress: PublicKey,
    toAddress: PublicKey,
    amount: number,
    computeUnit: number = 200_000,
    priorityFee: number = 55_000
) {
    const connection = await mainConnection();

    const usdcTokenAddress = new PublicKey(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    );


    let instructions: TransactionInstruction[] = [];

    instructions.push(await computeUnitIx(computeUnit));
    instructions.push(await priorityFeeIx(priorityFee));
    instructions.push(createMemo("SPL Token Recovery Transfer"))

    instructions.push(
        ...(await splTransferIxAndCreateAta(
            fromAddress,
            toAddress,
            amount,
            usdcTokenAddress,
            connection
        ))
    );

    return prepareV0Transaction(connection, instructions, fromAddress);
}

// Create and return a versioned transaction for any SPL-token transfer, legacy or Token-2022, sign and send the transaction to complete the transfer.
export async function transferSplToken(from, to, amount) {
    try {
    const connection = await mainConnection();
    const fromAddress = new PublicKey(from);
    const toAddress = new PublicKey(to);

    const simulateTx = await transferUSDC(
        fromAddress,
        toAddress,
        amount
    );

    const simulatedTxCu = await simulateAndGetTxCu(connection, simulateTx);

    if (simulatedTxCu.err) {
        console.error(simulatedTxCu.err);
        return;
    }

    // Optionally if you have the ability to sign the tx and get the priority fee, for most transfers this is not necessary and 55k lamports will do.
    // await transaction.sign(transactionSigner)
    // const priorityFee = await getPriorityFeeEstimate(connection.rpcEndpoint, "High", bs58.encode(transaction.serialize()))

    const transaction = await transferUSDC(
        fromAddress,
        toAddress,
        amount,
        simulatedTxCu.computeUnits
    );

    return transaction;

    } catch (error) {
        const err = error as Error;
        console.error(err.message);
    }
}