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
import { useAccountStore } from "@/store/persisted/useAccountStore";

type AnyTransactionRequestFragment =
  | SelfFundedTransactionRequestFragment
  | SponsoredTransactionRequestFragment
  | TransactionWillFailFragment
  | { __typename?: string; hash?: unknown }
  | ((...args: never[]) => unknown);

const useTransactionLifecycle = () => {
  const { data: wagmiClient } = useWalletClient();
  const { provider: embeddedProvider, isEmbeddedWallet, web3AuthToken, setEmbeddedWallet } = useEmbeddedWalletStore();
  const { currentAccount } = useAccountStore();
  const handleWrongNetwork = useHandleWrongNetwork();

  const reconnectEmbeddedWallet = async (): Promise<any> => {
    try {
      const web3AuthToken = await walletService.getWeb3AuthToken();
      const { address, provider } = await walletService.connectWeb3Auth(web3AuthToken);
      if (!provider) {
        throw new Error("Failed to reconnect embedded wallet");
      }

      setEmbeddedWallet(address, provider, web3AuthToken);
      return provider;
    } catch (error: any) {
      console.error("Failed to reconnect embedded wallet:", error);
      throw new Error("Failed to reconnect embedded wallet:" + error.message);
    }
  };

  // Tạo wallet client từ embedded provider hoặc dùng wagmi client
  const getWalletClient = async () => {
    if (isEmbeddedWallet) {
      let provider = embeddedProvider;
      if (!provider) {
        console.log("No provider in memory, attempting to reconnect...");
        provider = await reconnectEmbeddedWallet();
      }
      
      if (provider) {
        console.log("Using embedded wallet provider for transaction");
        
        // Lấy accounts từ provider
        const accounts = await provider.request({ method: "eth_accounts" }) as string[];
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found in embedded wallet");
        }
        
        const embeddedAddress = accounts[0] as `0x${string}`;
        const lensOwner = currentAccount?.owner;
        if (lensOwner && embeddedAddress.toLowerCase() !== lensOwner.toLowerCase()) {
          throw new Error(
            `Wallet mismatch: Your embedded wallet (${embeddedAddress.slice(0, 8)}...) doesn't match the Lens account owner (${lensOwner.slice(0, 8)}...). Please login again.`
          );
        }
        
        return createWalletClient({
          account: embeddedAddress,
          chain: CHAIN,
          transport: custom(provider)
        });
      }
    }
    
    if (wagmiClient) {
      return wagmiClient;
    }
    
    console.error("No wallet client available");
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
    
    console.log("Sending EIP712 transaction...");
    const txData = getTransactionData(transactionData.raw, { sponsored: true });
    
    try {
      const hash = await sendEip712Transaction(client as any, {
        account: client.account,
        chain: CHAIN,
        ...txData
      });
      return onCompleted(hash);
    } catch (error) {
      console.error("sendEip712Transaction error:", error);
      throw error;
    }
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
        chain: CHAIN,
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
