import { useState } from "react";
import { Button } from "@/components/Shared/UI";
import { DNPAY_AUTH_URL, DNPAY_CLIENT_ID, DNPAY_REDIRECT_URI } from "@slice/data/constants";

interface DNPayLoginButtonProps {
	className?: string;
	useFullPageRedirect?: boolean;
}

/**
 * DNPay Login Button with Full Page Redirect
 * Use this if popup doesn't work due to DNPay whitelist restrictions
 */
const DNPayLoginButtonFullPage = ({ className = "", useFullPageRedirect = true }: DNPayLoginButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = () => {
		console.log("DNPay login button clicked (Full Page Redirect)");
		setIsLoading(true);
		
		// Use production redirect URI from env
		const redirectUri = DNPAY_REDIRECT_URI;
		
		// DNPAY requires redirect_uri NOT to be URL encoded
		const authUrl = `${DNPAY_AUTH_URL}?client_id=${DNPAY_CLIENT_ID}&redirect_uri=${redirectUri}`;
		
		console.log("Redirecting to DNPay:", authUrl);
		console.log("Redirect URI:", redirectUri);
		
		// Full page redirect
		window.location.href = authUrl;
	};

	return (
		<Button
			className={className}
			disabled={isLoading}
			loading={isLoading}
			onClick={handleClick}
			outline
			type="button"
		>
			<div className="flex items-center justify-center space-x-2">
				<svg
					className="size-5"
					fill="none"
					stroke="currentColor"
					strokeWidth={2}
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<span>Continue with DNPay</span>
			</div>
		</Button>
	);
};

export default DNPayLoginButtonFullPage;
