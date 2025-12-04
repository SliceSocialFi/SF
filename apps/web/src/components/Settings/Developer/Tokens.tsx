import { ERRORS } from "@slice/data/errors";
import { useAuthenticateMutation, useChallengeMutation } from "@slice/indexer";
import type { ApolloClientError } from "@slice/types/errors";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSignMessage } from "wagmi";
import BackButton from "@/components/Shared/BackButton";
import { Button, Card, CardHeader, H6 } from "@/components/Shared/UI";
import errorToast from "@/helpers/errorToast";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import useHandleWrongNetwork from "@/hooks/useHandleWrongNetwork";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";

const Tokens = () => {
  const { accessToken, refreshToken } = hydrateAuthTokens();
  const [builderToken, setBuilderToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyAccessToken = useCopyToClipboard(
    accessToken as string,
    "Copied to clipboard"
  );
  const copyRefreshToken = useCopyToClipboard(
    refreshToken as string,
    "Copied to clipboard"
  );
  const copyBuilderToken = useCopyToClipboard(
    builderToken ?? "",
    "Copied to clipboard"
  );

  const { address } = useAccount();
  const handleWrongNetwork = useHandleWrongNetwork();

  const onError = useCallback((error: ApolloClientError) => {
    setIsSubmitting(false);
    errorToast(error);
  }, []);

  const { signMessageAsync } = useSignMessage({ mutation: { onError } });
  const [loadChallenge] = useChallengeMutation();
  const [authenticate] = useAuthenticateMutation();

  const handleGenerateBuilderToken = async () => {
    try {
      setIsSubmitting(true);
      await handleWrongNetwork();

      const challenge = await loadChallenge({
        variables: { request: { builder: { address } } }
      });

      if (!challenge?.data?.challenge?.text) {
        return toast.error(ERRORS.SomethingWentWrong);
      }

      // Get signature
      const signature = await signMessageAsync({
        message: challenge?.data?.challenge?.text
      });

      // Auth account
      const auth = await authenticate({
        variables: { request: { id: challenge.data.challenge.id, signature } }
      });

      if (auth.data?.authenticate.__typename === "AuthenticationTokens") {
        setBuilderToken(auth.data?.authenticate.accessToken);
      }
    } catch (error) {
      errorToast(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-2 sm:mx-0">
      <CardHeader
        icon={<BackButton path="/settings" />}
        title="Your temporary access token"
      />
      <div className="m-5 space-y-5">
        <div className="flex flex-col gap-y-3">
          <div>Your temporary access token</div>
          <button
            className="cursor-pointer break-all rounded-md bg-gray-300 p-2 px-3 text-left dark:bg-[#121212]"
            onClick={copyAccessToken}
            type="button"
          >
            <div className="text-sm">{accessToken}</div>
          </button>
        </div>
        <div className="flex flex-col gap-y-3">
          <div>Your temporary refresh token</div>
          <button
            className="cursor-pointer break-all rounded-md bg-gray-300 p-2 px-3 text-left dark:bg-[#121212]"
            onClick={copyRefreshToken}
            type="button"
          >
            <div className="text-sm">{refreshToken}</div>
          </button>
        </div>
        <div className="flex flex-col gap-y-3">
          <div>Your temporary builder token</div>
          <Button
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={handleGenerateBuilderToken}
          >
            Generate builder token
          </Button>
          {builderToken && (
            <button
              className="mt-5 cursor-pointer break-all rounded-md bg-gray-300 p-2 px-3 text-left dark:bg-gray-600"
              onClick={copyBuilderToken}
              type="button"
            >
              <div className="text-sm">{builderToken}</div>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Tokens;
