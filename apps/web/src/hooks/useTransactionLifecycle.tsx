import { ERRORS } from "@slice/data/errors";
import getTransactionData from "@slice/helpers/getTransactionData";
import type {
  SelfFundedTransactionRequestFragment,
  SponsoredTransactionRequestFragment,
  TransactionWillFailFragment
} from "@slice/indexer";
import type { ApolloClientError } from "@slice/types/errors";
import { createWalletClient, custom } from "viem";
import { sendEip712Transaction, sendTransaction } from "viem/zksync";
import { useWalletClient } from "wagmi";
import { CHAIN } from "@slice/data/constants";
import { useEmbeddedWalletStore } from "@/store/non-persisted/useEmbeddedWalletStore";
import { walletService } from "@/lib/api/auth-api";
import useHandleWrongNetwork from "./useHandleWrongNetwork";

type AnyTransactionRequestFragment =
  | SelfFundedTransactionRequestFragment
  | SponsoredTransactionRequestFragment
  | TransactionWillFailFragment
  | { __typename?: string; hash?: unknown }
  | ((...args: never[]) => unknown);

const useTransactionLifecycle = () => {
  const { data: wagmiClient } = useWalletClient();
  const { provider: embeddedProvider, isEmbeddedWallet, web3AuthToken, setEmbeddedWallet } = useEmbeddedWalletStore();
  const handleWrongNetwork = useHandleWrongNetwork();

  // Tạo wallet client từ embedded provider hoặc dùng wagmi client
  const getWalletClient = async () => {
    console.log("embeddedProvider:", embeddedProvider);
    console.log("isEmbeddedWallet:", isEmbeddedWallet);
    console.log("web3AuthToken:", web3AuthToken ? "Present" : "NULL");

    if (isEmbeddedWallet) {
      // Nếu có provider sẵn, dùng luôn
      if (embeddedProvider) {
        console.log("🔑 Using cached embedded wallet provider for transaction");
        return createWalletClient({
          chain: CHAIN,
          transport: custom(embeddedProvider)
        });
      }
      
      // Nếu không có provider nhưng có token, tái tạo provider
      if (web3AuthToken) {
        console.log("🔄 Reconnecting to Web3Auth...");
        try {
          const { provider, address } = await walletService.connectWeb3Auth(web3AuthToken);
          console.log("✅ Web3Auth reconnected:", address);
          
          // Lưu lại provider vào store
          setEmbeddedWallet(address, provider, web3AuthToken);
          
          return createWalletClient({
            chain: CHAIN,
            transport: custom(provider)
          });
        } catch (error) {
          console.error("❌ Failed to reconnect Web3Auth:", error);
          throw new Error("Failed to reconnect embedded wallet. Please login again.");
        }
      }
      
      throw new Error("No embedded wallet provider or token available. Please login again.");
    }
    
    if (wagmiClient) {
      console.log("🔑 Using wagmi wallet client for transaction");
      return wagmiClient;
    }
    
    console.error("❌ No wallet client available");
    return null;
  };

  const handleSponsoredTransaction = async (
    transactionData: AnyTransactionRequestFragment,
    onCompleted: (hash: string) => void
  ) => {
    if (
      typeof transactionData === "function" ||
      transactionData.__typename !== "SponsoredTransactionRequest" ||
      !("raw" in transactionData)
    ) {
      return;
    }
    await handleWrongNetwork();
    
    const client = await getWalletClient();
    if (!client || !client.account) {
      throw new Error("No wallet client or account available");
    }
    
    return onCompleted(
      await sendEip712Transaction(client as any, {
        account: client.account,
        chain: null,
        ...getTransactionData(transactionData.raw, { sponsored: true })
      })
    );
  };

  const handleSelfFundedTransaction = async (
    transactionData: AnyTransactionRequestFragment,
    onCompleted: (hash: string) => void
  ) => {
    if (
      typeof transactionData === "function" ||
      transactionData.__typename !== "SelfFundedTransactionRequest" ||
      !("raw" in transactionData)
    ) {
      return;
    }
    await handleWrongNetwork();
    
    const client = await getWalletClient();
    if (!client || !client.account) {
      throw new Error("No wallet client or account available");
    }
    
    return onCompleted(
      await sendTransaction(client as any, {
        account: client.account,
        chain: null,
        ...getTransactionData(transactionData.raw)
      })
    );
  };

  const handleTransactionLifecycle = async ({
    transactionData,
    onCompleted,
    onError
  }: {
    transactionData: AnyTransactionRequestFragment;
    onCompleted: (hash: string) => void;
    onError: (error: ApolloClientError) => void;
  }) => {
    try {
      if (typeof transactionData === "function") {
        return onError({ message: ERRORS.SomethingWentWrong });
      }
      switch (transactionData.__typename) {
        case "SponsoredTransactionRequest":
          return await handleSponsoredTransaction(transactionData, onCompleted);
        case "SelfFundedTransactionRequest":
          return await handleSelfFundedTransaction(
            transactionData,
            onCompleted
          );
        case "TransactionWillFail":
          if ("reason" in transactionData) {
            return onError({ message: transactionData.reason });
          }
          return onError({ message: ERRORS.SomethingWentWrong });
        default:
          onError({ message: ERRORS.SomethingWentWrong });
          return;
      }
    } catch (error) {
      return onError(error);
    }
  };

  return handleTransactionLifecycle;
};

export default useTransactionLifecycle;
