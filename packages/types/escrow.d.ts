export interface EscrowInfo {
  taskId: string;
  externalTaskId: string;
  employer: string;
  freelancer: string;
  amount: string;
  deadline: number;
  settled: boolean;
  depositedTx?: string;
  releasedTx?: string;
  releaseTo?: string;
  releaseReason?: string;
  depositedAt?: string;
  releasedAt?: string;
}

export interface EscrowDepositParams {
  freelancerAddress: string;
  amountWei: bigint;
  deadlineUnix: number;
  externalTaskId: string;
}

export interface EscrowTransaction {
  txHash: string;
  taskId?: string;
}

export type EscrowStatus = "pending" | "active" | "cancelled" | "released";
