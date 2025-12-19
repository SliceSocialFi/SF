import { useState, useEffect } from "react";
import { Button } from "@/components/Shared/UI";
import { useDNPaySSO } from "@/hooks/useDNPaySSO";

interface DNPayLoginButtonProps {
	onSuccess?: (data: { code?: string; token?: string; access_token?: string }) => void;
	className?: string;
}

const DNPayLoginButton = ({ onSuccess, className = "" }: DNPayLoginButtonProps) => {
	const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

	const handleSuccess = (data: { code?: string; token?: string; access_token?: string }) => {
		setIsLoading(false);
		console.log("DNPAY Authentication Data:", data);
		
		// Call the success callback with full data
		onSuccess?.(data);
        setIsSuccess(true);
	};

	const handleError = (error: string) => {
		setIsLoading(false);
		console.error("DNPAY SSO Error:", error);
	};

	const { openDNPayLogin, closeDNPayPopup } = useDNPaySSO({
		onSuccess: handleSuccess,
		onError: handleError
	});

	const handleClick = () => {
		console.log("DNPay login button clicked");
		setIsLoading(true);
		openDNPayLogin();
	};

    useEffect(() => {
        if (isSuccess) {
            console.log("DNPAY login successful, closing popup if still open");
            closeDNPayPopup();
        }
    }, [isSuccess]);

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

export default DNPayLoginButton;
