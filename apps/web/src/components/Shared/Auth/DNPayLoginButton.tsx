import { useState, useEffect } from "react";
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
		<button
			className={className}
			disabled={isLoading}
			onClick={handleClick}
			type="button"
		>
			<span>Continue with DNPay</span>
			<img 
				src="/dnpay-logo-darkmode.png" 
				alt="DNPay" 
				className="size-6 dark:block hidden"
				draggable={false}
				height={24}
				width={24}
			/>
			<img 
				src="/dnpay-logo-lightmode.png" 
				alt="DNPay" 
				className="size-6 dark:hidden block"
				draggable={false}
				height={24}
				width={24}
			/>
		</button>
	);
};

export default DNPayLoginButton;
