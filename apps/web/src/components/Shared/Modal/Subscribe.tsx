import { CheckCircleIcon } from "@heroicons/react/24/outline";
import {
  DEFAULT_COLLECT_TOKEN,
  PERMISSIONS,
  STATIC_IMAGES_URL,
  SUBSCRIPTION_AMOUNT,
  ERC20_TOKEN_SYMBOL
} from "@slice/data/constants";
import {
  type AccountFragment,
  useBalancesBulkQuery,
  useJoinGroupMutation
} from "@slice/indexer";
import type { ApolloClientError } from "@slice/types/errors";
import { useCallback, useState } from "react";
import SingleAccount from "@/components/Shared/Account/SingleAccount";
import TopUpButton from "@/components/Shared/Account/TopUp/Button";
import { Button, Image, Spinner, Tooltip } from "@/components/Shared/UI";
import errorToast from "@/helpers/errorToast";
import getTokenImage from "@/helpers/getTokenImage";
import useTransactionLifecycle from "@/hooks/useTransactionLifecycle";
import useWaitForTransactionToComplete from "@/hooks/useWaitForTransactionToComplete";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import proImage from '../../../../public/pro.png';

const Subscribe = () => {
  const { currentAccount } = useAccountStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleTransactionLifecycle = useTransactionLifecycle();
  const waitForTransactionToComplete = useWaitForTransactionToComplete();

  const { data: balance, loading: balanceLoading } = useBalancesBulkQuery({
    fetchPolicy: "no-cache",
    pollInterval: 3000,
    skip: !currentAccount?.address,
    variables: {
      request: {
        address: currentAccount?.address,
        tokens: [DEFAULT_COLLECT_TOKEN],
        includeNative: true
      }
    }
  });

  const onCompleted = async (hash: string) => {
    await waitForTransactionToComplete(hash);
    location.reload();
  };

  const onError = useCallback((error: ApolloClientError) => {
    setIsSubmitting(false);
    errorToast(error);
  }, []);

  const erc20Balance =
    balance?.balancesBulk[1].__typename === "Erc20Amount"
      ? Number(balance.balancesBulk[1].value).toFixed(2)
      : 0;

  const canSubscribe = Number(erc20Balance) >= SUBSCRIPTION_AMOUNT;

  const [joinGroup] = useJoinGroupMutation({
    onCompleted: async ({ joinGroup }) => {
      return await handleTransactionLifecycle({
        onCompleted,
        onError,
        transactionData: joinGroup
      });
    },
    onError
  });

  const handleSubscribe = async () => {
    setIsSubmitting(true);

    return await joinGroup({
      variables: { request: { group: PERMISSIONS.SUBSCRIPTION } }
    });
  };

  const hasSubscribed = currentAccount?.hasSubscribed;

  return (
    <div className="mx-5 my-10 flex flex-col items-center gap-y-8">
      <Image
        alt="Pro"
        className="w-32"
        src={proImage}
        width={256}
      />
      <div className="max-w-md text-center text-gray-500">
        {hasSubscribed ? (
          <div className="text-gray-500">
            Thanks for being a valuable <b>Hey Pro</b> member!
          </div>
        ) : (
          <>
            Join Hey Pro for {" "}
            <b className="inline-flex items-center gap-x-1">
              {SUBSCRIPTION_AMOUNT}{" "}
              <Tooltip content={ERC20_TOKEN_SYMBOL} placement="top">
                <img
                  alt={ERC20_TOKEN_SYMBOL}
                  className="size-5"
                  src={getTokenImage(ERC20_TOKEN_SYMBOL)}
                />
              </Tooltip>
              /year
            </b>
            .
          </>
        )}
      </div>
      <SingleAccount
        account={currentAccount as AccountFragment}
        isVerified
        linkToAccount={false}
        showUserPreview={false}
      />
      {hasSubscribed ? null : (
        <>
          <div className="flex flex-col items-center gap-y-2 text-gray-500">
            <div className="flex items-center gap-x-1">
              <CheckCircleIcon className="size-4.5" />
              <span className="text-sm">Subscription Badge</span>
            </div>
            <div className="flex items-center gap-x-1">
              <CheckCircleIcon className="size-4.5" />
              <span className="text-sm">Exclusive Hey features</span>
            </div>
            <div className="flex items-center gap-x-1">
              <CheckCircleIcon className="size-4.5" />
              <span className="text-sm">Special NFT for early members</span>
            </div>
            <div className="flex items-center gap-x-1">
              <CheckCircleIcon className="size-4.5" />
              <span className="text-sm">Contribute to Hey's growth</span>
            </div>
          </div>
          {balanceLoading ? (
            <Button
              className="w-sm"
              disabled
              icon={<Spinner className="my-1" size="xs" />}
            />
          ) : canSubscribe ? (
            <Button
              className="w-sm"
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={handleSubscribe}
            >
              Subscribe for {SUBSCRIPTION_AMOUNT} {ERC20_TOKEN_SYMBOL}/year
            </Button>
          ) : (
            <TopUpButton
              amountToTopUp={
                Math.ceil((SUBSCRIPTION_AMOUNT - Number(erc20Balance)) * 20) /
                20
              }
              className="w-sm"
              label={`Top-up ${SUBSCRIPTION_AMOUNT} ${ERC20_TOKEN_SYMBOL} to your account`}
              outline
              token={{
                contractAddress: DEFAULT_COLLECT_TOKEN,
                symbol: ERC20_TOKEN_SYMBOL
              }}
            />
          )}
          <div className="-mt-1 text-center text-gray-500 text-xs">
            One-time payment. Manual renewal required next year.
          </div>
        </>
      )}
    </div>
  );
};

export default Subscribe;
