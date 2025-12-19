export enum OrderStatus {
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
    providerPaymentId: string;
    provider: string;
    appSessionId?: string | null;
    status: string;
    currency: Currency;
    amount: number;
    createdAt: string;
    expiresAt: string;
    processedAt?: string | null;
    token?: string;
    redirectUrl?: string;
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

export type PriceData = {
    usdtRate: number;
    vndcRate: number;
}

export type GetPriceResponse = {
    data: PriceData;
} & PaymentResponse;

export type GetPaymentData = {
    id: string;
    providerPaymentId: string;
    provider: string;
    appSessionId?: string | null;
    currency: Currency;
    amount: number;
    status: string;
    orderId: string;
    createdAt: string;
    expiresAt: string;
    processedAt?: string | null;
}

export type GetOrderByProviderPaymentIdData = {
    order: OrderData;
    payment: GetPaymentData;
}

export type GetOrderByProviderPaymentIdResponse = {
    data: GetOrderByProviderPaymentIdData;
} & PaymentResponse;