import { useCallback, useEffect, useRef, useState } from "react";
import { DNPAY_AUTH_URL, DNPAY_CLIENT_ID } from "@slice/data/constants";
import { toast } from "sonner";
import { walletService } from "@/lib/api/auth-api";
import { set } from "zod";

export const AuthProvider = {
	WALLET: 'WALLET',
	DNPAY_LINKED: 'DNPAY_LINKED',
	DNPAY_EMBEDDED: 'DNPAY_EMBEDDED',
};

export const AuthStatus = {
	LOGIN_SUCCESS: "LOGIN_SUCCESS",
	ONBOARDING_REQUIRED: "ONBOARDING_REQUIRED"
};

export interface AuthLoginData {
	code?: string;
	token?: string;
	dnpayAccessToken?: string;
	web3AuthToken?: string;
	user?: {
		id?: string;
		email?: string;
		walletAddress?: string;
		authProvider?: string;
	};
	status?: string;
}

interface DNPayAuthResponse {
	code?: string;
	token?: string;
	access_token?: string;
	state?: string;
	error?: string;
	error_description?: string;
}

interface UseDNPaySSOOptions {
	onSuccess?: (data: AuthLoginData) => void;
	onError?: (error: string) => void;
	onOnboardingRequired?: (data: { onboardingToken: string; email: string }) => void;
}

