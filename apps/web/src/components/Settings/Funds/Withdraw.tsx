import { NATIVE_TOKEN_SYMBOL, ERC20_TOKEN_SYMBOL } from "@slice/data/constants";
import type { ApolloClientError } from "@slice/types/errors";
import { useWithdrawMutation } from "@slice/indexer";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type Address, type Hex } from "viem";
import { useAccount, useSwitchChain, useWaitForTransactionReceipt } from "wagmi";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { Button, Input, Modal, Card } from "@/components/Shared/UI";
import Select from "@/components/Shared/UI/Select";
import Loader from "@/components/Shared/Loader";
import errorToast from "@/helpers/errorToast";
import { getChains } from "@/helpers/getChains";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import usePreventScrollOnNumberInput from "@/hooks/usePreventScrollOnNumberInput";
import useBridge from "@/hooks/useBridge";
import { estimateBridgeFee, type EstimateFeeResponse } from "@/lib/api/bridge-api";

interface WithdrawProps {
  currency?: Address;
  value: string;
  refetch: () => void;
}

const Withdraw = ({ currency, value, refetch }: WithdrawProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [initialValue, setInitialValue] = useState<string | null>(null);
  const { address, chainId: currentChainId } = useAccount();
  const { currentAccount } = useAccountStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const chains = getChains();
  const [selectedChainId, setSelectedChainId] = useState<number>(chains.lensChain.chainId);
  const selectedChain = Object.values(chains).find(c => c.chainId === selectedChainId) || chains.lensChain;
  const symbol = currency ? ERC20_TOKEN_SYMBOL : NATIVE_TOKEN_SYMBOL;
  const { switchChainAsync } = useSwitchChain();
  const [feeEstimate, setFeeEstimate] = useState<EstimateFeeResponse | null>(null);
  const [isFetchingFee, setIsFetchingFee] = useState(false);

  const handleTransactionLifecycle = useTransactionLifecycle();
  usePreventScrollOnNumberInput(inputRef as any);

  const onCompleted = async () => {
    setInputValue(value);
    setIsSubmitting(false);
    setTxHash(null);
    setShowModal(false);
    setInitialValue(null);
    setIsBridging(false);
    refetch();
    toast.success("Withdrawal Successful");
  };

  const onError = useCallback((error: ApolloClientError) => {
    setIsSubmitting(false);
    setIsBridging(false);
    errorToast(error);
  }, []);

  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: txHash as Hex,
    query: { enabled: Boolean(txHash) }
  });

  useEffect(() => {
    if (transactionReceipt?.status === "success") {
      onCompleted();
    }
  }, [transactionReceipt]);

  const [withdraw] = useWithdrawMutation({
    onCompleted: async ({ withdraw }) => {
      if (withdraw.__typename === "InsufficientFunds") {
        return onError({ message: "Insufficient funds" });
      }

      return await handleTransactionLifecycle({
        onCompleted: (hash) => setTxHash(hash as Hex),
        onError,
        transactionData: withdraw
      });
    },
    onError
  });

  const handleWithdraw = async () => {
    setIsSubmitting(true);
    if (currentChainId !== chains.lensChain.chainId) {
      await switchChainAsync({ chainId: chains.lensChain.chainId });
    }
    return await withdraw({
      variables: { 
        request: currency 
          ? { erc20: { currency, value: inputValue } } 
          : { native: inputValue }
      }
    });
  };

  const { bridgeFunction, isLoading: isBridgeHandling } = useBridge({
    srcChainId: chains.lensChain.chainId,
    destChainId: chains.bsc.chainId,
    userAddress: currentAccount?.address as Address,
    recipientAddress: address as Address,
    tokenAddress: chains.lensChain.token.address as Address,
  });

  const handleBridgeWithdraw = async () => {
    if (!address) return;
    
    try {
      setIsBridging(true);
      setInitialValue(value);

      await bridgeFunction({
        amount: inputValue,
        onError: (error: Error) => {
          console.error("Bridge withdraw error:", error);
          setIsBridging(false);
          throw error;
        }
      });
    } catch (error: any) {
      console.error("Bridge withdraw exception:", error);
      setIsBridging(false);
      errorToast(error.message);
    }
  };

  useEffect(() => {
    if (!initialValue) return;
    if (!isBridgeHandling) {
      const initVal = Number(initialValue);
      const curVal = Number(value);
      if (initVal !== curVal) {
        onCompleted();
      }
    }
  }, [isBridgeHandling, initialValue, value]);

  useEffect(() => {
    const fetchFeeEstimate = async () => {
      if (selectedChainId === chains.bsc.chainId && Number(inputValue) >= 10) {
        try {
          setIsFetchingFee(true);
          const estimate = await estimateBridgeFee(inputValue);
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
  }, [selectedChainId, inputValue, chains.bsc.chainId]);

  const handleSelectChain = (chainId: number) => {
    setSelectedChainId(chainId);
    if (chainId === chains.bsc.chainId) {
      setInputValue("10");
    } else {
      setInputValue(value);
    }
  };

  const handleTransaction = async () => {
    if (selectedChainId === chains.bsc.chainId) {
      return handleBridgeWithdraw();
    }
    return handleWithdraw();
  };

  const chainOptions = Object.entries(chains).map(([key, chain]) => ({
    key,
    value: chain.chainId,
    label: chain.name,
    icon: chain.icon,
    selected: chain.chainId === selectedChainId
  }));

  return (
    <>
      <Button
        className="button-animated"
        disabled={isSubmitting || inputValue === "0" || isBridging}
        loading={isSubmitting || isBridging}
        onClick={() => setShowModal(true)}
        outline
        size="sm"
      >
        Withdraw
      </Button>
      <Modal onClose={() => setShowModal(false)} show={showModal} title="Withdraw">
        <Card className="m-3" forceRounded>
          {isBridging ? (
            <div className="flex flex-col items-center gap-4 p-10">
              <Loader />
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="font-semibold text-lg">Bridging in progress...</span>
                <span className="text-gray-500 text-sm dark:text-gray-400">
                  Transferring {inputValue} {symbol} from Lens Chain to {selectedChain.name}
                </span>
                <span className="text-gray-500 text-xs dark:text-gray-400">
                  This may take a few minutes. Please wait and do not close this window.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <b>Select Network</b>
                    <span className="text-gray-500 text-sm dark:text-gray-400">
                      Destination network
                    </span>
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
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <Input
                    className="no-spinner"
                    inputMode="decimal"
                    max={1000}
                    min={selectedChainId === chains.bsc.chainId ? 10 : undefined}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={selectedChainId === chains.bsc.chainId ? "10" : "0"}
                    ref={inputRef}
                    step="any"
                    type="number"
                    value={inputValue}
                  />
                  <Button onClick={() => setInputValue(value)} size="lg">
                    Max
                  </Button>
                </div>
                {selectedChainId === chains.bsc.chainId && (
                  <div className="mt-2 flex flex-col gap-1">
                    {isFetchingFee ? (
                      <span className="text-gray-500 text-xs dark:text-gray-400">
                        Calculating fee...
                      </span>
                    ) : feeEstimate && Number(inputValue) >= 10 ? (
                      <span className="font-medium text-sm">
                        You will receive: {feeEstimate.totalReceiveAmount} {symbol}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
              {Number(inputValue) < 10 && selectedChainId === chains.bsc.chainId ? (
                <Button
                  className="w-full opacity-60"
                  disabled
                  outline
                  size="lg"
                >
                  <span>Minimum 10 tokens required</span>
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={isSubmitting || !inputValue || inputValue === "0" || isBridging}
                  loading={isSubmitting || isBridging}
                  onClick={handleTransaction}
                  size="lg"
                >
                  {selectedChainId === chains.bsc.chainId ? "Bridge" : "Withdraw"} {inputValue} {symbol}
                </Button>
              )}
            </div>
          )}
        </Card>
      </Modal>
    </>
  );
};

export default Withdraw;
