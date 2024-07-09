import { ComputeBudgetProgram } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";

//Set the compute unit limit for the transaction using the ComputeBudgetProgram and set units to the desired limit
export const computeUnitIx = (units: number) => {
    return ComputeBudgetProgram.setComputeUnitLimit({
        units,
    });
};

//Set the priority fee for the transaction using the ComputeBudgetProgram and set microLamports to the desired fee
export const priorityFeeIx = (microLamports: number) => {
    return ComputeBudgetProgram.setComputeUnitPrice({
        microLamports,
    });
};

export const createMemo = (memo: string) => {
    // Not the precise limit, saves CU usage and prevents tx byte size issues in larger transactions.
    if (memo.length > 100)
        throw new Error("Memo must be less than 100 characters");

    return createMemoInstruction(memo);
};
