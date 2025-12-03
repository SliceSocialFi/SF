import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { Button, Card, Input, Image, Select } from "@/components/Shared/UI";
import { usePaymentApi } from "@/hooks/usePaymentApi";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { getPaymentAmount, convertPaymentToRYF } from "@/helpers/getDNPAYPaymentAmount";
import Loader from "@/components/Shared/Loader";
import { MAINNET_CHAINS } from "@slice/data/chains";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";

enum Currency {
    USDT = "USDT",
    VNDC = "VNDC",
}

interface DNPAYTopUpProps {
    onBack: () => void;
    onOrderCreated: () => void;
}

const DNPAYTopUp = ({ onBack, onOrderCreated }: DNPAYTopUpProps) => {
    const { currentAccount } = useAccountStore();
    const { createOrder, isLoading } = usePaymentApi();

    const [currency, setCurrency] = useState<Currency>(Currency.USDT);
    const [topAmount, setTopAmount] = useState<string>("10"); // Amount in top input
    const [bottomAmount, setBottomAmount] = useState<string>("0"); // Amount in bottom input
    const [isSwapped, setIsSwapped] = useState(false); // false: RYF top, true: Payment currency top
    const [isCalculating, setIsCalculating] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<string>("0");

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

    const handleChangeCurrency = (value: Currency) => {
        setCurrency(value);
    }

    // Calculate conversion based on which input is active
    const calculateConversion = useCallback(async () => {
        if (!topAmount || Number(topAmount) <= 0) {
            setBottomAmount("0");
            setExchangeRate("0");
            return;
        }

        setIsCalculating(true);
        try {
            let result;
            if (!isSwapped) {
                result = await getPaymentAmount(topAmount, currency);
            } else {
                result = await convertPaymentToRYF(topAmount, currency);
            }
            setBottomAmount(result.formattedAmount);
            setExchangeRate(result.rate + "");
        } catch (error: any) {
            console.error("Conversion error:", error);
            toast.error(error.message || "Failed to calculate conversion");
            setBottomAmount("0");
            setExchangeRate("0");
        } finally {
            setIsCalculating(false);
        }
    }, [topAmount, currency, isSwapped]);

    useEffect(() => {
        const timer = setTimeout(() => {
            calculateConversion();
        }, 1000); // Debounce

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

        try {
            // Calculate how much payment currency needed for the RYF amount
            const ryfAmount = isSwapped ? bottomAmount : topAmount;
            await createOrder({
                userWalletAddress: currentAccount.address,
                amount: Number(ryfAmount),
                currency
            });

            toast.success("Order created successfully");
            onOrderCreated();
        } catch (error: any) {
            console.error("Create order error:", error);
            toast.error(error.message || "Failed to create order");
        }
    };

    return (
        <div className="m-5 space-y-5">
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
                <span>Back to methods</span>
            </button>

            {isLoading ? (
                <div className="m-5 min-w-[200px]">
                    <Loader className="my-10" message="Creating order..." />
                </div>
            ) : (
                <>
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
                                    {isSwapped ? `Pay with ${currencySymbol}` : "You want to receive"}
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
                                        onChange={(e) => setTopAmount(e.target.value)}
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
                                        onChange={(e) => setTopAmount(e.target.value)}
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
                                    {!isCalculating && Number(exchangeRate) > 0 ? (
                                        <div className="text-gray-500 text-sm dark:text-gray-400">
                                            <p>
                                                Exchange rate: <b>1 {ERC20_TOKEN_SYMBOL}</b> ≈ <b>{exchangeRate} {currencySymbol}</b>
                                            </p>
                                            <p>
                                                You will use <b>{isSwapped ? topAmount : bottomAmount} {currencySymbol}</b> to redeem <b>{isSwapped ? bottomAmount : topAmount} {ERC20_TOKEN_SYMBOL}</b>
                                            </p>
                                        </div>
                                    ): (
                                        <div className="my-2">
                                            <Loader message="Loading..." />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Create Order Button */}
                    <Button
                        className="w-full"
                        disabled={isLoading || !topAmount || Number(topAmount) <= 0 || isCalculating}
                        loading={isLoading}
                        onClick={handleCreateOrder}
                        size="lg"
                    >
                        Create Order
                    </Button>

                    {/* Info Text */}
                    <p className="text-center text-gray-500 text-xs dark:text-gray-400">
                        You will be redirected to confirm your payment after creating the order
                    </p>
                </>
            )}
        </div>
    );
};

export default DNPAYTopUp;