export const useDNPaySSO = (options: UseDNPaySSOOptions = {}) => {
	const popupRef = useRef<Window | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { onSuccess, onError, onOnboardingRequired } = options;

	// Cleanup function
	const cleanup = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		if (popupRef.current && !popupRef.current.closed) {
			popupRef.current.close();
			popupRef.current = null;
		}
	}, []);

	// Generate random state for CSRF protection
	const generateState = useCallback(() => {
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}, []);

	// Handle OAuth callback message
	const handleMessage = useCallback(
		(event: MessageEvent) => {
			console.log("🔔 Received message event:", event);
			console.log("🔔 Event origin:", event.origin);
			console.log("🔔 Window origin:", window.location.origin);
			console.log("🔔 Event data:", event.data);
			
			// Verify origin - accept from same origin or DNPAY miniapp
			const allowedOrigins = [
				window.location.origin,
				"https://dev-slice-dnpay-miniapp.vercel.app"
			];
			
			if (!allowedOrigins.includes(event.origin)) {
				console.log("❌ Message from different origin, ignoring:", event.origin);
				return;
			}

			const data = event.data as DNPayAuthResponse;

			if (data.error) {
				const errorMessage = data.error_description || data.error;
				toast.error(`DNPAY login failed: ${errorMessage}`);
				onError?.(errorMessage);
				cleanup();
				return;
			}

			// Lấy accessToken từ event.data hoặc localStorage
			let accessToken = data.access_token || localStorage.getItem("dnpayAccessToken") || undefined;
			
			console.log("📩 Received message from DNPAY popup:", data);
			console.log("🔐 Access token from message:", data.access_token);
			console.log("🔐 Access token from localStorage:", localStorage.getItem("dnpayAccessToken"));
			
			if (accessToken) {
				// Save to localStorage if from message
				if (data.access_token) {
					console.log("💾 Saving access token to localStorage");
					localStorage.setItem("dnpayAccessToken", data.access_token);
				}
				
				// Clear all localStorage except dnpayAccessToken
				Object.keys(localStorage).forEach((key) => {
					if (key !== "dnpayAccessToken") {
						localStorage.removeItem(key);
					}
				});
				
				console.log("✅ Calling onSuccess with token:", accessToken);
				onSuccess?.({ dnpayAccessToken: accessToken });
				cleanup();
			} else {
				console.log("⚠️ No access token found in message or localStorage");
			}
		},
		[onSuccess, onError, cleanup]
	);

	// Check popup status AND localStorage for token
	const checkPopupClosed = useCallback(() => {
		// Check if popup closed
		if (popupRef.current?.closed) {
			cleanup();
			return;
		}
		
		// Polling: Check localStorage for dnpayAccessToken while popup is open
		const accessToken = localStorage.getItem("dnpayAccessToken");
		if (accessToken && popupRef.current && !popupRef.current.closed) {
			console.log("✅ Detected dnpayAccessToken in localStorage via polling:", accessToken);
			console.log("🔄 Triggering onSuccess callback...");
			
			// Clear all localStorage except dnpayAccessToken
			Object.keys(localStorage).forEach((key) => {
				if (key !== "dnpayAccessToken") {
					localStorage.removeItem(key);
				}
			});
			
			// Trigger success callback
			onSuccess?.({ dnpayAccessToken: accessToken });
			cleanup();
		}
	}, [cleanup, onSuccess]);

	// Open DNPAY SSO popup
	const openDNPayLogin = useCallback(() => {
		setIsLoading(true);
		try {
			const state = generateState();
			sessionStorage.setItem("dnpay_oauth_state", state);

			// Build URL manually without encoding
			const authUrl =
				`${DNPAY_AUTH_URL}?client_id=${DNPAY_CLIENT_ID}&redirect_uri=https://dev-slice-dnpay-miniapp.vercel.app`;

			// Open popup window (similar to Google login)
			const width = 500;
			const height = 600;
			const left = window.screen.width / 2 - width / 2;
			const top = window.screen.height / 2 - height / 2;

			popupRef.current = window.open(
				authUrl,
				"DNPay Login",
				`width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
			);

			if (!popupRef.current) {
				toast.error("Failed to open login window. Please allow popups.");
				return;
			}

			// Check if popup is closed AND poll localStorage periodically (every 500ms)
			console.log("🔄 Starting polling for popup status and localStorage token...");
			intervalRef.current = setInterval(checkPopupClosed, 500);
		} catch (error) {
			toast.error("Failed to initialize DNPAY login");
			console.error("DNPAY SSO Error:", error);
		}
	}, [generateState]);

	const closeDNPayPopup = useCallback(() => {
		const accessToken = localStorage.getItem("dnpayAccessToken") || undefined;
		// Has access token, close popup
		if (accessToken && popupRef.current && !popupRef.current.closed) {
			popupRef.current.close();
			cleanup();
		}
	}, []);

	const linkWallet = useCallback(async (onboardingToken: string, walletAddress: string) => {
		try {
			const data = await walletService.linkWalletToDNPAY(onboardingToken, walletAddress);
			console.log("🔗 DNPAY LINK WALLET RESPONSE:", data);
			return data;
		} catch (err) {
			console.error("DNPAY LINK WALLET ERROR:", err);
			throw err;
		}
	}, []);

	const verifyDNPayToken = useCallback(async () => {
		let logged = false;
		try {
			const accessToken = localStorage.getItem("dnpayAccessToken") || undefined;
			if (!accessToken) {
				throw new Error("No DNPAY access token found");
			}

			const data = await walletService.verifyDNPAYLogin(accessToken);
			
			if (logged) return;
			logged = true;
			
			const status = data.status;
			if (status === AuthStatus.LOGIN_SUCCESS) {
				// id chính là wallet address
				const walletAddress = data.user.id;
				
				// Trả về thông tin user qua callback onSuccess
				console.log("DNPAY LOGIN SUCCESS:", data);
				onSuccess?.({
					dnpayAccessToken: accessToken,
					web3AuthToken: data.web3AuthToken,
					user: {
						id: walletAddress,
						email: data.user.email,
						walletAddress: walletAddress,
						authProvider: data.user.authProvider
					},
					status: AuthStatus.LOGIN_SUCCESS
				});
			} else if (status === AuthStatus.ONBOARDING_REQUIRED) {
				onOnboardingRequired?.({
					onboardingToken: data.onboardingToken,
					email: data.email
				});
			}
		} catch (err) {
			if (logged) return;
			logged = true;
			console.error("DNPAY VERIFY ERROR:", err);
		}
	}, [onOnboardingRequired, onSuccess]);

	// Listen for messages from popup
	useEffect(() => {
		window.addEventListener("message", handleMessage);
		const token = localStorage.getItem("dnpayAccessToken");
		console.log("DNPAY access token on effect mount:", token);
		if (token) {
			onSuccess?.({ dnpayAccessToken: token });
		}
		return () => {
			window.removeEventListener("message", handleMessage);
		};
	}, [handleMessage]);

	return {
		openDNPayLogin,
		closeDNPayPopup,
		verifyDNPayToken,
		linkWallet,
		cleanup
	};
};