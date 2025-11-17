import { useEffect, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, parseEther, type Address, type Hex } from "viem";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
  useSwitchChain,
  useAccount
} from "wagmi";
import { BRIDGE_GATEWAY_BSC_ABI } from "@slice/data/abis";
import { BSC_POOL_CONTRACT } from "@slice/data/contracts";

interface BridgeProps {
    srcChainId: number;
    destChainId: number;
    userAddress: Address;
    recipientAddress: Address;
    tokenAddress: Address;
}

interface PendingLockState {
    amountToLock: bigint;
    recipient: Address;
}

const useBridge = ({
    srcChainId,
    destChainId,
    userAddress,
    recipientAddress,
    tokenAddress,
}: BridgeProps) => {
    const [pendingLock, setPendingLock] = useState<PendingLockState | null>(null);
    const { switchChainAsync } = useSwitchChain();
    const { chainId: currentChainId } = useAccount();

    const { 
        data: allowance, 
        refetch: refetchAllowance,
        isError: isAllowanceError,
        error: allowanceError,
        isLoading: isAllowanceLoading,
        status: allowanceStatus
    } = useReadContract({
        chainId: srcChainId,
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, BSC_POOL_CONTRACT as Address],
        query: {
            enabled: Boolean(srcChainId && tokenAddress && userAddress),
            refetchInterval: 3000
        }
    });

    // Refetch allowance when chain or addresses change
    useEffect(() => {
        if (srcChainId && tokenAddress && userAddress) {
            refetchAllowance();
        }
    }, [srcChainId, tokenAddress, userAddress, refetchAllowance, allowanceStatus, isAllowanceLoading, isAllowanceError, allowanceError]);

    const {
        data: approveHash,
        writeContract: approve,
        isPending: isApproving,
    } = useWriteContract();

    const { data: approveReceipt, isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({
        hash: approveHash,
        chainId: srcChainId,
        query: { enabled: Boolean(approveHash) }
    });

    const {
        data: lockHash,
        writeContract: lock,
        isPending: isLocking,
    } = useWriteContract();

    const { data: lockReceipt, isLoading: isConfirmingLock } = useWaitForTransactionReceipt({
        hash: lockHash,
        query: { enabled: Boolean(lockHash) }
    });
    
    useEffect(() => {
        if (approveReceipt?.status === "success" && pendingLock) {
            refetchAllowance();
            lock({
                chainId: srcChainId,
                address: BSC_POOL_CONTRACT as Address,
                abi: BRIDGE_GATEWAY_BSC_ABI,
                functionName: 'lock',
                args: [
                    pendingLock.amountToLock,
                    pendingLock.recipient
                ],
            });
            setPendingLock(null);
        }
    }, [approveReceipt, pendingLock, lock, srcChainId, refetchAllowance]);

    useEffect(() => {
        if (lockReceipt?.status === "success") {
            console.log("lockReceipt:", lockReceipt)
            console.log("lockHash:", lockHash)
        }
    }, [lockReceipt]);

    // Helper function to ensure we're on the correct chain
    const ensureCorrectChain = async () => {
        if (currentChainId !== srcChainId) {
            try {
                await switchChainAsync({ chainId: srcChainId });
                toast.success("Chain switched successfully!");
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error: any) {
                console.error("Chain switch error:", error);
                toast.error(`Failed to switch chain: ${error.message}`);
                throw error;
            }
        }
    };

    const bridgeFunction = async ({ amount, onError }: any) => {
        try {
            // Ensure we're on the correct chain first
            await ensureCorrectChain();
            
            const amountToLock = parseEther(amount || '0');
            const needsApprove = allowance !== undefined && allowance < amountToLock;
            
            if (needsApprove) {
                setPendingLock({ amountToLock, recipient: recipientAddress });
                approve({
                    chainId: srcChainId,
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [
                        BSC_POOL_CONTRACT,
                        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
                    ], 
                });
            } else {
                lock({
                    chainId: srcChainId,
                    address: BSC_POOL_CONTRACT as Address,
                    abi: BRIDGE_GATEWAY_BSC_ABI,
                    functionName: 'lock',
                    args: [
                        amountToLock,
                        recipientAddress
                    ],
                });
            }

            return lockHash || approveHash;
        } catch (error) {
            console.error(error);
            onError(error);
            setPendingLock(null);
        }
    };

    const isLoading = isApproving || isConfirmingApprove || isLocking || isConfirmingLock;
    return { bridgeFunction, isLoading };
}

export default useBridge;