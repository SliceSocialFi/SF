import axios from "axios";
import { useMemo } from "react";
import { useDNPAYSuperApp } from "@/components/Common/Providers/DNPAYSuperAppProvider";
import { PAYMENT_API_URL } from "@slice/data/constants";
import {
    OrderCreationRequest,
    OrderCreationResponse,
    OrderCreationData,
    ConfirmPaymentRequest,
    ConfirmPaymentResponse,
    ConfirmPaymentData,
    OrderCancellationResponse,
    OrderData
} from "@/types/payment-api";

export const usePaymentApi = () => {
    const {
        token,
        appSessionId,
        currentOrder,
        setCurrentOrder,
        isLoading,
        setIsLoading
    } = useDNPAYSuperApp();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: PAYMENT_API_URL,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (token) {
            instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        return instance;
    }, [token]);

    const createOrder = async (orderData: OrderCreationRequest): Promise<OrderCreationData> => {
        try {
            setIsLoading(true);

            if (!appSessionId) {
                throw new Error("DNPAY session not available");
            }

            const response = await api.post<OrderCreationResponse>(
                `/api/orders`,
                {
                    ...orderData,
                    appSessionId: appSessionId!,
                }
            );
            const data = response.data.data;
            setCurrentOrder(data);
            return data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || "Failed to create order"
                );
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const cancelOrder = async (orderId: string): Promise<OrderData> => {
        try {
            setIsLoading(true);
            const response = await api.patch<OrderCancellationResponse>(
                `/api/orders/${orderId}/cancel`,
                {}
            );
            setCurrentOrder(null);
            return response.data.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || "Failed to cancel order"
                );
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const confirmPayment = async (paymentId: string, paymentData: ConfirmPaymentRequest): Promise<ConfirmPaymentData> => {
        try {
            setIsLoading(true);
            const response = await api.post<ConfirmPaymentResponse>(
                `/api/dnpay-payment/${paymentId}/confirm`,
                paymentData
            );
            setCurrentOrder(null);
            return response.data.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || "Failed to confirm payment"
                );
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, currentOrder, createOrder, confirmPayment, cancelOrder };
};