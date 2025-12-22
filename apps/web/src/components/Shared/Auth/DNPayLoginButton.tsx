import { useState, useEffect, useRef } from "react";
import { useDNPaySSO } from "@/hooks/useDNPaySSO";
import { toast } from "sonner";
import { useConnect, useSignMessage } from "wagmi";
import { useAccountsAvailableQuery, useChallengeMutation, useAuthenticateMutation, ManagedAccountsVisibility, type ChallengeRequest } from "@slice/indexer";
import { signIn } from "@/store/persisted/useAuthStore";
import { SLICE_APP, IS_MAINNET } from "@slice/data/constants";
import { ERRORS } from "@slice/data/errors";

interface DNPayLoginButtonProps {
	onSuccess?: (data: { code?: string; token?: string; access_token?: string; user?: { id?: string; email?: string; walletAddress?: string }; status?: string }) => void;
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
	const { signMessageAsync } = useSignMessage();
	const [loadChallenge] = useChallengeMutation();
	const [authenticate] = useAuthenticateMutation();
	const verifyCalledRef = useRef(false);
	const onboardingHandledRef = useRef(false);
	const walletErrorHandledRef = useRef(false);
	const [walletAddress, setWalletAddress] = useState<string | null>(null);

	// Query to get accounts by wallet address
	const { data: accountsData, refetch: refetchAccounts } = useAccountsAvailableQuery({
		skip: !walletAddress,
		variables: {
			accountsAvailableRequest: {
				hiddenFilter: ManagedAccountsVisibility.NoneHidden,
				managedBy: walletAddress // Use the wallet address from DNPAY
			},
			lastLoggedInAccountRequest: { address: walletAddress }
		}
	});

	const handleSuccess = async (data: { code?: string; token?: string; access_token?: string; user?: { id?: string; email?: string; walletAddress?: string }; status?: string }) => {
		setIsLoading(false);
		onSuccess?.(data);
		setIsSuccess(true);
		
		// Nếu là LOGIN_SUCCESS, authenticate với Lens Protocol
		if (data.status === "LOGIN_SUCCESS" && data.user?.walletAddress) {
			console.log("🔐 DNPAY Login success, authenticating with Lens Protocol...");
			setWalletAddress(data.user.walletAddress);
			
			try {
				// Fetch accounts and auto-login with the first account
				const result = await refetchAccounts();
				if (result.data?.accountsAvailable?.items?.length > 0) {
					const firstAccount = result.data.accountsAvailable.items[0].account;
					await authenticateWithLens(firstAccount.address, data.user.walletAddress);
				} else {
					toast.error("No Lens account found for this wallet. Please create an account first.");
				}
			} catch (err) {
				console.error("Failed to authenticate with Lens:", err);
				toast.error("Failed to authenticate with Lens Protocol");
			}
		} else if (!data.status) {
			// Chỉ gọi verifyDNPayToken một lần duy nhất nếu chưa có status
			if (!verifyCalledRef.current) {
				verifyCalledRef.current = true;
				verifyDNPayToken();
			}
		}
	};

	// Authenticate with Lens Protocol using the wallet address
	const authenticateWithLens = async (accountAddress: string, walletAddress: string) => {
		try {
			const meta = { account: accountAddress, app: IS_MAINNET ? SLICE_APP : undefined };
			const request: ChallengeRequest = {
				accountOwner: { owner: walletAddress, ...meta }
			};

			// Get challenge
			const challenge = await loadChallenge({ variables: { request } });
			if (!challenge?.data?.challenge?.text) {
				toast.error(ERRORS.SomethingWentWrong);
				return;
			}

			// Get signature - This requires the wallet to be connected
			// For DNPAY, we need to connect the wallet first
			const injectedConnector = connectors.find(c => c.id === "injected");
			if (!injectedConnector) {
				toast.error("No wallet connector found");
				return;
			}

			await connectAsync({ connector: injectedConnector });
			const signature = await signMessageAsync({ message: challenge.data.challenge.text });

			// Authenticate
			const auth = await authenticate({
				variables: { request: { id: challenge.data.challenge.id, signature } }
			});

			if (auth.data?.authenticate.__typename === "AuthenticationTokens") {
				const accessToken = auth.data.authenticate.accessToken;
				const refreshToken = auth.data.authenticate.refreshToken;
				signIn({ accessToken, refreshToken });
				toast.success("Logged in successfully!");
				window.location.href = "/";
			} else {
				toast.error(ERRORS.SomethingWentWrong);
			}
		} catch (err) {
			console.error("Lens authentication error:", err);
			toast.error("Failed to authenticate with Lens Protocol");
		}
	};

	const handleError = (error: string) => {
		setIsLoading(false);
		console.error("DNPAY SSO Error:", error);
	};


	const handleOnboardingRequired = async (data: { onboardingToken: string; email: string }) => {
		if (onboardingHandledRef.current) return;
		onboardingHandledRef.current = true;
		setOnboardingData(data);
		await handleConnectWallet(data.onboardingToken);
	};

	const handleConnectWallet = async (onboardingToken: string) => {
		try {
			const injectedConnector = connectors.find(c => c.id === "injected");
        
			if (!injectedConnector) {
				if (!walletErrorHandledRef.current) {
					walletErrorHandledRef.current = true;
					toast.error("No wallet found. Please install MetaMask.");
				}
				return;
			}

			const result = await connectAsync({ connector: injectedConnector });
			const walletAddress = result.accounts[0];
        
			const response = await linkWallet(onboardingToken, walletAddress);
			console.log("🔗 Link wallet response:", response);
		} catch (err) {
			if (!walletErrorHandledRef.current) {
				walletErrorHandledRef.current = true;
				toast.error("Failed to connect wallet");
			}
			console.error("Failed to connect wallet:", err);
		}
	};

	const { openDNPayLogin, closeDNPayPopup, verifyDNPayToken, linkWallet } = useDNPaySSO({
		onSuccess: handleSuccess,
		onError: handleError,
		onOnboardingRequired: handleOnboardingRequired,
	});


	const handleClick = () => {
		// Reset các cờ khi user click lại
		verifyCalledRef.current = false;
		onboardingHandledRef.current = false;
		walletErrorHandledRef.current = false;
		
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
