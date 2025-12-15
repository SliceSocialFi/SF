import { useState } from "react";
import { Button, Card, Image, Modal } from "@/components/Shared/UI";
import { usePaymentApi } from "@/hooks/usePaymentApi";
import { toast } from "sonner";
import { MAINNET_CHAINS } from "@slice/data/chains";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";
import { getPaymentStatus } from "@/helpers/getDNPAYPaymentStatus";
import type { PaymentData, OrderData } from "@/types/payment-api";
import Loader from "@/components/Shared/Loader";

enum Currency {
  USDT = "USDT",
  VNDC = "VNDC",
}

interface PaymentConfirmationProps {
  order: OrderData;
  payment: PaymentData;
  isDNPAYReady: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSuccess: () => void;
}

const PaymentConfirmation = ({ 
  order, 
  payment, 
  isDNPAYReady,
  onBack, 
  onCancel,
  onSuccess 
}: PaymentConfirmationProps) => {
  const { confirmPayment, cancelOrder, isLoading } = usePaymentApi();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const statusInfo = getPaymentStatus(payment.status);

  const confirmManualPayment = async () => {
    setIsConfirming(true);
    try {
      await confirmPayment(payment.id, {
        clientSecret: payment.clientSecret
      });
      
      toast.success("Payment confirmed successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Confirm payment error:", error);
      toast.error(error.message || "Failed to confirm payment");
    } finally {
      setIsConfirming(false);
    }
  };

  const redirectDNPAYPayment = () => {
    window.location.href = payment.redirectUrl!;
  };

  const handleConfirmPayment = async () => {
    if (isDNPAYReady) {
      await confirmManualPayment();
    } else {
      redirectDNPAYPayment();
    }
  };

  const handleCancelOrder = async () => {
    try {
      await cancelOrder(order.id);
      toast.success("Order cancelled");
      onCancel();
    } catch (error: any) {
      console.error("Cancel order error:", error);
      toast.error(error.message || "Failed to cancel order");
    }
  };

  const handleBackOrClose = () => {
    setShowCancelConfirm(true);
  };

  if (isLoading || isConfirming) {
    return (
      <div className="flex flex-col items-center gap-4 p-10">
          <Loader/>
          <span className="font-semibold text-lg">
            {isConfirming ? "Confirming payment..." : "Loading order details..."}
          </span>
      </div>
    );
  }

  return (
    <>
      <Modal
        onClose={handleBackOrClose}
        show={true}
        title="Confirm Your Payment"
        closeButtonAction={handleBackOrClose}
        staticBackdrop={true}
      >
        <div className="m-4">
          <button
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={handleBackOrClose}
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
            <span className="text-sm">Back</span>
          </button>
        </div>
        <div className="m-5 mt-0 space-y-5">
          {/* Order Summary */}
          <Card forceRounded>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-xl mb-2">Confirm Your Payment</h3>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  Review your order details before confirming
                </p>
              </div>

              <div className="bg-white dark:bg-[#121212] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm dark:text-gray-400">Order ID</span>
                  <span className="font-mono text-sm">{order.id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm dark:text-gray-400">Amount {payment.currency} you must pay</span>
                  <div className="flex items-center gap-2">
                    <Image
                      alt={payment.currency}
                      className="size-5 rounded-full"
                      src={payment.currency === Currency.USDT
                        ? MAINNET_CHAINS.bsc.usdt.icon
                        : MAINNET_CHAINS.bsc.vndc.icon
                      }
                    />
                    <span className="font-semibold">
                      {Number(payment.amount)} {payment.currency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm dark:text-gray-400">Amount {ERC20_TOKEN_SYMBOL} you will receive</span>
                  <div className="flex items-center gap-2">
                    <Image
                      alt={ERC20_TOKEN_SYMBOL}
                      className="size-5 rounded-full"
                      src={MAINNET_CHAINS.bsc.token.icon}
                    />
                    <span className="font-semibold">
                      {Number(Number(order.amount).toFixed(6))} {ERC20_TOKEN_SYMBOL}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm dark:text-gray-400">Status</span>
                  <span className={`rounded-full px-3 py-1 font-medium text-xs ${statusInfo.colorClass}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm dark:text-gray-400">Expires At</span>
                  <span className="text-sm">
                    {new Date(payment.expiresAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Warning Message */}
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
                          <b>Warning</b>
                  </div>
                  <span className="text-gray-500 text-sm dark:text-gray-400">
                      Please make sure you have completed the payment before confirming. 
                      Confirming without payment may result in order failure.
                  </span>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={handleBackOrClose}
              outline
              size="lg"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={isLoading}
              loading={isConfirming}
              onClick={handleConfirmPayment}
              size="lg"
            >
              {isDNPAYReady ? "Confirm Payment" : "Go to DNPAY"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        onClose={() => setShowCancelConfirm(false)}
        show={showCancelConfirm}
        title="Cancel Order?"
        staticBackdrop={true}
      >
        <div className="m-5 space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            If you go back or close now, your current order will be cancelled. 
            Are you sure you want to proceed?
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => setShowCancelConfirm(false)}
              outline
              size="lg"
            >
              Keep Order
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600"
              loading={isLoading}
              onClick={async () => {
                await handleCancelOrder();
                setShowCancelConfirm(false);
              }}
              size="lg"
            >
              Cancel Order
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PaymentConfirmation;
