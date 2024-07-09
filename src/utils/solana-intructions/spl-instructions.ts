import {
    Connection,
    ParsedAccountData,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createMemo } from "./misc-instructions";

// Returns the associated token account for a wallet and token mint
export const walletAta = async (
    wallet: PublicKey,
    mint: PublicKey,
    token2022: boolean
): Promise<PublicKey> => {
    return await getAssociatedTokenAddress(
        wallet,
        mint,
        true,
        token2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
    );
};

// Returns a transaction instruction array for a token transfer between wallets creating the ATA if it doesn't exist
export const splTransferIxAndCreateAta = async (
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    amount: number,
    token: PublicKey,
    connection: Connection
): Promise<TransactionInstruction[]> => {
    let transferIx: TransactionInstruction[] = [];

    const tokenInfo = await connection.getParsedAccountInfo(token);
    const token2022 =
        (tokenInfo?.value?.data as ParsedAccountData)?.program === "spl-token-2022";

    let [source, destination] = await Promise.all([
        getAssociatedTokenAddress(
            token,
            fromPubkey,
            true,
            token2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
        ),
        getAssociatedTokenAddress(
            token,
            toPubkey,
            true,
            token2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
        ),
    ]);

    const decimals = (tokenInfo?.value?.data as ParsedAccountData)?.parsed?.info
        ?.decimals;
    const accountInfo = await connection.getAccountInfo(destination);
    if (accountInfo === null) {
        transferIx.push(
            createAssociatedTokenAccountInstruction(
                fromPubkey,
                destination,
                toPubkey,
                token,
                token2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
            )
        );
    }

    if (token2022) {
        transferIx.push(createMemo(`Token-22 Transfer for ${amount} ${token}`));
        transferIx.push(
            createTransferCheckedInstruction(
                source,
                token,
                destination,
                fromPubkey,
                BigInt(amount * Math.pow(10, decimals)),
                decimals,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );
    } else {
        transferIx.push(
            createTransferInstruction(
                source,
                destination,
                fromPubkey,
                Math.round(amount * 10 ** +decimals)
            )
        );
    }

    return transferIx;
};

// Returns a transaction instruction array for a token transfer between wallets without creating the ATA, only use if you know the ATA exists
export const splInstructionsWithoutCreateAta = async (
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    amount: number,
    token: PublicKey,
    connection: Connection
): Promise<TransactionInstruction[]> => {
    let instructions: TransactionInstruction[] = [];

    const tokenInfo = await connection.getParsedAccountInfo(token);
    const isToken2022 =
        (tokenInfo?.value?.data as ParsedAccountData)?.program === "spl-token-2022";

    let [source, destination] = await Promise.all([
        walletAta(token, fromPubkey, isToken2022),
        walletAta(token, toPubkey, isToken2022),
    ]);

    const decimals = (tokenInfo?.value?.data as ParsedAccountData)?.parsed?.info
        ?.decimals;

    if (isToken2022) {
        instructions.push(createMemo(`Token-22 Transfer for ${amount} ${token}`));
        instructions.push(
            createTransferCheckedInstruction(
                source,
                token,
                destination,
                fromPubkey,
                BigInt(amount * Math.pow(10, decimals)),
                decimals,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );
    } else {
        instructions.push(
            createTransferInstruction(
                source,
                destination,
                fromPubkey,
                Math.round(amount * 10 ** +decimals)
            )
        );
    }

    return instructions;
};
