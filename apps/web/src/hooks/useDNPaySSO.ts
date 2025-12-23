import { useCallback, useEffect, useRef } from "react";
import { DNPAY_AUTH_URL, DNPAY_CLIENT_ID } from "@slice/data/constants";
import { toast } from "sonner";
import { PAYMENT_API_URL } from "@slice/data/constants";
import { walletService } from "@/lib/api/auth-api";

interface DNPayAuthResponse {
	code?: string;
	token?: string;
	access_token?: string;
	state?: string;
	error?: string;
	error_description?: string;
}

interface UseDNPaySSOOptions {
	onSuccess?: (data: {
		code?: string;
		token?: string;
		access_token?: string;
		user?: {
			id?: string;
			email?: string;
			walletAddress?: string;
		};
		status?: string;
	}) => void;
	onError?: (error: string) => void;
	onOnboardingRequired?: (data: { onboardingToken: string; email: string }) => void;
}

/**
 * Hook for handling DNPAY SSO authentication flow
 * Opens a popup window for DNPAY login similar to Google OAuth
 */


export const useDNPaySSO = (options: UseDNPaySSOOptions = {}) => {
	const popupRef = useRef<Window | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
			       // Verify origin
			       if (event.origin !== window.location.origin) {
				       console.log("Message from different origin, ignoring:", event.origin);
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

			       const accessToken = localStorage.getItem("dnpayAccessToken") || undefined;
			       if (accessToken) {
				       // Clear all localStorage except dnpayAccessToken
				       Object.keys(localStorage).forEach((key) => {
					       if (key !== "dnpayAccessToken") {
						       localStorage.removeItem(key);
					       }
				       });
				       onSuccess?.({ access_token: accessToken });
				       cleanup();
			       }
		       },
		       [onSuccess, onError, cleanup]
	       );

	// Check popup status
	const checkPopupClosed = useCallback(() => {
		if (popupRef.current?.closed) {
			cleanup();
		}
	}, [cleanup]);

	// Open DNPAY SSO popup
	const openDNPayLogin = useCallback(() => {
		try {
			const state = generateState();
			sessionStorage.setItem("dnpay_oauth_state", state);

			// Build URL manually without encoding
			const authUrl = `${DNPAY_AUTH_URL}?client_id=${DNPAY_CLIENT_ID}&redirect_uri=https://dev-slice-dnpay-miniapp.vercel.app`;

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

			// Check if popup is closed periodically
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
			const response = await fetch(`${PAYMENT_API_URL}api/auth/dnpay/link-wallet`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ onboardingToken, walletAddress })
			});
			const data = await response.json();
			console.log("🔗 DNPAY LINK WALLET RESPONSE:", data);
			return data;
		} catch (err) {
			console.error("DNPAY LINK WALLET ERROR:", err);
			throw err;
		}
	}, []);

	const verifyDNPayToken = useCallback(async () => {
		const accessToken = localStorage.getItem("dnpayAccessToken") || undefined;
		let logged = false;
		try {
			const response = await fetch(`${PAYMENT_API_URL}api/auth/dnpay/verify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ dnpayAccessToken: accessToken })
			});
			const data = await response.json();
			
			if (logged) return;
			logged = true;
			
			const status = data.data?.status || data.status;
			if (status === "LOGIN_SUCCESS") {
				// id chính là wallet address
				const walletAddress = data.data?.user?.id;
				
				// Trả về thông tin user qua callback onSuccess
				onSuccess?.({
					access_token: accessToken,
					user: {
						id: walletAddress,
						email: data.data?.user?.email,
						walletAddress: walletAddress
					},
					status: "LOGIN_SUCCESS"
				});
			} else if (status === "ONBOARDING_REQUIRED") {
				// onOnboardingRequired?.({
				// 	onboardingToken: data.data?.onboardingToken || data.onboardingToken,
				// 	email: data.data?.email || data.email
				// });


				// ============================================================
				// 🧪 TEST AUTO-FLOW: EMBEDDED WALLET
				// ============================================================
				console.group("🚀 [TEST MODE] Starting Embedded Wallet Flow");
				
				try {
					// 1. Lấy onboardingToken từ API verify trước đó
					const onboardingToken = data.data?.onboardingToken || data.onboardingToken;
					if (!onboardingToken) throw new Error("Missing onboardingToken");

					console.log("Step 1: Minting Web3Auth Token...");
					// Gọi API mint token riêng cho Web3Auth
					const web3AuthToken = await walletService.mintWeb3AuthToken(onboardingToken);
					console.log("✅ Minted Web3Auth Token:", web3AuthToken);

					console.log("Step 2: Connecting Web3Auth (Please allow Popup)...");
					// Khởi tạo ví MPC. LƯU Ý: Trình duyệt có thể chặn Popup ở bước này
					const { address } = await walletService.connectWeb3Auth(web3AuthToken);
					console.log("✅ Wallet Created:", address);

					console.log("Step 3: Registering Wallet to Backend...");
					// Gửi địa chỉ ví mới về backend để tạo user
					const registerResult = await walletService.registerEmbeddedWallet(onboardingToken, address);
					console.log("✅ Registration Success:", registerResult);

					// 4. Giả lập đăng nhập thành công sau khi tạo ví
					alert(`TEST THÀNH CÔNG! Ví mới: ${address}`);
					
					// Gọi onSuccess để App chuyển vào màn hình chính
					onSuccess?.({
						access_token: registerResult.accessToken, // Token session mới từ backend
						user: {
							id: address,
							email: data.data?.email || data.email,
							walletAddress: address
						},
						status: "LOGIN_SUCCESS"
					});

				} catch (testError) {
					console.error("❌ TEST FAILED:", testError);
					alert("Test thất bại! Hãy mở Console (F12) để xem lỗi chi tiết.");
				} finally {
					console.groupEnd();
				}
				// ============================================================
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
// Xóa accessToken cũ mỗi lần load lại trang
if (typeof window !== "undefined") {
	localStorage.removeItem("dnpayAccessToken");
	// Clear all localStorage except dnpayAccessToken on page load
	Object.keys(localStorage).forEach((key) => {
	       if (key !== "dnpayAccessToken") {
		       localStorage.removeItem(key);
	       }
	});
}
