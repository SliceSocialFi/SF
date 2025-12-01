import { useApolloClient } from "@apollo/client";
import {
  SLICE_TREASURY,
  DEFAULT_COLLECT_TOKEN,
  ERC20_TOKEN_SYMBOL
} from "@slice/data/constants";
import {
  type AccountFragment,
  type PostFragment,
  type TippingAmountInput,
  useBalancesBulkQuery,
  useExecuteAccountActionMutation,
  useExecutePostActionMutation
} from "@slice/indexer";
import type { ApolloClientError } from "@slice/types/errors";
import type { ChangeEvent, RefObject } from "react";
import { memo, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import TopUpButton from "@/components/Shared/Account/TopUp/Button";
import LoginButton from "@/components/Shared/LoginButton";
import Skeleton from "@/components/Shared/Skeleton";
import { Button, Input, Spinner } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import usePreventScrollOnNumberInput from "@/hooks/usePreventScrollOnNumberInput";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const submitButtonClassName = "w-full py-1.5 text-sm font-semibold";

interface TipMenuProps {
  closePopover: () => void;
  post?: PostFragment;
  account?: AccountFragment;
}

const TipMenu = ({ closePopover, post, account }: TipMenuProps) => {
  const { currentAccount } = useAccountStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(1);
  const [other, setOther] = useState(false);
  const handleTransactionLifecycle = useTransactionLifecycle();
  const { cache } = useApolloClient();
  const inputRef = useRef<HTMLInputElement>(null);
  usePreventScrollOnNumberInput(inputRef as RefObject<HTMLInputElement>);

  const { data: balance, loading: balanceLoading } = useBalancesBulkQuery({
    fetchPolicy: "no-cache",
    pollInterval: 3000,
    skip: !currentAccount?.address,
    variables: {
      request: {
        address: currentAccount?.address,
        tokens: [DEFAULT_COLLECT_TOKEN],
        includeNative: true
      },
    }
  });

  const updateCache = () => {
    if (post) {
      if (!post.operations) {
        return;
      }

      cache.modify({
        fields: { hasTipped: () => true },
        id: cache.identify(post.operations)
      });
      cache.modify({
        fields: {
          stats: (existingData) => ({
            ...existingData,
            tips: existingData.tips + 1
          })
        },
        id: cache.identify(post)
      });
    }
  };

  const onCompleted = () => {
    setIsSubmitting(false);
    closePopover();
    updateCache();
    toast.success(`Tipped ${amount} ${ERC20_TOKEN_SYMBOL} successfully!`);
  };

  const onError = useCallback((error: ApolloClientError) => {
    setIsSubmitting(false);
    errorToast(error);
  }, []);

  const cryptoRate = Number(amount);
  const nativeBalance =
    balance?.balancesBulk[0].__typename === "NativeAmount"
      ? Number(balance.balancesBulk[0].value).toFixed(2)
      : 0;

  const erc20Balance =
    balance?.balancesBulk[1].__typename === "Erc20Amount"
      ? Number(balance.balancesBulk[1].value).toFixed(2)
      : 0;

  // const canTip = Number(nativeBalance) >= cryptoRate;
  const canTip = Number(erc20Balance) >= cryptoRate;

  const [executePostAction] = useExecutePostActionMutation({
    onCompleted: async ({ executePostAction }) => {
      if (executePostAction.__typename === "ExecutePostActionResponse") {
        return onCompleted();
      }

      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: executePostAction
      });
    },
    onError
  });

  const [executeAccountAction] = useExecuteAccountActionMutation({
    onCompleted: async ({ executeAccountAction }) => {
      if (executeAccountAction.__typename === "ExecuteAccountActionResponse") {
        return onCompleted();
      }

      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: executeAccountAction
      });
    },
    onError
  });

  const handleSetAmount = (amount: number) => {
    setAmount(amount);
    setOther(false);
  };

  const onOtherAmount = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setAmount(value);
  };

  const handleTip = async () => {
    setIsSubmitting(true);

    const tipping: TippingAmountInput = {
      // native: cryptoRate.toString(),
      // 11 is a calculated value based on the referral pool of 20% and the Lens fee of 2.1% after the 1.5% lens fees cut
      erc20: {
        currency: DEFAULT_COLLECT_TOKEN,
        value: cryptoRate.toString()
      },
      referrals: [{ address: SLICE_TREASURY, percent: 11 }]
    };

    if (post) {
      const variables = {
        request: { action: { tipping }, post: post.id }
      };
      return executePostAction({
        variables
      });
    }

    if (account) {
      return executeAccountAction({
        variables: {
          request: { account: account.address, action: { tipping } }
        }
      });
    }
  };

  const amountDisabled = isSubmitting || !currentAccount;

  if (!currentAccount) {
    return <LoginButton className="m-5" title="Login to Tip" />;
  }

  return (
    <div className="m-5 space-y-3">
      <div className="space-y-2">
        <div className="flex items-center space-x-1 text-gray-500 text-xs dark:text-gray-200">
          <span>Balance :</span>
          <span>
            {erc20Balance ? (
              `${erc20Balance} ${ERC20_TOKEN_SYMBOL}`
            ) : (
              <Skeleton className="h-2.5 w-14 rounded-full" />
            )}
          </span>
        </div>
      </div>
      <div className="space-x-4">
        <Button
          className="button-animated"
          disabled={amountDisabled}
          onClick={() => handleSetAmount(1)}
          outline={amount !== 1}
          size="sm"
        >
          1
        </Button>
        <Button
          className="button-animated"
          disabled={amountDisabled}
          onClick={() => handleSetAmount(2)}
          outline={amount !== 2}
          size="sm"
        >
          2
        </Button>
        <Button
          className="button-animated"
          disabled={amountDisabled}
          onClick={() => handleSetAmount(5)}
          outline={amount !== 5}
          size="sm"
        >
          5
        </Button>
        <Button
          className="button-animated"
          disabled={amountDisabled}
          onClick={() => {
            handleSetAmount(other ? 1 : 10);
            setOther(!other);
          }}
          outline={!other}
          size="sm"
        >
          Other
        </Button>
      </div>
      {other ? (
        <div>
          <Input
            className="no-spinner"
            max={1000}
            min={0}
            onChange={onOtherAmount}
            placeholder="300"
            ref={inputRef}
            type="number"
            value={amount}
          />
        </div>
      ) : null}
      {isSubmitting || balanceLoading ? (
        <Button
          className={cn("flex justify-center", submitButtonClassName)}
          disabled
          icon={<Spinner className="my-0.5" size="xs" />}
        />
      ) : canTip ? (
        <Button
          className={submitButtonClassName}
          disabled={!amount || isSubmitting || !canTip}
          onClick={handleTip}
        >
          <b>Tip {amount} {ERC20_TOKEN_SYMBOL}</b>
        </Button>
      ) : (
        <TopUpButton
          amountToTopUp={Math.ceil((amount - Number(nativeBalance)) * 20) / 20}
          className="w-full"
        />
      )}
    </div>
  );
};

export default memo(TipMenu);
