import { useState } from "react";
import { toast } from "sonner";
import { useConnect, useDisconnect } from "wagmi";
import { useDNPAYSuperAppAuth } from "@/hooks/useDNPAYSuperAppAuth";
import { useWeb3AuthOnboarding } from "@/hooks/useWeb3AuthOnboarding";
import { useSignupStore } from "./Signup";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { AuthLoginData } from "@/hooks/useDNPaySSO";
import { Spinner } from "@/components/Shared/UI";
import { walletService } from "@/lib/api/auth-api";
import DNPayOnboardingModal from "./DNPayOnboardingModal";

const SuperAppAuthHandler = () => {
    const [onboardingData, setOnboardingData] = useState<{
        onboardingToken: string;
        email: string;
        shouldAutoCreate?: boolean;
    } | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);

    const { setScreen, setEmbeddedWallet } = useSignupStore();
    const { setShowAuthModal } = useAuthModalStore();
    const { createEmbeddedWallet } = useWeb3AuthOnboarding();
    const { connectAsync, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const handleSuccess = (data: AuthLoginData) => {
        console.log("SuperApp Auth Success:", data);
        toast.success("Welcome back!");
        // KHÔNG navigate để giữ provider trong memory
        // Embedded wallet provider sẽ mất nếu reload page
    };

    const handleError = (error: string) => {
        console.error("SuperApp Auth Error:", error);
        toast.error(`Authentication failed: ${error}`);
    };

    const handleOnboardingRequired = (data: {
        onboardingToken: string;
        email: string;
        shouldAutoCreate?: boolean;
    }) => {
        console.log("SuperApp Onboarding Required:", data);
        setOnboardingData(data);

        // Nếu shouldAutoCreate = false → User đã có wallet, chỉ cần tạo Lens profile
        if (data.shouldAutoCreate === false) {
            console.log("Wallet exists. Opening signup modal to create Lens profile...");
            setScreen("choose");
            setShowAuthModal(true, "signup");
            return;
        }

        // Nếu shouldAutoCreate = true → Hiển thị modal để user chọn phương thức
        if (data.shouldAutoCreate === true && data.onboardingToken) {
            console.log("Showing onboarding modal for user to choose wallet option...");
            setShowOnboardingModal(true);
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
        setShowOnboardingModal(false);
        try {            
            console.log("Creating embedded wallet for:", data.email);
            const result = await createEmbeddedWallet(data.onboardingToken);
            
            if (!result?.success) {
                throw new Error("Failed to create embedded wallet");
            }

            console.log("Embedded wallet created:", result.walletAddress);

            // Nếu là user mới (chưa có Lens account)
            if (result.isNewUser && result.walletAddress && result.provider) {
                setEmbeddedWallet(result.walletAddress, result.provider);
                toast.success("Wallet created! Please choose your username.");
                setShowAuthModal(true, "signup");
                setScreen("choose");
            } else if (result.lensTokens) {
                // User đã có Lens account, auto-login thành công
                console.log("Auto-login successful with existing Lens account");
                toast.success("Welcome back!");
                // KHÔNG reload để giữ provider trong memory
            }
        } catch (err: any) {
            console.error("Auto-create wallet error:", err);
            toast.error(err.message || "Failed to create wallet automatically");
        } finally {
            setIsCreating(false);
        }
    };

    const handleConnectExistingWallet = async () => {
        if (!onboardingData?.onboardingToken) {
            toast.error("Missing onboarding token");
            return;
        }

        setShowOnboardingModal(false);
        setIsCreating(true);

        const connectWallet = async (retryCount = 0): Promise<void> => {
            try {
                console.log(`Connecting existing wallet (MetaMask)... Attempt ${retryCount + 1}`);
                
                // Tìm MetaMask connector
                const injectedConnector = connectors.find(c => c.id === "injected");
                if (!injectedConnector) {
                    throw new Error("MetaMask not found. Please install MetaMask extension.");
                }

                // Kiểm tra nếu connector đã connected, disconnect trước
                if (injectedConnector.status === "connected") {
                    console.log("Connector already connected, disconnecting first...");
                    await disconnect();
                    // Đợi một chút để đảm bảo disconnect hoàn tất
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Connect MetaMask
                console.log("Connecting to MetaMask...");
                const result = await connectAsync({ connector: injectedConnector });
                const walletAddress = result.accounts[0];
                console.log("MetaMask connected:", walletAddress);

                // Link wallet với DNPAY
                console.log("Linking wallet to DNPAY...");
                await walletService.linkWalletToDNPAY(
                    onboardingData.onboardingToken,
                    walletAddress
                );
                
                toast.success("Wallet linked successfully!");
                console.log("Wallet linked successfully");

                // Mở signup modal để tạo Lens profile
                toast.info("Please create your Lens profile to continue");
                setShowAuthModal(true, "signup");
                setScreen("choose");
            } catch (err: any) {
                console.error(`Failed to connect existing wallet (Attempt ${retryCount + 1}):`, err);
                
                // Xử lý lỗi "Connector already connected" với auto retry
                if (err?.message?.includes("Connector already connected") && retryCount < 2) {
                    console.log(`Auto-retrying after disconnect... (${retryCount + 1}/2)`);
                    await disconnect();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // Recursive retry
                    return connectWallet(retryCount + 1);
                }
                
                // Xử lý các lỗi khác
                if (err?.message?.includes("User rejected")) {
                    toast.error("You rejected the connection request");
                } else if (err?.message?.includes("MetaMask not found")) {
                    toast.error("Please install MetaMask extension");
                } else if (err?.message?.includes("Connector already connected")) {
                    toast.error("Connection conflict. Please try again.");
                } else {
                    toast.error(err.message || "Failed to connect wallet");
                }
                
                // Hiển thị lại modal nếu có lỗi (trừ khi đã thành công một phần)
                if (!err?.message?.includes("Wallet linked")) {
                    setShowOnboardingModal(true);
                }
                
                throw err; // Re-throw để finally block chạy
            }
        };

        try {
            await connectWallet();
        } catch (err) {
            // Error đã được xử lý trong connectWallet
        } finally {
            setIsCreating(false);
        }
    };

    if (!isSuperAppMode) {
        return null;
    }

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

    return (
        <>
            <DNPayOnboardingModal
                open={showOnboardingModal}
                onClose={() => {
                    setShowOnboardingModal(false);
                    setOnboardingData(null);
                }}
                onHasWallet={handleConnectExistingWallet}
                onCreateWallet={() => {
                    if (onboardingData) {
                        handleAutoCreateWallet(onboardingData);
                    }
                }}
                isCreatingWallet={isCreating}
            />
        </>
    );
};

export default SuperAppAuthHandler;
