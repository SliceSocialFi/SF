import { Button, Card, Image, Modal } from "@/components/Shared/UI";
import { MAINNET_CHAINS } from "@slice/data/chains";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";

enum Currency {
    USDT = "USDT",
    VNDC = "VNDC",
}

interface RoundingConfirmationProps {
    show: boolean;
    currency: Currency;
    paymentAmount: number;
    roundedPaymentAmount: number;
    ryfAmountAfterRounding: number;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const RoundingConfirmation = ({
    show,
    currency,
    paymentAmount,
    roundedPaymentAmount,
    ryfAmountAfterRounding,
    isLoading,
    onConfirm,
    onCancel
}: RoundingConfirmationProps) => {
    const currencySymbol = currency;
    const paymentCurrencyIcon = currency === Currency.USDT 
        ? MAINNET_CHAINS.bsc.usdt.icon 
        : MAINNET_CHAINS.bsc.vndc.icon;

    return (
        <Modal
            onClose={onCancel}
            show={show}
            title="Confirm Payment Amount Rounding"
            size="sm"
        >
            <div className="p-5 space-y-4 pb-6">
                <Card forceRounded>
                    <div className="py-4 px-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <svg 
                                    className="size-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2}
                                    />
                                </svg>
                                <b>Integer Amount Required</b>
                            </div>
                            <span className="text-gray-500 text-sm dark:text-gray-400">
                                Payment amounts must be whole numbers. Would you like to round to the nearest integer?
                            </span>
                        </div>
                    </div>
                </Card>

                <Card forceRounded>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 dark:bg-[#121212] rounded-xl">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Current Amount
                            </span>
                            <div className="flex items-center gap-2">
                                <Image
                                    alt={currencySymbol}
                                    className="size-5 rounded-full"
                                    src={paymentCurrencyIcon}
                                />
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {paymentAmount} {currencySymbol}
                                </span>
                            </div>
                        </div>

                        {/* Arrow Indicator */}
                        <div className="flex justify-center">
                            <div className="rounded-full bg-white p-2 shadow-md transition-all hover:bg-white dark:bg-[#121212] dark:hover:bg-[#121212]">
                                <svg 
                                    className="size-5 text-gray-400 dark:text-brand-500" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >   
                                    <path 
                                        d="M19 14l-7 7m0 0l-7-7m7 7V3" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2}
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Rounded Amount */}
                        <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 dark:bg-[#121212] rounded-xl">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Rounded Amount
                            </span>
                            <div className="flex items-center gap-2">
                                <Image
                                    alt={currencySymbol}
                                    className="size-5 rounded-full"
                                    src={paymentCurrencyIcon}
                                />
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                    {roundedPaymentAmount} {currencySymbol}
                                </span>
                            </div>
                        </div>

                        {/* RYF Amount to Receive */}
                        <div className="flex items-center justify-between p-2 pt-4">
                            <b>
                                You will receive
                            </b>
                            <div className="flex items-center gap-2">
                                <Image
                                    alt={ERC20_TOKEN_SYMBOL}
                                    className="size-5 rounded-full"
                                    src={MAINNET_CHAINS.bsc.token.icon}
                                />
                                <span className="font-semibold">
                                    {ryfAmountAfterRounding.toFixed(2)} {ERC20_TOKEN_SYMBOL}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        className="flex-1 order-2 sm:order-1"
                        onClick={onCancel}
                        outline
                        size="lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 order-1 sm:order-2"
                        disabled={isLoading}
                        loading={isLoading}
                        onClick={onConfirm}
                        size="lg"
                    >
                        Confirm & Create Order
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default RoundingConfirmation;
