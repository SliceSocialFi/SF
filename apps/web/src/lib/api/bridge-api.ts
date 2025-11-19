import axios from "axios";
import { BRIDGE_API_URL } from "@slice/data/constants";

const bridgeApi = axios.create({
    baseURL: BRIDGE_API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface BridgeStatusResponse {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    sourceChain: string;
    destinationChain: string;
    amount: string;
    fromAddress: string;
    toAddress: string;
    txHash?: string;
    destinationTxHash?: string;
    createdAt: string;
    updatedAt: string;
    error?: string;
}

export interface EstimateFeeResponse {
    feePercentage: string;
    estimatedFee: string;
    totalReceiveAmount: string;
}

export const getBridgeStatus = async (id: string): Promise<BridgeStatusResponse> => {
    try {
        const response = await bridgeApi.get<BridgeStatusResponse>(`/api/status/${id}`);
        return response.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || "Failed to get bridge status"
            );
        }
        throw error;
    }
};

export const estimateBridgeFee = async (amount: string | number): Promise<EstimateFeeResponse> => {
    try {
        const response = await bridgeApi.get(
            "/api/bridge/estimate-fee",
            {
                params: { amount },
            }
        );

        return response.data.data;
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            throw new Error(
                error.response?.data?.message || "Failed to estimate bridge fee"
            );
        }
        throw error;
    }
};

export default bridgeApi;
