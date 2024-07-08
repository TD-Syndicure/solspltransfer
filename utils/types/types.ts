export type PriorityFeeLevel =
    | "Min"
    | "Low"
    | "Medium"
    | "High"
    | "VeryHigh"
    | "UnsafeMax";

export type PriorityFeeResponse = {
    jsonrpc: string;
    result: { priorityFeeEstimate: number };
    id: string;
};