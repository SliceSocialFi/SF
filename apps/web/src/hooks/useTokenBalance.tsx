import { useReadContract } from 'wagmi';
import { erc20Abi, type Address, formatUnits } from 'viem';
import { de } from 'zod/v4/locales';

interface UseTokenBalanceProps {
  walletAddress: Address;
  chainId: number;
  tokenAddress: Address;
}

const useTokenBalance = ({ walletAddress, chainId, tokenAddress }: UseTokenBalanceProps) => {
    const { data: balance, isLoading, refetch } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress],
        chainId: chainId,
        query: {
        enabled: !!walletAddress && !!tokenAddress && !!chainId, 
        refetchInterval: 10000, 
        }
    });

    const { data: decimals } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: chainId,
        query: { enabled: !!tokenAddress && !!chainId }
    });

    const formatted = (balance !== undefined && decimals !== undefined) 
        ? formatUnits(balance, decimals) 
        : '0';

    return {
        balance,       // BigInt
        decimals,      // number
        formatted,     // string
        isLoading,
        refetch        // Hàm để gọi cập nhật thủ công
    };
};

export default useTokenBalance;