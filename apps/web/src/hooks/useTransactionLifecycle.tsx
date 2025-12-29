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
import { useDNPAYSuperApp } from "@/components/Common/Providers/DNPAYSuperAppProvider";

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
  const { token: superAppToken } = useDNPAYSuperApp();

  // Reconnect embedded wallet bằng cách lấy web3AuthToken mới từ SuperApp
  const reconnectEmbeddedWallet = async (): Promise<any> => {
    if (!superAppToken) {
      console.error("❌ No SuperApp token available for reconnect");
      throw new Error("Your session has expired. Please login again to continue.");
    }

    console.log("🔄 Reconnecting embedded wallet...");
    
    try {
      // Verify SuperApp token để lấy web3AuthToken mới
      const web3AuthToken = await walletService.getWeb3AuthToken();
      const { address, provider } = await walletService.connectWeb3Auth(web3AuthToken);
      
      if (!provider) {
        throw new Error("Failed to reconnect embedded wallet");
      }

      console.log("✅ Embedded wallet reconnected:", address);
      setEmbeddedWallet(address, provider, web3AuthToken);
      
      return provider;
    } catch (error) {
      console.error("❌ Failed to reconnect embedded wallet:", error);
      throw new Error("Your session has expired. Please login again to continue.");
    }
  };

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
      
      // Nếu không có provider (sau khi reload page), thử reconnect
      console.log("⚠️ No provider in memory, attempting to reconnect...");
      const newProvider = await reconnectEmbeddedWallet();
      
      return createWalletClient({
        chain: CHAIN,
        transport: custom(newProvider)
      });
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
