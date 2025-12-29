import { useState } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/lib/api/auth-api';
import { useWeb3AuthLogin } from './useWeb3AuthLogin';
import { useEmbeddedWalletStore } from '@/store/non-persisted/useEmbeddedWalletStore';

interface OnboardingResult {
    success: boolean;
    walletAddress?: string;
    lensTokens?: {
        accessToken: string;
        refreshToken: string;
    };
    isNewUser?: boolean;
    provider?: any;
}

export const useWeb3AuthOnboarding = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login: web3AuthLogin } = useWeb3AuthLogin();
    const { setEmbeddedWallet: setGlobalEmbeddedWallet } = useEmbeddedWalletStore();

    const createEmbeddedWallet = async (onboardingToken: string): Promise<OnboardingResult> => {
        setIsLoading(true);
        try {
            toast.info("Creating your embedded wallet...");

            const web3AuthToken = await walletService.mintWeb3AuthToken(onboardingToken);
            console.log("Minted Web3Auth Token:", web3AuthToken);
            if (!web3AuthToken) {
                throw new Error("Failed to mint Web3Auth token");
            }

            const { provider, address } = await walletService.connectWeb3Auth(web3AuthToken);
            console.log("Connected Embedded Wallet:", address);
            if (!provider || !address) {
                throw new Error("Failed to create embedded wallet");
            }

            toast.success(`Wallet created: ${address.slice(0, 6)}...${address.slice(-4)}`);
            
            // ✅ Lưu embedded wallet provider vào global store
            console.log("💾 Saving embedded wallet to global store (Onboarding):", address);
            setGlobalEmbeddedWallet(address, provider, web3AuthToken);

            toast.info("Registering your wallet...");
            await walletService.registerEmbeddedWallet(onboardingToken, address);
            toast.success("Wallet registered successfully!");

            toast.info("Checking Lens Protocol account...");
            const lensResult = await web3AuthLogin(provider, address);
            
            // Nếu là user mới (chưa có Lens Account)
            if (lensResult?.isNewUser) {
                toast.info("Please create a Lens profile to continue");
                return {
                    success: true,
                    walletAddress: address,
                    isNewUser: true,
                    provider
                };
            }

            if (!lensResult || !lensResult.accessToken) {
                throw new Error("Failed to authenticate with Lens Protocol");
            }

            return {
                success: true,
                walletAddress: address,
                lensTokens: {
                    accessToken: lensResult.accessToken,
                    refreshToken: lensResult.refreshToken
                },
                isNewUser: false
            };
        } catch (error: any) {
            console.error("Embedded Wallet Onboarding Error:", error);
            toast.error(error.message || "Failed to create embedded wallet");
            return { success: false };
        }
    };

    return {
        createEmbeddedWallet,
        isLoading
    };
};
