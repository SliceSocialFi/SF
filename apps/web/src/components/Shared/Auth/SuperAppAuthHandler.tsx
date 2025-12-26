import { useState } from "react";
import { toast } from "sonner";
import { useDNPAYSuperAppAuth } from "@/hooks/useDNPAYSuperAppAuth";
import { useWeb3AuthOnboarding } from "@/hooks/useWeb3AuthOnboarding";
import { useSignupStore } from "./Signup";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { AuthLoginData } from "@/hooks/useDNPaySSO";
import { Spinner } from "@/components/Shared/UI";

const SuperAppAuthHandler = () => {
    const [onboardingData, setOnboardingData] = useState<{
        onboardingToken: string;
        email: string;
        shouldAutoCreate?: boolean;
    } | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const { setScreen, setEmbeddedWallet } = useSignupStore();
    const { setShowAuthModal } = useAuthModalStore();
    const { createEmbeddedWallet } = useWeb3AuthOnboarding();

    const handleSuccess = (data: AuthLoginData) => {
        console.log("✅ SuperApp Auth Success:", data);
        toast.success("Welcome back!");
        // Data đã được xử lý trong hook, không cần làm gì thêm
    };

    const handleError = (error: string) => {
        console.error("❌ SuperApp Auth Error:", error);
        toast.error(`Authentication failed: ${error}`);
    };

    const handleOnboardingRequired = (data: {
        onboardingToken: string;
        email: string;
        shouldAutoCreate?: boolean;
    }) => {
        console.log("⚠️ SuperApp Onboarding Required:", data);
        setOnboardingData(data);

        // If shouldAutoCreate = false → wallet already exists, just open signup
        if (data.shouldAutoCreate === false) {
            console.log("📝 Wallet exists. Opening signup modal to create Lens profile...");
            setScreen("choose");
            setShowAuthModal(true, "signup");
            return;
        }

        // If shouldAutoCreate = true AND has token → create wallet then signup  
        if (data.shouldAutoCreate && data.onboardingToken) {
            handleAutoCreateWallet(data);
        }
    };

    const { isProcessing, isSuperAppMode } = useDNPAYSuperAppAuth({
        onSuccess: handleSuccess,
        onError: handleError,
        onOnboardingRequired: handleOnboardingRequired
    });

    const handleAutoCreateWallet = async (data: {
        onboardingToken: string;
        email: string;
    }) => {
        setIsCreating(true);
        try {
            console.log("🔨 Auto-creating embedded wallet for:", data.email);
            
            const result = await createEmbeddedWallet(data.onboardingToken);
            
            if (!result?.success) {
                throw new Error("Failed to create embedded wallet");
            }

            console.log("✅ Embedded wallet created:", result.walletAddress);

            // Nếu là user mới (chưa có Lens account)
            if (result.isNewUser && result.walletAddress && result.provider) {
                console.log("⚠️ New user detected, needs to create Lens profile");
                setEmbeddedWallet(result.walletAddress, result.provider);
                
                // Chuyển sang màn hình signup để chọn username
                toast.success("Wallet created! Please choose your username.");
                setShowAuthModal(true, "signup");
                setScreen("choose");
            } else if (result.lensTokens) {
                // User đã có Lens account, login thành công
                console.log("✅ Auto-login successful with existing Lens account");
                toast.success("Welcome back!");
                // Tokens đã được xử lý trong createEmbeddedWallet hook
            }
        } catch (err: any) {
            console.error("Auto-create wallet error:", err);
            toast.error(err.message || "Failed to create wallet automatically");
        } finally {
            setIsCreating(false);
        }
    };

    // Không render gì nếu không phải SuperApp mode
    if (!isSuperAppMode) {
        return null;
    }

    // Hiển thị loading state khi đang xử lý
    if (isProcessing || isCreating) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="rounded-lg bg-white p-8 shadow-xl dark:bg-[#121212]">
                    <div className="flex flex-col items-center space-y-4">
                        <Spinner className="h-8 w-8" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">
                                {isCreating ? "Creating your wallet..." : "Authenticating..."}
                            </h3>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                {isCreating 
                                ? "Please wait while we set up your account" 
                                : "Please wait while we verify your identity"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default SuperAppAuthHandler;
