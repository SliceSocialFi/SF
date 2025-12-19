import { useCallback, useEffect, useRef } from "react";
import { DNPAY_AUTH_URL, DNPAY_CLIENT_ID } from "@slice/data/constants";
import { toast } from "sonner";
import { au } from "react-router/dist/development/routeModules-DnUHijGz";
import { PAYMENT_API_URL } from "@slice/data/constants";

interface DNPayAuthResponse {
	code?: string;
	token?: string;
	access_token?: string;
	state?: string;
	error?: string;
	error_description?: string;
}

interface UseDNPaySSOOptions {
	onSuccess?: (data: { code?: string; token?: string; access_token?: string }) => void;
	onError?: (error: string) => void;
}

/**
 * Hook for handling DNPAY SSO authentication flow
 * Opens a popup window for DNPAY login similar to Google OAuth
 */


export const useDNPaySSO = (options: UseDNPaySSOOptions = {}) => {
	const popupRef = useRef<Window | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const { onSuccess, onError } = options;

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

			const accessToken = localStorage.getItem("dnpayAccessToken");
			if (accessToken) {
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

			// Use app's own callback URL
			const redirectUri = `http://localhost:5173`;

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
        const accessToken = localStorage.getItem("dnpayAccessToken");
        // Has access token, close popup
        if (accessToken && popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
            cleanup();
        }
    }, []);

    const verifyDNPayToken = useCallback(() => {
        const accessToken = localStorage.getItem("dnpayAccessToken");

        // Gọi API verify
			fetch(`${PAYMENT_API_URL}api/auth/dnpay/verify`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ dnpayAccessToken: accessToken })
			})
				.then(res => res.json())
				.then(data => {
					if (data.status === "LOGIN_SUCCESS") {
						console.log("✅ DNPAY LOGIN SUCCESS:", {
							accessToken: data.accessToken,
							userId: data.user?.id,
							email: data.user?.email
						});
					} else if (data.status === "ONBOARDING_REQUIRED") {
						console.log("🟡 DNPAY ONBOARDING REQUIRED:", {
							onboardingToken: data.onboardingToken,
							email: data.email
						});
					} else {
						console.log("❓ DNPAY UNKNOWN RESPONSE:", data);
					}
				})
				.catch(err => {
					console.error("DNPAY VERIFY ERROR:", err);
				});
    }, []);

	// Listen for messages from popup
	useEffect(() => {
		window.addEventListener("message", handleMessage);
		// return () => {
		// 	window.removeEventListener("message", handleMessage);
		// 	cleanup();
		// };
	}, [handleMessage, cleanup]);

	return {
		openDNPayLogin,
        closeDNPayPopup,
        verifyDNPayToken,
        cleanup
	};
};
