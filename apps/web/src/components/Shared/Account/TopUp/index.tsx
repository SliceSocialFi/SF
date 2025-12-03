import { useState } from "react";
import { NATIVE_TOKEN_SYMBOL } from "@slice/data/constants";
import { useBalancesBulkQuery } from "@slice/indexer";
import { Image } from "@/components/Shared/UI";
import { useFundModalStore } from "@/store/non-persisted/modal/useFundModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useDNPAYSuperApp } from "@/components/Common/Providers/DNPAYSuperAppProvider";
import { usePaymentApi } from "@/hooks/usePaymentApi";
import getTokenImage from "@/helpers/getTokenImage";
import Loader from "@/components/Shared/Loader";
import Transfer from "./Transfer";
import MethodSelection from "./MethodSelection";
import DNPAYTopUp from "./DNPAYTopUp";
import PaymentConfirmation from "./PaymentConfirmation";

enum TopUpScreen {
  METHOD_SELECTION = "method-selection",
  METAMASK = "metamask",
  DNPAY = "dnpay",
  PAYMENT_CONFIRMATION = "payment-confirmation",
}

const TopUp = () => {
  const { currentAccount } = useAccountStore();
  const { token } = useFundModalStore();
  const { isReady: isDNPAYReady } = useDNPAYSuperApp();
  const data = usePaymentApi();
  const { currentOrder } = data;
  const [currentScreen, setCurrentScreen] = useState<TopUpScreen>(
    isDNPAYReady
      ? TopUpScreen.METHOD_SELECTION
      : TopUpScreen.METAMASK
  );

  const { data: balance, loading } = useBalancesBulkQuery({
    fetchPolicy: "no-cache",
    pollInterval: 3000,
    skip: !currentAccount?.address,
    variables: {
      request: {
        address: currentAccount?.address,
        ...(token
          ? { tokens: [token?.contractAddress] }
          : { includeNative: true })
      }
    }
  });

  if (loading && currentScreen === TopUpScreen.METAMASK) {
    return <Loader className="my-10" message="Loading balance..." />;
  }

  const tokenBalance =
    balance?.balancesBulk[0].__typename === "Erc20Amount"
      ? Number(balance.balancesBulk[0].value).toFixed(2)
      : balance?.balancesBulk[0].__typename === "NativeAmount"
        ? Number(balance.balancesBulk[0].value).toFixed(2)
        : 0;

  // Method Selection Screen
  if (currentScreen === TopUpScreen.METHOD_SELECTION) {
    return (
      <MethodSelection
        isDNPAYAvailable={isDNPAYReady}
        onSelectDNPAY={() => setCurrentScreen(TopUpScreen.DNPAY)}
        onSelectMetaMask={() => setCurrentScreen(TopUpScreen.METAMASK)}
      />
    );
  }

  // MetaMask Transfer Screen
  if (currentScreen === TopUpScreen.METAMASK) {
    return (
      <div className="m-3">
        {isDNPAYReady && (
          <button
            className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={() => setCurrentScreen(TopUpScreen.METHOD_SELECTION)}
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
        )}
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            alt={token?.symbol}
            className="size-12 rounded-full"
            src={getTokenImage(token?.symbol)}
          />
          <div className="font-bold text-2xl">
            {tokenBalance} {token?.symbol ?? NATIVE_TOKEN_SYMBOL}
          </div>
          <div className="text-gray-500 text-sm dark:text-gray-200">
            Top-up your Lens account with{" "}
            <b>{token?.symbol ?? NATIVE_TOKEN_SYMBOL}</b>
          </div>
        </div>
        <Transfer token={token} />
      </div>
    );
  }

  // DNPAY Top-up Screen
  if (currentScreen === TopUpScreen.DNPAY) {
    return (
      <DNPAYTopUp
        onBack={() => setCurrentScreen(TopUpScreen.METHOD_SELECTION)}
        onOrderCreated={() => setCurrentScreen(TopUpScreen.PAYMENT_CONFIRMATION)}
      />
    );
  }

  return (
    <>
      {
        (currentScreen === TopUpScreen.PAYMENT_CONFIRMATION && currentOrder)
          ? (
            <PaymentConfirmation
              onBack={() => setCurrentScreen(TopUpScreen.DNPAY)}
              onCancel={() => setCurrentScreen(TopUpScreen.METHOD_SELECTION)}
              onSuccess={() => {
                setCurrentScreen(TopUpScreen.METHOD_SELECTION);
              }}
              order={currentOrder.order}
              payment={currentOrder.payment}
            />
          ) : (
            <Loader className="my-10" message="Loading order details..." />
          )
      }
    </>
  );  

};

export default TopUp;
