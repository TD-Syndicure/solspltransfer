import {
    Connection,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction,
} from "@solana/web3.js";
import {
    // getPriorityFeeEstimate,
    mainConnection,
    simulateAndGetTxCu,
} from "./solana-helper-functions";
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

export async function transferToken(
    fromAddress: PublicKey,
    toAddress: PublicKey,
    tokenAddress: string,
    amount: number,
    computeUnit: number = 200_000,
    priorityFee: number = 55_000
) {
    const connection = await mainConnection();

    const usdcTokenAddress = new PublicKey(tokenAddress);

    let instructions: TransactionInstruction[] = [];

    instructions.push(await computeUnitIx(computeUnit));
    instructions.push(await priorityFeeIx(priorityFee));
    instructions.push(createMemo("SPL Token Recovery Transfer"));

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

// Create and return a versioned transaction for any SPL-token transfer, legacy or Token-2022.
export async function transferSplToken(
    from: string,
    to: string,
    tokenAddress: string,
    amount: number
) {
    try {
        const connection = await mainConnection();
        const fromAddress = new PublicKey(from);
        const toAddress = new PublicKey(to);

        const simulateTx = await transferToken(fromAddress, toAddress, tokenAddress, amount);

        const simulatedTxCu = await simulateAndGetTxCu(connection, simulateTx);

        if (simulatedTxCu.err) {
            console.error(simulatedTxCu.err);
            return;
        }

        // Optional method to get the priority fee estimate for a transaction. Requires a transaction to be signed and serialized.
        // await transaction.sign(transactionSigner)
        // const priorityFee = await getPriorityFeeEstimate(connection.rpcEndpoint, "High", bs58.encode(transaction.serialize()))

        // Enter the priority fee into the transfer function as the last argument to recreate the tx with CU and Priority fees set.
        // const transaction = await transferToken(
        //     fromAddress,
        //     toAddress,
        //     amount,
        //     simulatedTxCu.computeUnits
        //     priorityFee
        // );

        const transaction = await transferToken(
            fromAddress,
            toAddress,
            tokenAddress,
            amount,
            simulatedTxCu.computeUnits
        );

        return transaction;
    } catch (error) {
        const err = error as Error;
        console.error(err.message);
    }
}
