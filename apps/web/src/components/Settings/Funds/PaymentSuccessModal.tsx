import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Modal, Button } from "@/components/Shared/UI";
import Loader from "@/components/Shared/Loader";
import { PaymentReturnState } from "@/hooks/usePaymentReturn";
import { GetOrderByProviderPaymentIdData } from "@/types/payment-api";
// import { usePaymentApi } from "@/hooks/usePaymentApi";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";

interface PaymentSuccessModalProps {
    show: boolean;
    state: PaymentReturnState;
    order?: GetOrderByProviderPaymentIdData | null;
    errorMessage?: string;
    onClose: () => void;
}

const PaymentSuccessModal = ({ 
    show, 
    state,
    errorMessage, 
    onClose 
}: PaymentSuccessModalProps) => {
    if (state === PaymentReturnState.VERIFYING) {
        return (
            <Modal show={show} onClose={onClose} title="Verifying Payment">
                <div className="flex flex-col items-center gap-4 p-10 pb-8">
                    <Loader />
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-bold">Payment is verifying...</h3>
                        <p className="text-center text-gray-500 dark:text-gray-400">
                            We are transferring {ERC20_TOKEN_SYMBOL} to your wallet.
                        </p>
                    </div>
                </div>
            </Modal>
        );
    }

    if (state === PaymentReturnState.SUCCESS) {
        return (
            <Modal show={show} onClose={onClose} title="Payment Successful">
                <div className="flex flex-col items-center gap-4 p-10 pb-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <h3 className="text-2xl font-bold">
                            Payment Successful!
                        </h3>
                        <p className="text-center text-gray-600 dark:text-gray-400">
                            Token {ERC20_TOKEN_SYMBOL} has been transferred to your wallet.
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    if (state === PaymentReturnState.FAILED) {
        return (
            <Modal show={show} onClose={onClose} title="Payment Failed">
                <div className="flex flex-col items-center gap-4 p-10 pb-8">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <XCircleIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <h3 className="text-2xl font-bold">
                            Payment Failed
                        </h3>
                        <p className="text-center text-gray-600 dark:text-gray-400">
                            {errorMessage || "An error occurred during payment verification."}
                        </p>
                    </div>
                    <Button onClick={onClose} className="w-full">
                        Retry
                    </Button>
                </div>
            </Modal>
        );
    }

  return null;
};

export default PaymentSuccessModal;
