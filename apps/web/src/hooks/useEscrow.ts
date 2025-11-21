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
        const response = await fetch(`${SLICE_API_URL}/escrow/cancel`, {
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
        const apiUrl = (`${SLICE_API_URL}/tasks/${taskId}/release`);
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
          // Nếu 404, thường text sẽ là "Not Found" hoặc rỗng
          const errorText = await response.text(); 
          console.error("❌ API Error Status:", response.status);
          console.error("❌ API Error Body:", errorText);
          throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
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
          const errorText = await response.text();
          console.error("❌ API Error Status:", response.status);
          console.error("❌ API Error Body:", errorText);
          throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
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
   * Read escrow info from chain
   */
  const readEscrow = useCallback(
    async (taskId: string) => {
      if (!publicClient) throw new Error("Public client not available");

      const info = await publicClient.readContract({
        address: TASK_ESCROW_POOL_ADDRESS as Address,
        abi: ESCROW_ABI,
        functionName: "escrows",
        args: [BigInt(taskId)]
      }) as [Address, Address, bigint, bigint, boolean, string];

      return {
        employer: info[0],
        freelancer: info[1],
        amount: info[2].toString(),
        deadline: Number(info[3]),
        settled: Boolean(info[4]),
        externalTaskId: info[5]
      };
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
    releaseAfterDeadline: adminReleaseEscrow, // Alias for backward compatibility
    readEscrow,
    getTaskIdFromExternal,
    checkAllowance,
    approveToken,
    isDepositing,
    isCancelling,
    isReleasing
  };
}
