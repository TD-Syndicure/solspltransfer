import { ComputeBudgetProgram } from "@solana/web3.js";
import { createMemoInstruction } from "@solana/spl-memo";

export const computeUnitIx = (units: number) => {
    return ComputeBudgetProgram.setComputeUnitLimit({
        units,
    });
};
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
