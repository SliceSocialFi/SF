import { useState, useEffect } from "react";
import { useDNPaySSO } from "@/hooks/useDNPaySSO";
import { toast } from "sonner";
import { useConnect } from "wagmi";

interface DNPayLoginButtonProps {
	onSuccess?: (data: { code?: string; token?: string; access_token?: string }) => void;
	className?: string;
}

const DNPayLoginButton = ({ onSuccess, className = "" }: DNPayLoginButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [onboardingData, setOnboardingData] = useState<{
		onboardingToken: string;
		email: string;
	} | null>(null);

	const { connectAsync, connectors } = useConnect();


	const handleSuccess = (data: { code?: string; token?: string; access_token?: string }) => {
		console.log("✅ handleSuccess called with data:", data);
		setIsLoading(false);
		onSuccess?.(data);
		setIsSuccess(true);
		
		// Gọi verifyDNPayToken để kiểm tra trạng thái ONBOARDING_REQUIRED
		console.log("📞 Calling verifyDNPayToken...");
		verifyDNPayToken();
	};

	const handleError = (error: string) => {
		setIsLoading(false);
		console.error("DNPAY SSO Error:", error);
	};


	const handleOnboardingRequired = async (data: { onboardingToken: string; email: string }) => {
		console.log("📋 handleOnboardingRequired called with data:", data);
		console.log("🔔 About to connect wallet...");
		setOnboardingData(data);
		// Chỉ khi ONBOARDING_REQUIRED mới trigger popup chọn ví Metamask
		await handleConnectWallet(data.onboardingToken);
	};

	const handleConnectWallet = async (onboardingToken: string) => {
		try {
			console.log("🔍 Available connectors:", connectors.map(c => c.id));
			
			// Tìm connector "injected" (Metamask/Browser wallet)
			const injectedConnector = connectors.find(c => c.id === "injected");
			
			if (!injectedConnector) {
				console.error("❌ No injected connector found");
				toast.error("No wallet found. Please install MetaMask.");
				return;
			}

			console.log("🔗 Connecting to wallet...");
			
			// Kết nối ví - popup Metamask sẽ xuất hiện ở đây
			const result = await connectAsync({ connector: injectedConnector });
			const walletAddress = result.accounts[0];
			
			console.log("💼 Wallet connected:", walletAddress);
			console.log("📤 Calling link-wallet API with:", { onboardingToken, walletAddress });

			// Gọi API link-wallet
			const response = await linkWallet(onboardingToken, walletAddress);
			console.log("✅ Link wallet response:", response);
			
			toast.success("Wallet linked successfully!");
		} catch (err) {
			console.error("❌ Failed to connect wallet:", err);
			toast.error("Failed to connect wallet. Please try again.");
		}
	};

	const { openDNPayLogin, closeDNPayPopup, verifyDNPayToken, linkWallet } = useDNPaySSO({
		onSuccess: handleSuccess,
		onError: handleError,
		onOnboardingRequired: handleOnboardingRequired,
	});


	const handleClick = () => {
		setIsLoading(true);
		openDNPayLogin();
		// Popup Metamask chỉ xuất hiện khi nhận ONBOARDING_REQUIRED từ API
	};

	useEffect(() => {
		if (isSuccess) {
			toast.success("DNPAY login successful!");
			closeDNPayPopup();
		}
	}, [isSuccess]);

	return (
		<button
			className={className}
			disabled={isLoading}
			onClick={handleClick}
			type="button"
		>
			<span>Continue with DNPAY</span>
			<img 
				src="/dnpay-logo-darkmode.png" 
				alt="DNPAY" 
				className="size-6 m-0 dark:block hidden"
				draggable={false}
				height={24}
				width={24}
			/>
			<img 
				src="/dnpay-logo-lightmode.png" 
				alt="DNPAY" 
				className="size-6 m-0 dark:hidden block"
				draggable={false}
				height={24}
				width={24}
			/>
		</button>
	);
};

export default DNPayLoginButton;
