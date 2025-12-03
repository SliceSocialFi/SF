import { useState } from "react";
import { NATIVE_TOKEN_SYMBOL } from "@slice/data/constants";
import { useBalancesBulkQuery } from "@slice/indexer";
import Loader from "@/components/Shared/Loader";
import { Image } from "@/components/Shared/UI";
import getTokenImage from "@/helpers/getTokenImage";
import { useFundModalStore } from "@/store/non-persisted/modal/useFundModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useDNPAYSuperApp } from "@/components/Common/Providers/DNPAYSuperAppProvider";
import { usePaymentApi } from "@/hooks/usePaymentApi";
import Transfer from "./Transfer";
import MethodSelection from "./MethodSelection";
import DNPAYTopUp from "./DNPAYTopUp";
import PaymentConfirmation from "./PaymentConfirmation";

type TopUpScreen = "method-selection" | "metamask" | "dnpay" | "payment-confirmation";

const TopUp = () => {
  const { currentAccount } = useAccountStore();
  const { token } = useFundModalStore();
  const { isReady: isDNPAYReady } = useDNPAYSuperApp();
  const data = usePaymentApi();
  const { currentOrder } = data;
  const [currentScreen, setCurrentScreen] = useState<TopUpScreen>(
    isDNPAYReady ? "method-selection" : "metamask"
  );

  console.log("DNPAY Super App is ready:", isDNPAYReady);

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

  console.log("Balance data:", balance);
  console.log("Loading balance:", loading);

  if (loading) {
    return <Loader className="my-10" message="Loading balance..." />;
  }

  const tokenBalance =
    balance?.balancesBulk[0].__typename === "Erc20Amount"
      ? Number(balance.balancesBulk[0].value).toFixed(2)
      : balance?.balancesBulk[0].__typename === "NativeAmount"
        ? Number(balance.balancesBulk[0].value).toFixed(2)
        : 0;

  // Method Selection Screen
  if (currentScreen === "method-selection") {
    return (
      <MethodSelection
        isDNPAYAvailable={isDNPAYReady}
        onSelectDNPAY={() => setCurrentScreen("dnpay")}
        onSelectMetaMask={() => setCurrentScreen("metamask")}
      />
    );
  }

  // MetaMask Transfer Screen
  if (currentScreen === "metamask") {
    return (
      <div className="m-3">
        {isDNPAYReady && (
          <button
            className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={() => setCurrentScreen("method-selection")}
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
  if (currentScreen === "dnpay") {
    return (
      <DNPAYTopUp
        onBack={() => setCurrentScreen("method-selection")}
        onOrderCreated={() => setCurrentScreen("payment-confirmation")}
      />
    );
  }

  console.log("DATA:", data);
  console.log("currentScreen:", currentScreen);
  console.log("Current Order:", currentOrder);

  return (
    <>
      {
        (currentScreen === "payment-confirmation" && currentOrder)
          ? (
            <PaymentConfirmation
              onBack={() => setCurrentScreen("dnpay")}
              onCancel={() => setCurrentScreen("method-selection")}
              onSuccess={() => {
                setCurrentScreen("method-selection");
                // Optionally close the modal here
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
