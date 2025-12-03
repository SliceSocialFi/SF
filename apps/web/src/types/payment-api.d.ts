enum OrderStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELED = "CANCELED",
}

export enum Currency {
    USDT = "USDT",
    VNDC = "VNDC",
}

export type OrderData = {
    id: string;
    email: string;
    userWalletAddress: string;
    tokenAddress: string;
    amount: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}

export type PaymentData = {
    id: string;
    orderId: string;
    clientSecret: string;
    provider: string;
    appSessionId: string;
    status: string;
    currency: Currency;
    amount: number;
    createdAt: string;
    expiresAt: string;
}

type PaymentResponse = {
    success: boolean;
    message: string;
}

export type OrderCreationData = {
    order: OrderData;
    payment: PaymentData;
}

export type OrderCreationRequest = {
    userWalletAddress: string;
    tokenAddress?: string;
    amount: number; // Số lượng token gốc để chuyển đổi
    currency: Currency;
};

export type OrderCreationResponse = {
    data: OrderCreationData;
} & PaymentResponse;

export type ConfirmPaymentRequest = {
    clientSecret: string;
};

export type ConfirmPaymentData = {
    txHash: string;
} & PaymentData;

export type ConfirmPaymentResponse = {
    data: ConfirmPaymentData;
} & PaymentResponse;

export type OrderCancellationResponse = {
    data: OrderData;
} & PaymentResponse;