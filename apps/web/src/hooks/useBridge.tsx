import { useEffect, useState } from "react";
import { toast } from "sonner";
import { erc20Abi, parseEther, encodeFunctionData, type Address } from "viem";
import { getChains } from "@/helpers/getChains";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,  
  useSwitchChain,
  useAccount
} from "wagmi";
import {
    BRIDGE_GATEWAY_BSC_ABI,
    BRIDGE_MINTER_LENS_ABI,
    LENS_ACCOUNT_ABI
} from "@slice/data/abis";
import {
    BSC_POOL_CONTRACT,
    LENS_BRIDGE_MINTER_CONTRACT
} from "@slice/data/constants";

interface BridgeProps {
    srcChainId: number;
    destChainId: number;
    userAddress: Address;
    recipientAddress: Address;
    tokenAddress: Address;
}

interface PendingBridgeState {
    amount: bigint;
    recipient: Address;
}

interface BridgeMethodInfo {
    contractAddress: Address;
    contractAbi: any;
    functionName: string;
}

const MAX_UINT =
  0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;

const useBridge = ({
    srcChainId,
    destChainId,
    userAddress,
    recipientAddress,
    tokenAddress,
}: BridgeProps) => {
    const [pendingBridge, setPendingBridge] = useState<PendingBridgeState | null>(null);
    const [bridgeMethodInfo, setBridgeMethodInfo] = useState<BridgeMethodInfo | null>(null);
    const { switchChainAsync } = useSwitchChain();
    const { chainId: currentChainId } = useAccount();
    const chains = getChains();

    const isTopUp = destChainId === chains.lensChain.chainId;
    
    useEffect(() => {
        if (isTopUp) {
            setBridgeMethodInfo({
                contractAddress: BSC_POOL_CONTRACT as Address,
                contractAbi: BRIDGE_GATEWAY_BSC_ABI,
                functionName: 'lock'
            });
        } else {
            setBridgeMethodInfo({
                contractAddress: userAddress,
                contractAbi: LENS_ACCOUNT_ABI,
                functionName: 'executeTransaction'
            });
        }
    }, [destChainId, isTopUp, userAddress]);

    const allowanceSpender = isTopUp
        ? (BSC_POOL_CONTRACT as Address)
        : (LENS_BRIDGE_MINTER_CONTRACT as Address);

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
        args: [userAddress, allowanceSpender],
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
    }, [
        srcChainId,
        tokenAddress,
        userAddress,
        refetchAllowance,
        allowanceStatus,
        isAllowanceLoading,
        isAllowanceError,
        allowanceError
    ]);

    const {
        data: approveHash,
        writeContract: approve,
        isPending: isApproving,
    } = useWriteContract();

    const { data: approveReceipt, isLoading: isConfirmingApprove } =
        useWaitForTransactionReceipt({
            hash: approveHash,
            chainId: srcChainId,
            query: { enabled: Boolean(approveHash) }
        });

    const {
        data: bridgeHash,
        writeContract: bridge,
        isPending: isBridging,
    } = useWriteContract();

    const { data: bridgeReceipt, isLoading: isConfirmingBridge } =
        useWaitForTransactionReceipt({
            hash: bridgeHash,
            query: { enabled: Boolean(bridgeHash) }
        });
    
    useEffect(() => {
        if (!approveReceipt || approveReceipt.status !== "success") return;
        if (!pendingBridge || !bridgeMethodInfo) return;

        (async () => {
            try {
                await refetchAllowance();

                if (isTopUp) {
                    bridge({
                        chainId: srcChainId,
                        address: bridgeMethodInfo.contractAddress,
                        abi: bridgeMethodInfo.contractAbi,
                        functionName: bridgeMethodInfo.functionName,
                        args: [pendingBridge.amount, pendingBridge.recipient],
                    });
                } else {
                    // Lens -> BSC: gọi executeTransaction(
                    //   LENS_BRIDGE_MINTER_CONTRACT,
                    //   0,
                    //   burnToBsc(amount, recipient)
                    // )
                    const burnCalldata = encodeFunctionData({
                        abi: BRIDGE_MINTER_LENS_ABI,
                        functionName: "burnToBsc",
                        args: [pendingBridge.amount, pendingBridge.recipient],
                    });

                    bridge({
                        chainId: srcChainId,
                        address: bridgeMethodInfo.contractAddress, // Lens Account
                        abi: bridgeMethodInfo.contractAbi, // IAccount ABI
                        functionName: bridgeMethodInfo.functionName, // "executeTransaction"
                        args: [LENS_BRIDGE_MINTER_CONTRACT as Address, 0n, burnCalldata],
                    });
                }
            } finally {
                setPendingBridge(null);
            }
        })();
    }, [
        approveReceipt,
        pendingBridge,
        bridgeMethodInfo,
        bridge,
        srcChainId,
        refetchAllowance,
        isTopUp,
    ]);

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
            if (!bridgeMethodInfo) return;

            // Ensure we're on the correct chain first
            await ensureCorrectChain();
            
            const amountParsed = parseEther(amount || '0');
            const needsApprove = allowance !== undefined && allowance < amountParsed;

            if (isTopUp) {
                if (needsApprove) {
                    setPendingBridge({ amount: amountParsed, recipient: recipientAddress });
                    approve({
                        chainId: srcChainId,
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [
                            bridgeMethodInfo.contractAddress,
                            MAX_UINT
                        ], 
                    });
                } else {
                    bridge({
                        chainId: srcChainId,
                        address: bridgeMethodInfo.contractAddress,
                        abi: bridgeMethodInfo.contractAbi,
                        functionName: bridgeMethodInfo.functionName,
                        args: [
                            amountParsed,
                            recipientAddress
                        ],
                    });
                }
            } else {
                if (needsApprove) {
                    setPendingBridge({
                        amount: amountParsed,
                        recipient: recipientAddress,
                    });

                    // calldata cho token.approve(LENS_BRIDGE_MINTER_CONTRACT, MAX_UINT)
                    const approveCalldata = encodeFunctionData({
                        abi: erc20Abi,
                        functionName: "approve",
                        args: [LENS_BRIDGE_MINTER_CONTRACT as Address, MAX_UINT],
                    });

                    // Gọi Lens Account: executeTransaction(tokenAddress, 0, approveCalldata)
                    approve({
                        chainId: srcChainId,
                        address: userAddress, // Lens Account
                        abi: LENS_ACCOUNT_ABI,
                        functionName: "executeTransaction",
                        args: [tokenAddress, 0n, approveCalldata],
                    });
                } else {
                    // Đủ allowance -> gọi burnToBsc qua executeTransaction luôn
                    const burnCalldata = encodeFunctionData({
                        abi: BRIDGE_MINTER_LENS_ABI,
                        functionName: "burnToBsc",
                        args: [amountParsed, recipientAddress],
                    });

                    bridge({
                        chainId: srcChainId,
                        address: userAddress, // Lens Account
                        abi: LENS_ACCOUNT_ABI,
                        functionName: "executeTransaction",
                        args: [LENS_BRIDGE_MINTER_CONTRACT as Address, 0n, burnCalldata],
                    });
                }
            }

            return bridgeHash || approveHash;
        } catch (error) {
            console.error(error);
            onError?.(error);
            setPendingBridge(null);
        }
    };

    const isLoading = isApproving || isConfirmingApprove || isBridging || isConfirmingBridge;
    return { bridgeFunction, isLoading, bridgeHash, bridgeReceipt };
}

export default useBridge;