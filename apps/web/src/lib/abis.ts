import { parseAbi } from "viem";
/**
 * Smart Contract ABIs for TaskEscrow integration
 * Minimal ABIs with only the functions/events we need
 */

  export const ESCROW_ABI = parseAbi([
    "function deposit(uint256 amount, address freelancer, uint256 deadline, string externalTaskId)",
    "function cancel(uint256 taskId, string reason)",
    "function releaseAfterDeadline(uint256 taskId, address to, string reason)",
    "function externalToInternal(string externalId) view returns (uint256)",
    // Updated: Use anonymous tuple format (parseAbi doesn't support named tuples)
    "function escrows(uint256) view returns (address, address, uint256, uint256, uint8, string)",
    "event Deposited(uint256 indexed taskId, string indexed externalId, address employer, uint256 amount)",
    "event Released(uint256 indexed taskId, address to, uint256 amount, string reason)",
    "event Cancelled(uint256 indexed taskId, address employer, uint256 amount, string reason)"
]);

export const TOKEN_ABI = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
]);