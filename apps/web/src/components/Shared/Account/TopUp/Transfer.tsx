import {
  type ChangeEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { type Address, type Hex } from "viem";
import type { ApolloClientError } from "@slice/types/errors";
import { toast } from "sonner";
import { NATIVE_TOKEN_SYMBOL } from "@slice/data/constants";
import { useBalancesBulkQuery, useDepositMutation } from "@slice/indexer";
import { Button, Card, Input, Spinner, Select } from "@/components/Shared/UI";
import Skeleton from "@/components/Shared/Skeleton";
import Loader from "@/components/Shared/Loader";
import errorToast from "@/helpers/errorToast";
import usePreventScrollOnNumberInput from "@/hooks/usePreventScrollOnNumberInput";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import {
  type FundingToken,
  useFundModalStore,
} from "@/store/non-persisted/modal/useFundModalStore";
import { getChains } from "@/helpers/getChains";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import useBridge from "@/hooks/useBridge";
import useTokenBalance from "@/hooks/useTokenBalance";
import { getTokenBalanceBulk } from "@/helpers/getBalance";
import { estimateBridgeFee, type EstimateFeeResponse } from "@/lib/api/bridge-api";

interface TransferProps {
  token?: FundingToken;
}

const Transfer = ({ token }: TransferProps) => {
  const { setShowFundModal, amountToTopUp } = useFundModalStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [amount, setAmount] = useState(amountToTopUp ?? 1);
  const [other, setOther] = useState(!!amountToTopUp);
  const [currentBalance, setCurrentBalance] = useState<string>("0");
  const { address, chainId: currentChainId } = useAccount();
  const { currentAccount } = useAccountStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const chains = getChains();
  const [selectedChainId, setSelectedChainId] = useState<number>(
    chains.lensChain.chainId
  );
  const [balanceOfSelectedChain, setBalanceOfSelectedChain] =
    useState<string>("0");
  const selectedChain =
    Object.values(chains).find((c) => c.chainId === selectedChainId) ||
    chains.lensChain;
  const symbol = token?.symbol ?? NATIVE_TOKEN_SYMBOL;
  const { switchChainAsync } = useSwitchChain();
  const [feeEstimate, setFeeEstimate] = useState<EstimateFeeResponse | null>(null);
  const [isFetchingFee, setIsFetchingFee] = useState(false);

  const handleTransactionLifecycle = useTransactionLifecycle();
  usePreventScrollOnNumberInput(inputRef as RefObject<HTMLInputElement>);

  const { data: balance, loading: balanceLoading } = useBalancesBulkQuery({
    fetchPolicy: "no-cache",
    pollInterval: 3000,
    skip: !currentAccount,
    variables: {
      request: {
        address: currentAccount?.address,
        ...(token
          ? { tokens: [token?.contractAddress] }
          : { includeNative: true }),
      },
    },
  });

  useEffect(() => {
    const fecthCurrentBalance = () => {
      if (balance && currentAccount) {
        const bal = getTokenBalanceBulk(balance as any);
        setCurrentBalance(String(bal));
      }
    };
    fecthCurrentBalance();
  }, [balance, currentAccount]);

  const { formatted: bscBalance } = useTokenBalance({
    walletAddress: address as Address,
    chainId: chains.bsc.chainId,
    tokenAddress: chains.bsc.token.address as Address,
  });

  const { formatted: lensBalance } = useTokenBalance({
    walletAddress: address as Address,
    chainId: chains.lensChain.chainId,
    tokenAddress: chains.lensChain.token.address as Address,
  });

  useEffect(() => {
    if (selectedChainId === chains.lensChain.chainId) {
      setBalanceOfSelectedChain(String(lensBalance ?? "0"));
    } else {
      setBalanceOfSelectedChain(String(bscBalance ?? "0"));
    }
  }, [selectedChainId, bscBalance, lensBalance]);

  const onCompleted = async () => {
    setAmount(2);
    setOther(false);
    setIsSubmitting(false);
    setTxHash(null);
    setShowFundModal({ showFundModal: false });
    toast.success("Transferred successfully");
  };

  const onError = useCallback((error: ApolloClientError) => {
    setIsSubmitting(false);
    errorToast(error);
  }, []);

  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: txHash as Hex,
    query: { enabled: Boolean(txHash) },
  });

  useEffect(() => {
    if (transactionReceipt?.status === "success") {
      onCompleted();
    }
  }, [transactionReceipt, onCompleted]);

  const [deposit] = useDepositMutation({
    onCompleted: async ({ deposit }) => {
      if (deposit.__typename === "InsufficientFunds") {
        return onError({ message: "Insufficient funds" });
      }

      return await handleTransactionLifecycle({
        onCompleted: (hash) => setTxHash(hash as Hex),
        onError,
        transactionData: deposit,
      });
    },
    onError,
  });

  const onOtherAmount = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setAmount(value);
  };

  const handleSetAmount = (amount: number) => {
    setAmount(Number(amount));
    setOther(false);
  };

  const buildDepositRequest = (amount: number, token?: FundingToken) => {
    if (!token) {
      return { native: amount.toString() };
    }

    return {
      erc20: {
        currency: token.contractAddress,
        value: amount.toString(),
      },
    };
  };

  const handleDeposit = async () => {
    setIsSubmitting(true);
    if (currentChainId !== chains.lensChain.chainId) {
      await switchChainAsync({ chainId: chains.lensChain.chainId });
    }
    return await deposit({
      variables: { request: buildDepositRequest(amount, token) },
    });
  };

  const { bridgeFunction, isLoading: isBridgeHandling } = useBridge({
    srcChainId: selectedChain.chainId,
    destChainId: chains.lensChain.chainId,
    userAddress: address as Address,
    recipientAddress: currentAccount?.address as Address,
    tokenAddress: selectedChain.token.address as Address,
  });

  const [initialBal, setInitialBal] = useState<number | null>(null);
  const handleBridgeTransfer = async () => {
    if (!address) return;

    try {
      setIsBridging(true);
      setInitialBal(Number(currentBalance));

      await bridgeFunction({
        amount: amount.toString(),
        onError: (error: Error) => {
          console.error("Bridge transfer error:", error);
          setIsBridging(false);
          throw error;
        },
      });
    } catch (error: any) {
      console.error("Bridge transfer exception:", error);
      setIsBridging(false);
      errorToast(error.message);
    }
  };

  useEffect(() => {
    if (!initialBal) return;
    if (!isBridgeHandling && currentBalance) {
      const curBal = Number(initialBal);
      const newBal = Number(currentBalance);
      if (curBal !== newBal) {
        onCompleted();
        setInitialBal(null);
        setIsBridging(false);
      }
    }
  }, [isBridgeHandling, initialBal, currentBalance]);

  useEffect(() => {
    const fetchFeeEstimate = async () => {
      if (selectedChainId === chains.bsc.chainId && amount >= 10) {
        try {
          setIsFetchingFee(true);
          const estimate = await estimateBridgeFee(amount);
          setFeeEstimate(estimate);
        } catch (error) {
          console.error("Failed to estimate bridge fee:", error);
          setFeeEstimate(null);
        } finally {
          setIsFetchingFee(false);
        }
      } else {
        setFeeEstimate(null);
      }
    };

    const debounceTimer = setTimeout(fetchFeeEstimate, 500);
    return () => clearTimeout(debounceTimer);
  }, [selectedChainId, amount, chains.bsc.chainId]);

  const handleSelectChain = (chainId: number) => {
    setSelectedChainId(chainId);
    if (chainId === chains.bsc.chainId) {
      setAmount(10);
      setOther(true);
    } else {
      setAmount(1);
      setOther(false);
    }
  };

  const handleTransaction = async () => {
    if (selectedChainId !== chains.lensChain.chainId) {
      return handleBridgeTransfer();
    }
    return handleDeposit();
  };

  if (isBridging) {
    return (
      <Card className="mt-5" forceRounded>
        <div className="flex flex-col items-center gap-4 p-8">
          <Loader />
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-semibold text-lg">
              Bridging in progress...
            </span>
            <span className="text-gray-500 text-sm dark:text-gray-400">
              Transferring {amount} {symbol} from {selectedChain.name} to Lens
              Chain
            </span>
            <span className="text-gray-500 text-xs dark:text-gray-400">
              This may take a few minutes. Please wait and do not close this
              window.
            </span>
          </div>
        </div>
      </Card>
    );
  }

  const chainOptions = Object.entries(chains).map(([key, chain]) => ({
    key,
    value: chain.chainId,
    label: chain.name,
    icon: chain.icon,
    selected: chain.chainId === selectedChainId,
  }));

  return (
    <Card className="mt-5" forceRounded>
      <div className="mx-5 my-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <b>Purchase</b>
            {balanceLoading ? (
              <Skeleton className="h-2.5 w-20 rounded-full" />
            ) : (
              <span className="text-gray-500 text-sm dark:text-gray-200">
                Balance: {balanceOfSelectedChain} {symbol}
              </span>
            )}
          </div>
          <div>
            <Select
              className="dark:bg-[#121212]"
              options={chainOptions}
              onChange={handleSelectChain}
              iconClassName="size-4 rounded-full"
            />
          </div>
        </div>
      </div>
      <div className="divider" />
      <div className="space-y-5 p-5">
        {selectedChainId === chains.bsc.chainId ? (
          <div>
            <Input
              className="no-spinner"
              max={1000}
              min={10}
              onChange={onOtherAmount}
              placeholder="10"
              prefix={symbol}
              ref={inputRef}
              type="number"
              value={amount}
            />
            <div className="mt-2 flex flex-col gap-1">
              {isFetchingFee ? (
                <span className="text-gray-500 text-xs dark:text-gray-400">
                  Calculating fee...
                </span>
              ) : feeEstimate && amount >= 10 ? (
                <span className="font-medium text-sm">
                  You will receive: {feeEstimate.totalReceiveAmount} {symbol}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="flex space-x-4 text-sm">
              <Button
                className="w-full dark:bg-[#121212]"
                onClick={() => handleSetAmount(1)}
                outline={amount !== 1}
              >
                1
              </Button>
              <Button
                className="w-full dark:bg-[#121212]"
                onClick={() => handleSetAmount(2)}
                outline={amount !== 2}
              >
                2
              </Button>
              <Button
                className="w-full dark:bg-[#121212]"
                onClick={() => handleSetAmount(5)}
                outline={amount !== 5}
              >
                5
              </Button>
              <Button
                className="w-full dark:bg-[#121212]"
                onClick={() => {
                  handleSetAmount(other ? 1 : 10);
                  setOther(!other);
                }}
                outline={!other}
              >
                Other
              </Button>
            </div>
            {other ? (
              <div>
                <Input
                  className="no-spinner"
                  max={1000}
                  onChange={onOtherAmount}
                  placeholder="300"
                  prefix={symbol}
                  ref={inputRef}
                  type="number"
                  value={amount}
                />
              </div>
            ) : null}
          </>
        )}
        {balanceLoading ? (
          <Button
            className="flex w-full justify-center"
            disabled
            icon={<Spinner className="my-1" size="xs" />}
          />
        ) : Number(balanceOfSelectedChain) < amount || (selectedChainId === chains.bsc.chainId && amount < 10) ? (
          <Button className="w-full opacity-60" disabled outline>
            <span>
              {selectedChainId === chains.bsc.chainId && amount < 10
                ? "Minimum 10 tokens required"
                : "Insufficient Balance"}
            </span>
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isSubmitting || amount === 0 || isBridging}
            loading={isSubmitting}
            onClick={handleTransaction}
          >
            {selectedChainId === chains.lensChain.chainId
              ? "Purchase"
              : "Bridge"}{" "}
            {amount} {symbol}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default Transfer;
