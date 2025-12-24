import { useState, useEffect, useRef } from "react";
import { useDNPaySSO, AuthStatus, AuthLoginData, AuthProvider } from "@/hooks/useDNPaySSO";
import { useWeb3AuthOnboarding } from "@/hooks/useWeb3AuthOnboarding";
import { useEmbeddedWalletLogin } from "@/hooks/useEmbeddedWalletLogin";
import DNPayOnboardingModal from "./DNPayOnboardingModal";
import Spinner from "../UI/Spinner";
import { toast } from "sonner";
import { useConnect, useSignMessage, useDisconnect } from "wagmi";
import {
	useAccountsAvailableQuery,
	useChallengeMutation,
	useAuthenticateMutation,
	ManagedAccountsVisibility,
	type ChallengeRequest
} from "@slice/indexer";
import { signIn } from "@/store/persisted/useAuthStore";
import { SLICE_APP, IS_MAINNET } from "@slice/data/constants";
import { ERRORS } from "@slice/data/errors";
import { useAuthModalStore } from "@/store/non-persisted/modal/useAuthModalStore";
import { useSignupStore } from "./Signup";

interface DNPayLoginButtonProps {
	onSuccess?: (data: AuthLoginData) => void;
	className?: string;
}

const DNPayLoginButton = ({ onSuccess, className = "" }: DNPayLoginButtonProps) => {
	const { disconnect } = useDisconnect();
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [onboardingData, setOnboardingData] = useState<{
		onboardingToken: string;
		email: string;
	} | null>(null);
	const [showOnboardingModal, setShowOnboardingModal] = useState(false);

	const { connectAsync, connectors } = useConnect();
	const { signMessageAsync } = useSignMessage();
	const [loadChallenge] = useChallengeMutation();
	const [authenticate] = useAuthenticateMutation();
	const { setShowAuthModal } = useAuthModalStore();
	const { setScreen, setEmbeddedWallet } = useSignupStore();
	const verifyCalledRef = useRef(false);
	const onboardingHandledRef = useRef(false);
	const walletErrorHandledRef = useRef(false);
	const [walletAddress, setWalletAddress] = useState<string | null>(null);
	const [lensAccounts, setLensAccounts] = useState<any[]>([]);
	const [showAccountModal, setShowAccountModal] = useState(false);
	
	const { createEmbeddedWallet, isLoading: isCreatingWallet } = useWeb3AuthOnboarding();
	const { loginWithEmbeddedWallet } = useEmbeddedWalletLogin();

	const { refetch: refetchAccounts } = useAccountsAvailableQuery({
		skip: true,
		fetchPolicy: "network-only"
	});

	const handleSuccess = async (data: AuthLoginData) => {
		setIsLoading(false);
		if (data.status === AuthStatus.LOGIN_SUCCESS) {
			localStorage.clear();
		}

		onSuccess?.(data);
		setIsSuccess(true);

		if (data.status === AuthStatus.LOGIN_SUCCESS && data.user?.walletAddress) {
			console.log("DNPAY Login success, authenticating with Lens Protocol...");
			console.log("Auth Provider:", data.user.authProvider);
			setWalletAddress(data.user.walletAddress);

			if (data.user.authProvider === AuthProvider.DNPAY_EMBEDDED && data.web3AuthToken) {
				console.log("Embedded wallet detected, using Web3Auth login...");
				try {
					await loginWithEmbeddedWallet(
						data.user.walletAddress,
						data.web3AuthToken
					);
				} catch (err) {
					console.error("Embedded wallet login error:", err);
					toast.error("Failed to login with embedded wallet");
				}
				return;
			}

			try {
				const injectedConnector = connectors.find(c => c.id === "injected");
				if (!injectedConnector) throw new Error("No wallet connector found");

				const connectResult = await connectAsync({ connector: injectedConnector });
				const connectedAddress = connectResult.accounts[0];
				if (connectedAddress.toLowerCase() !== data.user.walletAddress.toLowerCase()) {
					setShowAccountModal(false);
					setLensAccounts([]);
					disconnect?.();
					setScreen("choose");
					setShowAuthModal(true, "login");
					toast.error(
						`Please switch to the correct account in MetaMask: ${data.user.walletAddress.slice(0, 6)}...${data.user.walletAddress.slice(-4)}`,
						{ duration: 12000 }
					);
					return;
				}

				// Fetch accounts with explicit wallet address
				console.log("Fetching Lens accounts for wallet:", data.user.walletAddress);
				const result = await refetchAccounts({
					accountsAvailableRequest: {
						hiddenFilter: ManagedAccountsVisibility.NoneHidden,
						managedBy: data.user.walletAddress
					},
					lastLoggedInAccountRequest: { address: data.user.walletAddress }
				});

				const accounts = result.data?.accountsAvailable?.items || [];
				console.log("Accounts found:", accounts.length);

				if (accounts.length === 1) {
					const firstAccount = accounts[0].account;
					await authenticateWithLens(firstAccount.address, data.user.walletAddress);
				} else if (accounts.length > 1) {
					setLensAccounts(accounts.map((a: any) => a.account));
					setShowAccountModal(true);
				} else {
					console.log("No Lens account found, opening signup modal...");
					if (injectedConnector) {
						await connectAsync({ connector: injectedConnector });
					}
					setScreen("choose");
					setShowAuthModal(true, "signup");
				}
			} catch (err) {
				console.error("Failed to authenticate with Lens:", err);
			}
		} else if (!data.status) {
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

			const connectResult = await connectAsync({ connector: injectedConnector });
			const connectedAddress = connectResult.accounts[0];
			
			// Verify that the connected wallet matches the DNPAY wallet
			console.log("Verifying wallet addresses:");
			console.log("  DNPAY wallet:", walletAddress.toLowerCase());
			console.log("  Connected wallet:", connectedAddress.toLowerCase());
			
			if (connectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
				toast.error(`Please switch to the correct account in MetaMask: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
				console.error("Wallet address mismatch!");
				return;
			}
			
			console.log("Wallet addresses match, proceeding with authentication...");
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
		} catch (err: any) {
			console.error("Lens authentication error:", err);
			if (err?.message?.includes("User rejected")) {
				toast.error("Please approve the signature request in MetaMask");
			} else {
				toast.error("Failed to authenticate with Lens Protocol");
			}
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
		setShowOnboardingModal(true);
	};

	const handleCreateEmbeddedWallet = async () => {
		if (!onboardingData) return;

		try {
			const result = await createEmbeddedWallet(onboardingData.onboardingToken);

			if (result.success) {
				setShowOnboardingModal(false);
				if (result.isNewUser) {
					console.log("Wallet Address:", result.walletAddress);
					// User mới cần tạo Lens profile
					// Lưu embedded wallet info vào store để ChooseUsername có thể sử dụng
					if (result.walletAddress && result.provider) {
						setEmbeddedWallet(result.walletAddress, result.provider);
					}
					toast.info("Please create a Lens profile to continue");
					setShowAuthModal(true);
					setScreen("choose");
					return;
				}

				// User đã có Lens Account → đăng nhập thành công
				if (result.lensTokens) {
					signIn({
						accessToken: result.lensTokens.accessToken,
						refreshToken: result.lensTokens.refreshToken
					});
					toast.success("Embedded wallet created and logged in successfully!");
					window.location.href = "/";
				}
			} else {
				toast.error("Failed to create embedded wallet");
			}
		} catch (error) {
			console.error("Error creating embedded wallet:", error);
			toast.error("Failed to create embedded wallet");
		}
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
		verifyCalledRef.current = false;
		onboardingHandledRef.current = false;
		walletErrorHandledRef.current = false;
		setShowOnboardingModal(false);
		setOnboardingData(null);
		setIsLoading(true);
		// setOnboardingSpinner(true);
		openDNPayLogin();
		// setOnboardingSpinner(false);
	};

	useEffect(() => {
		if (isSuccess) {
			closeDNPayPopup();
		}
	}, [isSuccess]);

	return (
		<>
			{/* Modal xác nhận có ví */}
			<DNPayOnboardingModal
				open={showOnboardingModal}
				onClose={() => setShowOnboardingModal(false)}
				onHasWallet={async () => {
					setShowOnboardingModal(false);
					if (onboardingData) {
						await handleConnectWallet(onboardingData.onboardingToken);
					}
				}}
				onCreateWallet={handleCreateEmbeddedWallet}
				isCreatingWallet={isCreatingWallet}
			/>

			{showAccountModal && lensAccounts.length > 1 && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAccountModal(false)}>
					<div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold">Login</h2>
							<button onClick={() => setShowAccountModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
						</div>
						<p className="text-sm mb-4">Please sign the message.</p>
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Slice uses this signature to verify that you're the owner of this address.</p>
										
						<div className="space-y-3 mb-4">
							{lensAccounts.map((account) => (
								<div
									key={account.address}
									className="flex items-center justify-between space-x-3 border border-gray-200 dark:border-gray-700 rounded-xl p-3"
								>
									<div className="flex items-center space-x-3">
										<img 
											src={account.metadata?.picture || "/default-avatar.png"} 
											alt={account.username?.localName || account.address}
											className="w-10 h-10 rounded-full"
										/>
										<div>
											<div className="font-medium text-sm">
												{account.username?.localName || account.address.slice(0, 8)}
											</div>
											<div className="text-xs text-gray-500">
												@{account.username?.localName || account.address.slice(0, 8)}
											</div>
										</div>
									</div>
									<button
										className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium disabled:opacity-50"
										disabled={isLoading}
										onClick={async () => {
											setIsLoading(true);
											await authenticateWithLens(account.address, walletAddress!);
											setIsLoading(false);
											setShowAccountModal(false);
										}}
										type="button"
									>
										Login
									</button>
								</div>
							))}
						</div>
										
						<button 
							className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
							onClick={() => setShowAccountModal(false)}
						>
							<span>🔑</span>
							<span>Change wallet</span>
						</button>
					</div>
				</div>
			)}
				
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
		</>
	);
};

export default DNPayLoginButton;
