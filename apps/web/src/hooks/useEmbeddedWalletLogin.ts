import { useState } from 'react';
import { toast } from 'sonner';
import { walletService } from '@/lib/api/auth-api';
import { useWeb3AuthLogin } from './useWeb3AuthLogin';
import { signIn } from "@/store/persisted/useAuthStore";
import { useSignupStore } from "@/components/Shared/Auth/Signup";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useEmbeddedWalletStore } from "@/store/non-persisted/useEmbeddedWalletStore";


export const useEmbeddedWalletLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { login: web3AuthLogin } = useWeb3AuthLogin();
    const { setScreen, setEmbeddedWallet } = useSignupStore();
    const { setShowAuthModal } = useAuthModalStore();
    const { setEmbeddedWallet: setGlobalEmbeddedWallet } = useEmbeddedWalletStore();

    const loginWithEmbeddedWallet = async (
        walletAddress: string,
        web3AuthToken: string
    ) => {
        setIsLoading(true);
        try {
            toast.info("Connecting to your embedded wallet...");

            const { provider, address } = await walletService.connectWeb3Auth(web3AuthToken);
            if (address.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new Error("Wallet address mismatch");
            }

            toast.success("Embedded wallet connected! Authenticating with Lens Protocol...");
            setGlobalEmbeddedWallet(address, provider, web3AuthToken);
            
            const lensTokens = await web3AuthLogin(provider, address);
            console.log("Lens Tokens:", lensTokens);

            if (!lensTokens) {
                toast.error("Failed to authenticate with embedded wallet");
                throw new Error("Failed to authenticate with Lens Protocol");
            }

            if (lensTokens?.isNewUser) {
                toast.info("Please create a Lens profile to continue");
                console.log("New user detected, wallet address:", address);
                if (address && provider) {
                    setEmbeddedWallet(address, provider);
                }
                setScreen("choose");
                setShowAuthModal(true, "signup");
                return;
            }

            signIn({
                accessToken: lensTokens.accessToken,
                refreshToken: lensTokens.refreshToken
            });

            toast.success("Logged in successfully!");
            setShowAuthModal(false);
            
            setTimeout(() => {
                window.location.reload();
            }, 300);
        } catch (error: any) {
            console.error("Embedded Wallet Login Error:", error);
            toast.error(error.message || "Failed to login with embedded wallet");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        loginWithEmbeddedWallet,
        isLoading
    };
};
