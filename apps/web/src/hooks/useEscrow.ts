/**
 * useEscrow - React hook for TaskEscrow contract interactions
 * Refactored to use wagmi + viem for better error handling
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  useAccount, 
  usePublicClient, 
  useWalletClient,
  useSwitchChain
} from "wagmi";
import { 
  formatUnits, 
  decodeEventLog,
  erc20Abi,
  type Address,
  type Hash
} from "viem";
import type { EscrowDepositParams, EscrowTransaction } from "@slice/types/escrow";
import { TASK_ESCROW_POOL_ADDRESS, ERC20_TOKEN_ADDRESS, CHAIN, SLICE_API_URL } from "@slice/data/constants";
import { ESCROW_ABI } from "@/lib/abis";
import { getToken } from "@/helpers/api";


interface UseEscrowOptions {
  onSuccess?: (tx: EscrowTransaction) => void;
  onError?: (error: Error) => void;
}

export function useEscrow({ onSuccess, onError }: UseEscrowOptions) {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  
  const [isDepositing, setIsDepositing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  useEffect(() => {
    if (chain?.id !== CHAIN.id) {
      switchChainAsync({ chainId: CHAIN.id });
    }
  }, [chain, switchChainAsync]);

  /**
   * Check token allowance using viem
   */
  const checkAllowance = useCallback(
    async (ownerAddress: Address, spenderAddress: Address): Promise<bigint> => {
      if (!publicClient) throw new Error("Public client not available");
      
      const allowance = await publicClient.readContract({
        address: ERC20_TOKEN_ADDRESS as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [ownerAddress, spenderAddress]
      }) as bigint;
      
      return allowance;
    },
    [publicClient]
  );

  /**
   * Approve token spending using viem
   */
  const approveToken = useCallback(
    async (amount: bigint): Promise<Hash> => {
      if (!walletClient || !address) throw new Error("Wallet not connected");

      toast.info("Approving token...", { id: "approve" });
      
      const hash = await walletClient.writeContract({
        chain: CHAIN,
        address: ERC20_TOKEN_ADDRESS as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [TASK_ESCROW_POOL_ADDRESS as Address, amount]
      });

      // Wait for confirmation
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        toast.success("Token approved", { id: "approve" });
      }

      return hash;
    },
    [walletClient, address, publicClient]
  );

  /**
   * Deposit funds into escrow using viem with proper error decoding
   */
  const deposit = useCallback(
    async (params: EscrowDepositParams): Promise<EscrowTransaction> => {
      if (!walletClient || !address || !publicClient) {
        throw new Error("Wallet not connected");
      }

      setIsDepositing(true);

      try {
        const { freelancerAddress, amountWei, deadlineUnix, externalTaskId } = params;

        console.log("Deposit params:", {
          freelancerAddress,
          amountWei: amountWei.toString(),
          deadlineUnix,
          externalTaskId,
          ownerAddress: address,
          tokenAddress: ERC20_TOKEN_ADDRESS,
          escrowAddress: TASK_ESCROW_POOL_ADDRESS
        });

        // Step 1: Check token balance
        const balance = await publicClient.readContract({
          address: ERC20_TOKEN_ADDRESS as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address]
        }) as bigint;
        
        console.log("Token balance:", formatUnits(balance, 18));
        
        if (balance < amountWei) {
          throw new Error(
            `Insufficient token balance. You have ${formatUnits(balance, 18)} tokens but need ${formatUnits(amountWei, 18)}`
          );
        }

        // Step 2: Check and approve if needed
        const currentAllowance = await publicClient.readContract({
          address: ERC20_TOKEN_ADDRESS as Address,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, TASK_ESCROW_POOL_ADDRESS as Address]
        }) as bigint;
        
        console.log("Current allowance:", formatUnits(currentAllowance, 18));
        console.log("Required amount:", formatUnits(amountWei, 18));

        if (currentAllowance < amountWei) {
          console.log("Insufficient allowance, approving token...");
          
          // If there's existing allowance, reset to 0 first (some tokens require this)
          if (currentAllowance > 0n) {
            console.log("Resetting allowance to 0 first...");
            const resetHash = await walletClient.writeContract({
              chain: CHAIN,
              address: ERC20_TOKEN_ADDRESS as Address,
              abi: erc20Abi,
              functionName: "approve",
              args: [TASK_ESCROW_POOL_ADDRESS as Address, 0n]
            });
            await publicClient.waitForTransactionReceipt({ hash: resetHash });
          }
          
          // Now approve the required amount
          toast.info("Approving token...", { id: "approve" });
          const approveHash = await walletClient.writeContract({
            chain: CHAIN,
            address: ERC20_TOKEN_ADDRESS as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [TASK_ESCROW_POOL_ADDRESS as Address, amountWei]
          });
          
          // Wait for confirmation
          const approveReceipt = await publicClient.waitForTransactionReceipt({ 
            hash: approveHash,
            confirmations: 1
          });
          console.log("Approve tx confirmed in block:", approveReceipt.blockNumber);
          toast.success("Token approved", { id: "approve" });
          
          // Wait a bit for state to settle
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify approval - retry up to 3 times
          let newAllowance = 0n;
          for (let i = 0; i < 3; i++) {
            newAllowance = await publicClient.readContract({
              address: ERC20_TOKEN_ADDRESS as Address,
              abi: erc20Abi,
              functionName: "allowance",
              args: [address, TASK_ESCROW_POOL_ADDRESS as Address]
            }) as bigint;
            
            console.log(`Allowance check attempt ${i + 1}:`, formatUnits(newAllowance, 18));
            
            if (newAllowance >= amountWei) {
              console.log("✓ Approval verified successfully");
              break;
            }
            
            if (i < 2) {
              console.log("Allowance not updated yet, waiting...");
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          if (newAllowance < amountWei) {
            throw new Error(
              `Approval verification failed after 3 attempts: got ${formatUnits(newAllowance, 18)} but need ${formatUnits(amountWei, 18)}`
            );
          }
        } else {
          console.log("Allowance sufficient, skipping approve");
        }

        // Step 3: Deposit
        console.log("Depositing to escrow...");
        toast.info("Depositing funds...", { id: "deposit" });
        
        const depositHash = await walletClient.writeContract({
          chain: CHAIN,
          address: TASK_ESCROW_POOL_ADDRESS as Address,
          abi: ESCROW_ABI,
          functionName: "deposit",
          args: [amountWei, freelancerAddress as Address, BigInt(deadlineUnix), externalTaskId]
        });

        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: depositHash
        });
        toast.success("Funds deposited successfully", { id: "deposit" });
        console.log("Deposit successful, tx:", receipt.transactionHash);

        // Step 4: Extract taskId from event
        let taskId: string | undefined;
        try {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: ESCROW_ABI,
                data: log.data,
                topics: log.topics
              });
              
              if (decoded.eventName === "Deposited") {
                // @ts-ignore - taskId is in the event args
                taskId = decoded.args.taskId?.toString();
                console.log("On-chain taskId:", taskId);
                break;
              }
            } catch {
              // Skip logs that don't match
              continue;
            }
          }
        } catch (err) {
          console.warn("Failed to parse taskId from event:", err);
        }

        const result = { txHash: receipt.transactionHash, taskId };
        onSuccess?.(result);
        return result;
      } catch (error: any) {
        console.error("Deposit failed:", error);
        
        // Viem provides much better error messages with decoded contract errors
        let message = "Failed to deposit funds";
        
        if (error?.name === "ContractFunctionExecutionError") {
          // Viem automatically decodes custom errors!
          message = error.shortMessage || error.message;
        } else if (error?.message) {
          if (error.message.includes("insufficient funds")) {
            message = "Insufficient funds for gas or tokens";
          } else if (error.message.includes("user rejected")) {
            message = "Transaction rejected by user";
          } else {
            message = error.message;
          }
        }
        
        toast.error(message);
        onError?.(error);
        throw error;
      } finally {
        setIsDepositing(false);
      }
    },
    [walletClient, address, publicClient, onSuccess, onError]
  );

  /**
   * Cancel escrow (employer only, before deadline)
   */
  const cancel = useCallback(
    async (taskId: string, reason = "Cancelled by employer"): Promise<EscrowTransaction> => {
      setIsCancelling(true);
      try {
        toast.info("Cancelling escrow...", { id: "cancel" });
 
        // Gọi BACKEND API
        const response = await fetch(`${SLICE_API_URL}escrow/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          },
          body: JSON.stringify({ taskId: taskId, reason: reason })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to cancel escrow');
        }
        toast.success("Escrow cancelled successfully", { id: "cancel" });
        const result = { txHash: data.txHash, taskId };
        onSuccess?.(result);
        return result;
      } catch (error: any) {
        console.error("Cancel failed:", error);
        toast.error(error.message || "Failed to cancel escrow");
        onError?.(error);
        throw error;
      } finally {
        setIsCancelling(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Admin release escrow (calls backend /tasks/:id/release which uses contract release())
   * This is for employer approving completed work - NOT permissionless deadline release
   */
  const adminReleaseEscrow = useCallback(
    async (taskId: string, reason = "Task completed") => {
      setIsReleasing(true);
      try {
        const token = getToken();
        if (!token) {
          throw new Error("Please login again!");
        }
        console.log("Token for adminReleaseEscrow:", token);
        // Call backend API which handles admin release
        const apiUrl = (`${SLICE_API_URL}tasks/${taskId}/release`);
        console.log("🔗 Calling API:", apiUrl);
        console.log("📦 Payload:", { reason });

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            reason: reason  // Only send reason, taskId is in URL
          })
        });
        // 2. Kiểm tra response status TRƯỚC KHI parse JSON
        if (!response.ok) {
          // Try parse as JSON first (backend may return error details)
          let errorMessage = `Server error (${response.status})`;
          try {
            const errorData = await response.json();
            console.error("❌ API Error Status:", response.status);
            console.error("❌ API Error Details:", errorData);
            
            // Handle specific error cases
            if (errorData.details === "Admin wallet not configured") {
              errorMessage = "Backend configuration error: Admin wallet not set up. Please contact support.";
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            // If JSON parse fails, try text
            const errorText = await response.text();
            console.error("❌ API Error Body:", errorText);
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // 3. Chỉ parse JSON khi status là 200-299
        const data = await response.json();

        toast.success("Payment released successfully");
        onSuccess?.({ txHash: data.txHash, taskId });
        return { txHash: data.txHash, taskId };

      } catch (error: any) {
        console.error("Release failed:", error);
        toast.error(error.message);
        onError?.(error);
        throw error;
      } finally {
        setIsReleasing(false);
      }
    },
    [onSuccess, onError]
  );

  // Auto release escrow when submit work after feedbacked 
  const releaseAfterFeedback = useCallback(
    async (taskId: string, reason = "Work submitted after feedback"): Promise<EscrowTransaction> => {
      setIsReleasing(true);
      try {
        const token = getToken();
        if (!token) {
          throw new Error("Please login again!");
        }
        // Call backend API which handles admin release
        const apiUrl = (`${SLICE_API_URL}/complete/${taskId}`);
        console.log("🔗 Calling API:", apiUrl);
        console.log("📦 Payload:", { reason })
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
            },
          body: JSON.stringify({ reason }) // Only send reason, taskId is in URL
        });
        if (!response.ok) {
          // Try parse as JSON first (backend may return error details)
          let errorMessage = `Server error (${response.status})`;
          try {
            const errorData = await response.json();
            console.error("❌ API Error Status:", response.status);
            console.error("❌ API Error Details:", errorData);
            
            // Handle specific error cases
            if (errorData.details === "Admin wallet not configured") {
              errorMessage = "Backend configuration error: Admin wallet not set up. Please contact support.";
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            // If JSON parse fails, try text
            const errorText = await response.text();
            console.error("❌ API Error Body:", errorText);
            errorMessage = errorText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        const data = await response.json();

        toast.success("Payment released successfully");
        onSuccess?.({ txHash: data.txHash, taskId });
        return { txHash: data.txHash, taskId };
      } catch (error: any) {
        console.error("Release failed:", error);
        toast.error(error.message);
        onError?.(error);
        throw error;
      } finally {
        setIsReleasing(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Permissionless release after deadline
   * Can be called by anyone after deadline passes
   * - If work submitted but no feedback: release to freelancer
   * - If no work submitted: release to employer
   * 
   * Calls backend API instead of direct contract interaction
   */
  const releaseAfterDeadline = useCallback(
    async (
      taskId: string,
      recipientAddress: Address,
      reason: string
    ): Promise<EscrowTransaction> => {
      setIsReleasing(true);

      try {
        const token = getToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        toast.info("Releasing funds after deadline...");

        // Call backend API to handle release after deadline
        const apiUrl = `${SLICE_API_URL}tasks/${taskId}/release-after-deadline`;
        console.log("🔗 Calling API:", apiUrl);
        console.log("📦 Payload:", { recipientAddress, reason });

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            recipientAddress,
            reason
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle DEADLINE_NOT_REACHED error with detailed message
          if (errorData.code === "DEADLINE_NOT_REACHED") {
            const detailedError = new Error(errorData.error || "Deadline has not passed yet");
            (detailedError as any).code = "DEADLINE_NOT_REACHED";
            throw detailedError;
          }
          
          throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        
        toast.success("Funds released successfully!");
        
        const result = { txHash: data.txHash, taskId };
        onSuccess?.(result);
        return result;
      } catch (error: any) {
        console.error("Release after deadline failed:", error);
        
        let message = "Failed to release funds";
        
        // Check error code first
        if (error?.code === "DEADLINE_NOT_REACHED") {
          message = error.message || "Deadline has not been reached yet";
        } else if (error?.message) {
          if (error.message.includes("deadline not reached") || error.message.includes("Chưa đến hạn")) {
            message = error.message;
          } else if (error.message.includes("settled")) {
            message = "Escrow already settled";
          } else if (error.message.includes("invalid recipient")) {
            message = "Invalid recipient address";
          } else if (error.message.includes("Not authenticated")) {
            message = "Please login to continue";
          } else {
            message = error.message;
          }
        }
        
        toast.error(message);
        onError?.(error);
        throw error;
      } finally {
        setIsReleasing(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Read escrow info from chain
   * Fixed: Handle struct tuple format from contract
   */
  const readEscrow = useCallback(
    async (taskId: string) => {
      if (!publicClient) throw new Error("Public client not available");

      try {
        const result = await publicClient.readContract({
          address: TASK_ESCROW_POOL_ADDRESS as Address,
          abi: ESCROW_ABI,
          functionName: "escrows",
          args: [BigInt(taskId)]
        });

        // Handle tuple array result from contract (anonymous tuple)
        // Returns: [address, address, uint256, uint256, uint8, string]
        const info = result as [Address, Address, bigint, bigint, number, string];

        return {
          employer: info[0],
          freelancer: info[1],
          amount: info[2].toString(),
          deadline: Number(info[3]),
          settled: info[4] !== 0, // status: 0 = active, 1 = completed, 2 = cancelled
          externalTaskId: info[5]
        };
      } catch (error: any) {
        console.error("Failed to read escrow:", error);
        throw new Error(`Failed to read escrow data: ${error.message}`);
      }
    },
    [publicClient]
  );

  /**
   * Get taskId from externalTaskId
   */
  const getTaskIdFromExternal = useCallback(
    async (externalTaskId: string): Promise<string> => {
      if (!publicClient) throw new Error("Public client not available");

      const taskId = await publicClient.readContract({
        address: TASK_ESCROW_POOL_ADDRESS as Address,
        abi: ESCROW_ABI,
        functionName: "externalToInternal",
        args: [externalTaskId]
      }) as bigint;
      
      return taskId.toString();
    },
    [publicClient]
  );

  return {
    deposit,
    cancel,
    adminReleaseEscrow,
    releaseAfterFeedback,
    releaseAfterDeadline,
    readEscrow, // Fixed: Now properly handles struct tuple
    getTaskIdFromExternal,
    checkAllowance,
    approveToken,
    isDepositing,
    isCancelling,
    isReleasing
  };
}
