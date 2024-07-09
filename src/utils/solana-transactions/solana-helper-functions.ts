import bs58 from "bs58";
import {
    Connection,
    Transaction,
    TransactionError,
    VersionedTransaction,
    BlockhashWithExpiryBlockHeight,
    TransactionExpiredBlockheightExceededError,
    VersionedTransactionResponse,
} from "@solana/web3.js";
import promiseRetry from "promise-retry";
import { sleep } from "../helper-functions";
import { PriorityFeeLevel, PriorityFeeResponse } from "../types/types";
import axios from "axios";

// Returns a connection to the mainnet. Note: replace this with your own rpc url.
export const mainConnection = async () => {
    return await new Connection("https://api.mainnet-beta.solana.com", {
        commitment: "max",
    });
};

// Optional function to fetch the priority fee estimate for a transaction based on latest transaction data.
export async function getPriorityFeeEstimate(
    rpcUrl: string,
    priorityLevel: PriorityFeeLevel,
    transaction: string
): Promise<number> {
    const response = await axios.post(rpcUrl, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getPriorityFeeEstimate",
            params: [
                {
                    transaction: transaction,
                    options: { priorityLevel: priorityLevel },
                },
            ],
        }),
        cache: "no-cache"
    });
    const data: PriorityFeeResponse = await response.data;

    if (!data.result) {
        throw new Error("Failed to get priority fee estimate");
    }

    return parseInt(data.result.priorityFeeEstimate.toFixed(0));
}

// Simulate a transaction and return the compute units to size your tx correctly and logs for the transaction, helpful for any debugging.
export async function simulateAndGetTxCu(
    connection: Connection,
    transaction: VersionedTransaction
): Promise<{
    computeUnits: number;
    logs: string[] | null;
    err?: TransactionError | null;
}> {
    const defaultCU = 200_000;

    const simulatedTx = await connection.simulateTransaction(transaction, {
        replaceRecentBlockhash: true,
        sigVerify: false,
    });

    if (simulatedTx.value.err || !simulatedTx.value.unitsConsumed) {
        return {
            logs: simulatedTx.value.logs,
            err: simulatedTx.value.err,
            computeUnits: defaultCU,
        };
    }

    return {
        computeUnits: simulatedTx?.value?.unitsConsumed + 20_000 || defaultCU,
        logs: simulatedTx.value.logs,
    };
}

// Simulate a transaction and return the logs and error if any, useful for debugging.
export async function simulateTx(
    connection: Connection,
    transaction: VersionedTransaction
): Promise<{ logs: string[] | null; err: TransactionError | null }> {
    const simulatedTx = await connection.simulateTransaction(transaction, {
        replaceRecentBlockhash: true,
        sigVerify: false,
    });

    if (simulatedTx.value.err) {
        return { logs: simulatedTx.value.logs, err: simulatedTx.value.err };
    }
    return { logs: simulatedTx.value.logs, err: simulatedTx.value.err };
}

// Returns the signature of a transaction after signing.
export function getSignature(
    transaction: Transaction | VersionedTransaction
): string {
    const signature =
        "signature" in transaction
            ? transaction.signature
            : transaction.signatures[0];
    if (!signature) {
        throw new Error(
            "Missing transaction signature, the transaction was not signed by the fee payer"
        );
    }
    return bs58.encode(signature);
}

type TransactionSenderAndConfirmationWaiterArgs = {
    connection: Connection;
    serializedTransaction: Buffer;
    blockhashWithExpiryBlockHeight: BlockhashWithExpiryBlockHeight;
};

const SEND_OPTIONS = {
    skipPreflight: true,
};

// Transaction sender and waiter for tx confirmation, re-sends until blockheight is exceeded, returns the transaction response on success.
export async function transactionSenderAndConfirmationWaiter({
    connection,
    serializedTransaction,
    blockhashWithExpiryBlockHeight,
}: TransactionSenderAndConfirmationWaiterArgs): Promise<VersionedTransactionResponse | null> {
    const txid = await connection.sendRawTransaction(
        serializedTransaction,
        SEND_OPTIONS
    );

    console.log("txid", txid);

    const controller = new AbortController();
    const abortSignal = controller.signal;

    const abortableResender = async () => {
        while (true) {
            await sleep(2_000);
            if (abortSignal.aborted) return;
            try {
                await connection.sendRawTransaction(
                    serializedTransaction,
                    SEND_OPTIONS
                );
            } catch (e) {
                const err = e as Error;
                console.warn(`Failed to resend transaction: ${err.message}`);
            }
        }
    };

    try {
        abortableResender();
        const lastValidBlockHeight =
            blockhashWithExpiryBlockHeight.lastValidBlockHeight - 150;

        await Promise.race([
            connection.confirmTransaction(
                {
                    ...blockhashWithExpiryBlockHeight,
                    lastValidBlockHeight,
                    signature: txid,
                    abortSignal,
                },
                "processed"
            ),
            new Promise(async (resolve) => {
                while (!abortSignal.aborted) {
                    await sleep(2_000);
                    const tx = await connection.getSignatureStatus(txid, {
                        searchTransactionHistory: false,
                    });
                    console.log(tx);
                    if (tx?.value?.confirmationStatus === "processed") {
                        resolve(tx);
                    }
                }
            }),
        ]);
    } catch (e) {
        if (e instanceof TransactionExpiredBlockheightExceededError) {
            console.log(e.message);
            return null;
        } else {
            console.log(e);
            throw e;
        }
    } finally {
        controller.abort();
    }

    const response = promiseRetry(
        async (retry: any) => {
            const response = await connection.getTransaction(txid, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
            });
            if (!response) {
                retry(response);
            }
            return response;
        },
        {
            retries: 5,
            minTimeout: 1e3,
        }
    );

    return response;
}
