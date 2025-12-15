import axios from "axios";
import { useMemo } from "react";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";
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
    OrderData,
    GetPriceResponse,
    PriceData,
    GetOrderByProviderPaymentIdData,
    GetOrderByProviderPaymentIdResponse
} from "@/types/payment-api";

export const usePaymentApi = () => {
    const {
        isReady,
        token: dnpayAccessToken,
        appSessionId,
        currentOrder,
        setCurrentOrder,
        isLoading,
        setIsLoading
    } = useDNPAYSuperApp();

    const { accessToken: lensAccessToken } = hydrateAuthTokens();

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: PAYMENT_API_URL,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (lensAccessToken) {
            instance.defaults.headers.common["Authorization"] = `Bearer ${lensAccessToken}`;
        }

        if (dnpayAccessToken) {
            instance.defaults.headers.common["X-DNPAY-Access-Token"] = `Bearer ${dnpayAccessToken}`;
        }

        return instance;
    }, [lensAccessToken, dnpayAccessToken]);

    const createOrder = async (orderData: OrderCreationRequest): Promise<OrderCreationData> => {
        try {
            setIsLoading(true);

            if (isReady) {
                if (!appSessionId) {
                    throw new Error("DNPAY session not available");
                }

                const response = await api.post<OrderCreationResponse>(
                    `/api/orders/without-redirect-payment`,
                    {
                        ...orderData,
                        appSessionId: appSessionId!,
                    }
                );
                const data = response.data.data;
                setCurrentOrder(data);
                return data;
            }

            const response = await api.post<OrderCreationResponse>(
                `/api/orders/redirect-payment`,
                orderData,
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

    const confirmPayment = async (
        providerPaymentId: string,
        paymentData: ConfirmPaymentRequest
    ): Promise<ConfirmPaymentData> => {
        try {
            setIsLoading(true);
            const response = await api.post<ConfirmPaymentResponse>(
                `/api/dnpay-payment/${providerPaymentId}/confirm`,
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

    const getPrices = async (): Promise<PriceData> => {
        try {
            const response = await api.get<GetPriceResponse>(`/api/token-prices`);
            return response.data.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || "Failed to get price"
                );
            }
            throw error;
        }
    };

    const getOrderByProviderPaymentId = async (
        providerPaymentId: string
    ): Promise<GetOrderByProviderPaymentIdData> => {
        try {
            const response = await api.get<GetOrderByProviderPaymentIdResponse>(
                `/api/orders/provider-payment/${providerPaymentId}`
            );
            return response.data.data;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || "Failed to get payment"
                );
            }
            throw error;
        }
    }

    return {
        isLoading,
        currentOrder,
        createOrder,
        confirmPayment,
        cancelOrder,
        getPrices,
        getOrderByProviderPaymentId,
    };
};