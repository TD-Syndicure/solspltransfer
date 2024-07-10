

import {
    Connection,
    PublicKey,
    TransactionInstruction,
    ParsedAccountData,
    TransactionMessage,
    VersionedTransaction,
    SystemProgram,
    ComputeBudgetProgram,
    NonceAccount
} from "@solana/web3.js";

import { createMemoInstruction } from "@solana/spl-memo";
import {
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

async function transferSplToken(
    from: string,
    to: string,
    tokenAddress: string,
    amount: number,
    nonceAccountPubkey: string,
    nonceSignerPubkey: string
) {
    try {
        const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=10349572-8076-47c7-b8f3-f48210ad143f", { commitment: "confirmed" });
        const fromAddress = new PublicKey(from);
        const toAddress = new PublicKey(to);
        const usdcTokenAddress = new PublicKey(tokenAddress);

        const accountInfo = await connection.getAccountInfo(new PublicKey(nonceAccountPubkey));

        if (accountInfo === null) throw new Error("Nonce account not found");

        const nonceAccount = NonceAccount.fromAccountData(accountInfo.data);

        let instructions: TransactionInstruction[] = [];

        instructions.push(ComputeBudgetProgram.setComputeUnitLimit({
            units: 200_000,
        }));

        instructions.push(ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: 55_000,
        }));

        instructions.push(SystemProgram.nonceAdvance({
            authorizedPubkey: new PublicKey(nonceSignerPubkey),
            noncePubkey: new PublicKey(nonceAccountPubkey),
        }))

        instructions.push(createMemoInstruction("SPL Token Recovery Transfer"));

        instructions.push(
            ...(await splTransferIxAndCreateAta(
                fromAddress,
                toAddress,
                amount,
                usdcTokenAddress,
                connection
            ))
        );

        const tx = prepareV0Transaction(
            nonceAccount.nonce,
            instructions,
            fromAddress
        );

        // log out the tx to confirm it is correct and verify 2x signers are required
        console.log(tx)

        // return the tx to be signed for use in a codebase that can sign the transaction
        return tx;
    } catch (error) {
        const err = error as Error;
        console.error(err.message);
    }
}

// Transfer SPL token returns a versioned transaction to be signed by the "from wallet" and the "nonce account signer"
transferSplToken(
    "9QACZ3BrxntjikUES7h6grfeD8yv7Nq7SSCrZP8uJXh2", // from wallet
    "ExP5nq9j4sixx4UZ523Rhku9rjpuMVJyboaaRJ2XPiBo", // to wallet
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC token address
    1, // amount
    "5NUAJckcnpGSdDsocx9hBR2zCBos3BTadqurCQoiGyYd", // nonce account pubkey
    "EbsUZEFAU23Z2SgAymFtU2hADLiyNLzaPLKiJfvpKnE7" // nonce account signer pubkey
)

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

function prepareV0Transaction(
    blockhash: string,
    instructions: TransactionInstruction[],
    payer: PublicKey
): VersionedTransaction {
    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message();
    return new VersionedTransaction(messageV0);
}