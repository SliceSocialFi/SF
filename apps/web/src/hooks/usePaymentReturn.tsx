import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { usePaymentApi } from "./usePaymentApi";
import type { GetOrderByProviderPaymentIdData } from "@/types/payment-api";

export enum PaymentReturnState {
    IDLE = "IDLE",
    VERIFYING = "VERIFYING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}

export const usePaymentReturn = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const paymentId = searchParams.get("payment_id");
    const urlStatus = searchParams.get("status");

    const [state, setState] = useState<PaymentReturnState>(PaymentReturnState.IDLE);
    const [errorMessage, setErrorMessage] = useState("");
    const [order, setOrder] = useState<GetOrderByProviderPaymentIdData | null>(null);
    const { getOrderByProviderPaymentId } = usePaymentApi();

    const checkPaymentStatus = useCallback(async () => {
        if (!paymentId) return false;

        try {
            const paymentData = await getOrderByProviderPaymentId(paymentId);
            setOrder(paymentData);
            if (paymentData.payment.status === "succeeded") {
                setState(PaymentReturnState.SUCCESS);
                return true;
            }
            setState(PaymentReturnState.FAILED);
            setErrorMessage("Transaction failed. Please contact support.");
            return false;
        } catch (error) {
            console.error("Payment verification error:", error);
            // setState(PaymentReturnState.FAILED);
            setErrorMessage("Failed to verify payment. Please try again.");
            return false;
        }
    }, [paymentId, getOrderByProviderPaymentId]);

    const clearPaymentParams = useCallback(() => {
        searchParams.delete("payment_id");
        searchParams.delete("status");
        setSearchParams(searchParams, { replace: true });
        setState(PaymentReturnState.IDLE);
        setErrorMessage("");
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (!paymentId || !urlStatus || state === PaymentReturnState.SUCCESS) {
            return;
        }

        if (urlStatus !== "success") {
            setState(PaymentReturnState.FAILED);
            toast.error("Payment was not successful or was cancelled by the user.");
            setErrorMessage("Payment was not successful or was cancelled by the user.");
            return;
        }

        setState(PaymentReturnState.VERIFYING);

        const intervalId = setInterval(async () => {
            const isFinished = await checkPaymentStatus();
            if (isFinished) {
                clearInterval(intervalId);
                toast.success("Payment successful!");
            }
        }, 5000);

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            setState(PaymentReturnState.FAILED);
            toast.error("Payment verification timed out. Please try again.");
            setErrorMessage("Payment verification timed out. Please try again.");
        }, 3600000); // 60 minutes 

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [paymentId, urlStatus, checkPaymentStatus]);

    return {
        state,
        order,
        errorMessage,
        hasPaymentParams: Boolean(paymentId && urlStatus),
        clearPaymentParams
    };
};
