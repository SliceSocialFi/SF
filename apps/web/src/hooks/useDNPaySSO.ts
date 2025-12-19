import { useCallback, useEffect, useRef } from "react";
import { DNPAY_AUTH_URL, DNPAY_CLIENT_ID } from "@slice/data/constants";
import { toast } from "sonner";
import { au } from "react-router/dist/development/routeModules-DnUHijGz";

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

			if (data.code || data.token || data.access_token) {
				console.log("DNPAY auth data received:", { 
					code: data.code, 
					token: data.token, 
					access_token: data.access_token 
				});
				
				// Save access_token to localStorage (backup in case popup didn't do it)
				if (data.access_token) {
					console.log("Saving access_token to localStorage in parent window...");
					localStorage.setItem("TokenAccessDNPAY", data.access_token);
					console.log("✓ Token saved to localStorage from parent with key: TokenAccessDNPAY");
				}
				
				toast.success("DNPAY login successful!");
				onSuccess?.({
					code: data.code,
					token: data.token,
					access_token: data.access_token
				});
				cleanup();
			}
		},
		[onSuccess, onError, cleanup]
	);

	// Check popup status
	const checkPopupClosed = useCallback(() => {
		if (popupRef.current?.closed) {
			console.log("⚠ Popup window was closed");
			cleanup();
			toast.error("Login window was closed");
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

			console.log("Opening DNPAY auth URL:", authUrl);
			console.log("Expected callback URL:", redirectUri);

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

            console.log("Attempting to open popup window for DNPAY SSO", popupRef.current);

			if (!popupRef.current) {
				toast.error("Failed to open login window. Please allow popups.");
				return;
			}

			console.log("✓ Popup opened successfully");
			
			// Try to monitor popup URL (will fail due to CORS if different origin)
			try {
				console.log("Initial popup URL:", popupRef.current.location.href);
			} catch (e) {
				console.log("Cannot access popup URL (CORS) - this is normal");
			}

			// Check if popup is closed periodically
			intervalRef.current = setInterval(checkPopupClosed, 500);
		} catch (error) {
			toast.error("Failed to initialize DNPAY login");
			console.error("DNPAY SSO Error:", error);
		}
	}, [generateState]);

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
		cleanup
	};
};
