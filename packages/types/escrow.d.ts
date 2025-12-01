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

/**
 * Unified release request payload (fully automatic)
 * Backend automatically:
 * 1. Detects if deadline passed → uses releaseAfterDeadline flow
 * 2. Otherwise → uses normal releaseEscrow flow
 * 3. Finds accepted application from task_applications table
 * 4. Gets freelancer's wallet address from database
 * 5. Releases funds to that address
 * 6. Updates task status to 'completed'
 */
export interface ReleaseParams {
  reason?: string; // Optional - backend can auto-generate
}

/**
 * Release after deadline request payload (API v4.0 - Auto Logic)
 * Backend automatically determines recipient based on work submission status.
 * No need to specify recipientType - backend decides:
 * - If freelancer submitted work (in_review/completed) → Release to freelancer
 * - If freelancer NOT submitted or no freelancer → Refund to employer
 */
export interface ReleaseAfterDeadlineRequest {
  reason?: string; // Optional - backend auto-generates if empty
}

/**
 * Release after deadline response from API v4.0
 */
export interface ReleaseAfterDeadlineResponse {
  success: boolean;
  message: string;
  txHash?: string;
  blockNumber?: number;
  taskId: string;
  recipientType: 'freelancer' | 'employer'; // Backend's decision
  recipientAddress: string;
  alreadySettled?: boolean; // true if already settled before
  task: any; // Task object
}

/**
 * @deprecated Use ReleaseParams instead - unified endpoint handles both cases
 */
export interface ReleaseAfterDeadlineParams extends ReleaseParams {}
