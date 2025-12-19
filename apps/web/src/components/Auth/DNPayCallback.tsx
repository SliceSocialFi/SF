import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

/**
 * DNPay OAuth Callback Handler
 * This page handles the OAuth redirect from DNPay SSO
 * It extracts the authorization code and sends it back to the opener window
 */
const DNPayCallback = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		console.log("=== DNPAY CALLBACK TRIGGERED ===");
		console.log("Full URL:", window.location.href);
		console.log("All params:", Object.fromEntries(searchParams.entries()));
		
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");
		const errorDescription = searchParams.get("error_description");
		const token = searchParams.get("token"); // DNPAY might return token directly
		const accessToken = searchParams.get("access_token"); // Or access_token

		console.log("Parsed values:", { code, state, error, token, accessToken });

		// Verify state for CSRF protection (optional if DNPAY doesn't support it)
		const savedState = sessionStorage.getItem("dnpay_oauth_state");

		if (error) {
			console.error("DNPay Error:", error, errorDescription);
			// Send error to opener window
			if (window.opener) {
				window.opener.postMessage(
					{
						error,
						error_description: errorDescription
					},
					window.location.origin
				);
				window.close();
			} else {
				toast.error(`Login failed: ${errorDescription || error}`);
				navigate("/");
			}
			return;
		}

		// Check for any form of authentication data
		const authData = code || token || accessToken;
		
		if (!authData) {
			console.error("No authorization data received from DNPAY");
			toast.error("No authorization data received");
			if (window.opener) {
				window.close();
			} else {
				navigate("/");
			}
			return;
		}

		// Only verify state if it was sent back
		if (state && savedState && state !== savedState) {
			console.error("State mismatch:", { state, savedState });
			toast.error("Invalid state parameter - possible CSRF attack");
			if (window.opener) {
				window.close();
			} else {
				navigate("/");
			}
			return;
		}

		// Save access_token to localStorage
		if (accessToken) {
			console.log("Saving access_token to localStorage...");
			localStorage.setItem("dnpayAccessToken", accessToken);
			console.log("✓ Token saved to localStorage with key: dnpayAccessToken");
		}

		// Send authorization data to opener window
		if (window.opener && !window.opener.closed) {
			console.log("Sending message to opener window:", {
				code,
				token,
				access_token: accessToken,
				state
			});
			
			window.opener.postMessage(
				{
					code,
					token,
					access_token: accessToken,
					state
				},
				window.location.origin
			);
			
			// Clean up
			sessionStorage.removeItem("dnpay_oauth_state");
			
			console.log("Message sent successfully!");
			
			// Auto-close popup after a short delay
			setTimeout(() => {
				console.log("Closing popup window...");
				window.close();
			}, 1000);
		} else {
			console.warn("No opener window found or opener is closed");
			// If not in popup, redirect to home
			toast.success("Login successful!");
			setTimeout(() => {
				navigate("/");
			}, 2000);
		}
	}, [searchParams, navigate]);

	const handleClose = () => {
		if (window.opener) {
			window.close();
		} else {
			navigate("/");
		}
	};

	const allParams = Object.fromEntries(searchParams.entries());
	const hasData = Object.keys(allParams).length > 0;

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
			<div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold mb-2">DNPay Callback</h2>
					<p className="text-gray-600 dark:text-gray-400">Processing authentication...</p>
				</div>

				{hasData ? (
					<div className="space-y-4">
						<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
							<h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">
								✓ Received Parameters
							</h3>
							<pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-auto max-h-48">
								{JSON.stringify(allParams, null, 2)}
							</pre>
						</div>

						{window.opener ? (
							<div className="text-sm text-gray-600 dark:text-gray-400">
								✓ Data sent to parent window
							</div>
						) : (
							<div className="text-sm text-yellow-600 dark:text-yellow-400">
								⚠ No parent window found - redirecting...
							</div>
						)}

						<button
							className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
							onClick={handleClose}
							type="button"
						>
							Close Window
						</button>
					</div>
				) : (
					<div className="space-y-4">
						<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
							<h3 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
								⚠ No Parameters Received
							</h3>
							<p className="text-sm text-gray-700 dark:text-gray-300">
								The callback page loaded but no OAuth parameters were found in the URL.
							</p>
						</div>

						<div className="text-xs space-y-2">
							<p className="font-semibold">Possible reasons:</p>
							<ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
								<li>Redirect URI not whitelisted in DNPay</li>
								<li>OAuth flow was cancelled</li>
								<li>DNPay returned an error</li>
							</ul>
						</div>

						<div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs">
							<p className="font-semibold mb-1">Current URL:</p>
							<p className="break-all">{window.location.href}</p>
						</div>

						<button
							className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
							onClick={handleClose}
							type="button"
						>
							Close Window
						</button>
					</div>
				)}

				<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
					<p className="text-xs text-center text-gray-500">
						Check the browser console (F12) for detailed logs
					</p>
				</div>
			</div>
		</div>
	);
};

export default DNPayCallback;
