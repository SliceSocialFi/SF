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
		setIsLoading(false);
		onSuccess?.(data);
		setIsSuccess(true);
		verifyDNPayToken();
	};

	const handleError = (error: string) => {
		setIsLoading(false);
		console.error("DNPAY SSO Error:", error);
	};


	const handleOnboardingRequired = async (data: { onboardingToken: string; email: string }) => {
		setOnboardingData(data);
		await handleConnectWallet(data.onboardingToken);
	};

	const handleConnectWallet = async (onboardingToken: string) => {
		try {
			const injectedConnector = connectors.find(c => c.id === "injected");
			
			if (!injectedConnector) {
				toast.error("No wallet found. Please install MetaMask.");
				return;
			}

			const result = await connectAsync({ connector: injectedConnector });
			const walletAddress = result.accounts[0];
			
			const response = await linkWallet(onboardingToken, walletAddress);
			console.log("🔗 Link wallet response:", response);
		} catch (err) {
			console.error("Failed to connect wallet:", err);
			toast.error("Failed to connect wallet");
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
	};

	useEffect(() => {
		if (isSuccess) {
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
