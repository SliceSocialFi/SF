import { useState } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/lib/api/auth-api';
import { useWeb3AuthLogin } from './useWeb3AuthLogin';

interface OnboardingResult {
    success: boolean;
    walletAddress?: string;
    lensTokens?: {
        accessToken: string;
        refreshToken: string;
    };
}

/**
 * Hook để xử lý onboarding với Embedded Wallet (Web3Auth)
 * 
 * Flow:
 * 1. Mint Web3Auth JWT token từ onboarding token
 * 2. Connect Web3Auth để tạo embedded wallet mới
 * 3. Register embedded wallet với backend
 * 4. Authenticate với Lens Protocol
 */
export const useWeb3AuthOnboarding = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login: web3AuthLogin } = useWeb3AuthLogin();

    const createEmbeddedWallet = async (onboardingToken: string): Promise<OnboardingResult> => {
        setIsLoading(true);
        try {
            // Step 1: Mint Web3Auth token từ onboarding token
            toast.info("Creating your embedded wallet...");
            const web3AuthToken = await walletService.mintWeb3AuthToken(onboardingToken);
            
            if (!web3AuthToken) {
                throw new Error("Failed to mint Web3Auth token");
            }

            // Step 2: Connect Web3Auth với JWT token để tạo wallet mới
            const { provider, address } = await walletService.connectWeb3Auth(web3AuthToken);
            
            if (!provider || !address) {
                throw new Error("Failed to create embedded wallet");
            }

            toast.success(`Wallet created: ${address.slice(0, 6)}...${address.slice(-4)}`);

            // Step 3: Register embedded wallet với backend
            toast.info("Registering your wallet...");
            await walletService.registerEmbeddedWallet(onboardingToken, address);
            
            toast.success("Wallet registered successfully!");

            // Step 4: Authenticate với Lens Protocol
            toast.info("Authenticating with Lens Protocol...");
            const lensTokens = await web3AuthLogin(provider, address);

            if (!lensTokens) {
                throw new Error("Failed to authenticate with Lens Protocol");
            }

            return {
                success: true,
                walletAddress: address,
                lensTokens
            };
        } catch (error: any) {
            console.error("Embedded Wallet Onboarding Error:", error);
            toast.error(error.message || "Failed to create embedded wallet");
            return { success: false };
        } finally {
            setIsLoading(false);
        }
    };

    return {
        createEmbeddedWallet,
        isLoading
    };
};
