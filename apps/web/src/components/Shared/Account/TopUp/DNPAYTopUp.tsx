import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { Button, Card, Input, Image, Select } from "@/components/Shared/UI";
import { usePaymentApi } from "@/hooks/usePaymentApi";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import Loader from "@/components/Shared/Loader";
import { MAINNET_CHAINS } from "@slice/data/chains";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";
// import RoundingConfirmation from "./RoundingConfirmation";

enum Currency {
    USDT = "USDT",
    VNDC = "VNDC",
}

interface ExchangeRates {
    usdt: number;
    vndc: number;
}

interface DNPAYTopUpProps {
    onBack: () => void;
    onOrderCreated: () => void;
}

const DNPAYTopUp = ({ onBack, onOrderCreated }: DNPAYTopUpProps) => {
    const { currentAccount } = useAccountStore();
    const { createOrder, isLoading, getPrices } = usePaymentApi();

    const [currency, setCurrency] = useState<Currency>(Currency.USDT);
    const [topAmount, setTopAmount] = useState<number>(10); // Amount in top input
    const [bottomAmount, setBottomAmount] = useState<number>(0); // Amount in bottom input
    const [isSwapped, setIsSwapped] = useState(false); // false: RYF top, true: Payment currency top
    const [isCalculating, setIsCalculating] = useState(false);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({ usdt: 0, vndc: 0 });
    // const [showRoundingConfirm, setShowRoundingConfirm] = useState(false);

    const currencySymbol = currency;
    const paymentCurrencyIcon = currency === Currency.USDT 
        ? MAINNET_CHAINS.bsc.usdt.icon 
        : MAINNET_CHAINS.bsc.vndc.icon;

    const currencyOptions = [
        {
            label: Currency.USDT,
            value: Currency.USDT,
            icon: MAINNET_CHAINS.bsc.usdt.icon
        },
        {
            label: Currency.VNDC,
            value: Currency.VNDC,
            icon: MAINNET_CHAINS.bsc.vndc.icon
        },
    ];

    // Get current exchange rate based on selected currency
    const currentRate = currency === Currency.USDT ? exchangeRates.usdt : exchangeRates.vndc;
    const currencyDecimals = currency === Currency.USDT ? 6 : 0;

    // Fetch exchange rates on mount and refresh every 10 seconds
    useEffect(() => {
        const fetchExchangeRates = async () => {
            try {
                const rates = await getPrices();
                const newRates = {
                    usdt: Number(rates.usdtRate.toFixed(6)),
                    vndc: Number(rates.vndcRate),
                };
                setExchangeRates(newRates);
            } catch (error: any) {
                console.error("Fetch exchange rates error:", error);
                toast.error(error.message || "Failed to fetch exchange rates");
            }
        };

        // Fetch immediately on mount
        fetchExchangeRates();

        // Then refresh every 10 seconds
        const intervalId = setInterval(() => {
            fetchExchangeRates();
        }, 60000); // 1 minute

        return () => clearInterval(intervalId);
    }, []); // Empty dependency array - only run once on mount

    const handleChangeCurrency = (value: string) => {
        setCurrency(value as Currency);
    };

    // Calculate conversion based on which input is active
    const calculateConversion = useCallback(() => {
        if (!topAmount || topAmount <= 0 || currentRate === 0) {
            setBottomAmount(0);
            return;
        }

        setIsCalculating(true);
        try {
            let result: number;
            if (!isSwapped) {
                // Top = RYF, Bottom = Payment Currency (USDT/VNDC)
                result = topAmount * currentRate;
            } else {
                // Top = Payment Currency, Bottom = RYF
                result = topAmount / currentRate;
            }

            setBottomAmount(Number(result.toFixed(currencyDecimals)));
        } catch (error: any) {
            console.error("Conversion error:", error);
            toast.error(error.message || "Failed to calculate conversion");
            setBottomAmount(0);
        } finally {
            setIsCalculating(false);
        }
    }, [topAmount, currency, isSwapped, currentRate, exchangeRates]);

    useEffect(() => {
        const timer = setTimeout(() => {
            calculateConversion();
        }, 300); // Debounce 300ms for better UX

        return () => clearTimeout(timer);
    }, [calculateConversion]);

    // Handle swap button click
    const handleSwap = () => {
        setIsSwapped(!isSwapped);
        // Swap the values
        const temp = topAmount;
        setTopAmount(bottomAmount);
        setBottomAmount(temp);
    };

    const handleCreateOrder = async () => {
        if (!currentAccount?.address) {
            toast.error("Please connect your wallet");
            return;
        }

        if (!topAmount || Number(topAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (topAmount > 1000) {
            toast.error("Amount cannot exceed 1000");
            return;
        }

        // Get payment amount (the amount in payment currency)
        const paymentAmount = isSwapped ? topAmount : bottomAmount;
        
        // Check if payment amount is not an integer
        // if (!Number.isInteger(paymentAmount)) {
        //     setShowRoundingConfirm(true);
        //     return;
        // }

        // If payment amount is already an integer, proceed with order creation
        await createOrderWithAmount(paymentAmount);
    };

    const createOrderWithAmount = async (paymentAmount: number) => {
        if (!currentAccount?.address) {
            toast.error("Please connect your wallet");
            return;
        }

        try {
            // Calculate RYF amount from payment amount
            const ryfAmount = paymentAmount / currentRate;
            
            await createOrder({
                userWalletAddress: currentAccount.address,
                amount: Number(ryfAmount),
                currency
            });

            toast.success("Order created successfully");
            onOrderCreated();
        } catch (error: any) {
            console.error("Create order error:", error);

            if (error?.message && error.message.includes("Insufficient balance")) {
                toast.error("Insufficient balance in your DNPay wallet");
                return;
            }

            toast.error(error.message || "Failed to create order");
        }
    };

    // const handleConfirmRounding = async () => {
    //     const paymentAmount = isSwapped ? topAmount : bottomAmount;
    //     const roundedPaymentAmount = Math.round(paymentAmount);
        
    //     setShowRoundingConfirm(false);
    //     await createOrderWithAmount(roundedPaymentAmount);
    // };

    // const handleCancelRounding = () => {
    //     setShowRoundingConfirm(false);
    // };

    // Calculate rounded values for display in confirmation modal
    // const paymentAmount = isSwapped ? topAmount : bottomAmount;
    // const roundedPaymentAmount = Math.round(paymentAmount);
    // const ryfAmountAfterRounding = roundedPaymentAmount / currentRate;

    return (
        <>
            <div className="m-5 mt-0 space-y-5">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4 p-10 pb-4">
                        <Loader/>
                        <span className="font-semibold text-lg">
                            Creating your order...
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="my-4 -mx-1">
                            <button
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                onClick={onBack}
                                type="button"
                            >
                                <svg 
                                    className="size-5" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path 
                                        d="M15 19l-7-7 7-7" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2}
                                    />
                                </svg>
                                <span className="text-sm">Back to methods</span>
                            </button>
                        </div>

                        {/* Currency Selection */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-col gap-1">
                                <b>Payment Currency</b>
                                <span className="text-gray-500 text-sm dark:text-gray-400">
                                    Choose currency to pay with
                                </span>
                            </div>
                            <Select
                                defaultValue={currency}
                                className="dark:bg-[#121212] w-full px-4"
                                options={currencyOptions}
                                onChange={handleChangeCurrency}
                                iconClassName="size-4 rounded-full"
                            />
                        </div>

                        {/* Conversion Inputs */}
                        <Card forceRounded>
                            <div className="p-4 space-y-2"> 
                                {/* Top Input */}
                                <div>
                                    <label className="block text-sm">
                                        {isSwapped ? "Pay with" : "You want to receive"}
                                    </label>
                                    <div className="flex items-center gap-3 p-2 dark:border-gray-700">
                                        <Image
                                            alt={isSwapped ? currencySymbol : ERC20_TOKEN_SYMBOL}
                                            className="size-8 rounded-full flex-shrink-0"
                                            src={isSwapped ? paymentCurrencyIcon : MAINNET_CHAINS.bsc.token.icon}
                                        />
                                        <Input
                                            className="flex-1"
                                            inputMode="decimal"
                                            min="0"
                                            max="1000"
                                            onChange={(e) => {
                                                const raw = e.currentTarget.value ?? "";
                                                const limited = raw.toString().slice(0, 10); // enforce 10 chars
                                                const parsed = limited === "" ? 0 : Number(limited);
                                                setTopAmount(Number.isNaN(parsed) ? 0 : parsed);
                                            }}
                                            placeholder="0.00"
                                            type="number"
                                            value={topAmount}
                                        />
                                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 w-[8%]">
                                            {isSwapped ? currencySymbol : ERC20_TOKEN_SYMBOL}
                                        </span>
                                    </div>
                                </div>

                                {/* Swap Button */}
                                <div className="flex justify-center -my-1">
                                    <button
                                        className="rounded-full bg-white p-2 shadow-md transition-all hover:bg-white dark:bg-[#121212] dark:hover:bg-[#121212]"
                                        onClick={handleSwap}
                                        type="button"
                                    >
                                        <svg 
                                            className="size-5 text-gray-600 dark:text-gray-400 hover:text-brand-500"
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path 
                                                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round" 
                                                strokeWidth={2}
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Bottom Input (Read-only) */}
                                <div>
                                    <label className="block text-sm">
                                        {isSwapped ? "You will receive" : "Required"}
                                    </label>
                                    <div className="flex items-center gap-3 p-2 dark:border-gray-700">
                                        <Image
                                            alt={isSwapped ? ERC20_TOKEN_SYMBOL : currencySymbol}
                                            className="size-8 rounded-full flex-shrink-0"
                                            src={isSwapped ? MAINNET_CHAINS.bsc.token.icon : paymentCurrencyIcon}
                                        />
                                        <Input
                                            className="flex-1"
                                            placeholder="0.00"
                                            disabled
                                            value={isCalculating ? "Calculating..." : bottomAmount}
                                        />
                                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 w-[8%]">
                                            {isSwapped ? ERC20_TOKEN_SYMBOL : currencySymbol}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Exchange Rate Info */}
                        <Card className="dark:bg-[#121212]" forceRounded>
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium text-sm">
                                            Payment Summary
                                        </p>
                                        {!isCalculating && currentRate > 0 ? (
                                            <div className="text-gray-500 text-sm dark:text-gray-400">
                                                <p>
                                                    Exchange rate: <b>1 {ERC20_TOKEN_SYMBOL}</b> ≈ <b>{currentRate} {currencySymbol}</b>
                                                </p>
                                                <p>
                                                    You will use <b>{isSwapped ? topAmount : bottomAmount} {currencySymbol}</b> to redeem <b>{isSwapped ? bottomAmount : topAmount} {ERC20_TOKEN_SYMBOL}</b>
                                                </p>
                                            </div>
                                        ): (
                                            <div className="flex flex-col items-center gap-4 p-2">
                                                <Loader/>
                                                <span className="font-semibold text-lg">
                                                    Calculating exchange rate...
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Create Order Button */}
                        <Button
                            className="w-full disabled:cursor-not-allowed"
                            disabled={isLoading || !topAmount || Number(topAmount) <= 0 || topAmount > 1000 || isCalculating || bottomAmount < 1}
                            loading={isLoading}
                            onClick={handleCreateOrder}
                            size="lg"
                        >
                            {topAmount > 1000 && !isCalculating
                                ? `Maximum ${ERC20_TOKEN_SYMBOL} amount is 1000`
                                : bottomAmount < 1 && topAmount > 0 && !isCalculating 
                                ? `Minimum ${isSwapped ? 'RYF' : currencySymbol} amount is 1` 
                                : 'Create Order'}
                        </Button>

                        {/* Info Text */}
                        <p className="text-center text-gray-500 text-xs dark:text-gray-400">
                            You will be redirected to confirm your payment after creating the order
                        </p>
                    </>
                )}
            </div>

            {/* Rounding Confirmation Modal */}
            {/* <RoundingConfirmation
                show={showRoundingConfirm}
                currency={currency}
                paymentAmount={paymentAmount}
                roundedPaymentAmount={roundedPaymentAmount}
                ryfAmountAfterRounding={ryfAmountAfterRounding}
                isLoading={isLoading}
                onConfirm={handleConfirmRounding}
                onCancel={handleCancelRounding}
            /> */}
        </>
    );
};

export default DNPAYTopUp;
