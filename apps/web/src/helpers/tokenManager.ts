import parseJwt from "@slice/helpers/parseJwt";
import { RefreshDocument, type RefreshMutation } from "@slice/indexer";
import apolloClient from "@slice/indexer/apollo/client";
import type { JwtPayload } from "@slice/types/jwt";
import { signIn, signOut } from "@/store/persisted/useAuthStore";

let refreshPromise: Promise<string> | null = null;
let isSigningOut = false; // Guard để tránh gọi signOut() nhiều lần
const MAX_RETRIES = 5;

const executeTokenRefresh = async (refreshToken: string): Promise<string> => {
  try {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const { data } = await apolloClient.mutate<RefreshMutation>({
        mutation: RefreshDocument,
        variables: { request: { refreshToken } }
      });

      const refreshResult = data?.refresh;

      if (!refreshResult) {
        throw new Error("No response from refresh");
      }

      if (refreshResult.__typename === "AuthenticationTokens") {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          refreshResult;

        if (!newAccessToken || !newRefreshToken) {
          throw new Error("Missing tokens in refresh response");
        }

        signIn({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        });

        return newAccessToken;
      }

      if (refreshResult.__typename === "ForbiddenError") {
        // Chỉ gọi signOut() một lần duy nhất
        if (!isSigningOut) {
          isSigningOut = true;
          signOut();
        }
        throw new Error("Refresh token is invalid or expired");
      }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 2 ** attempt * 1000)
        );
      }
    }

    throw new Error("Unknown error during token refresh");
  } finally {
    refreshPromise = null;
  }
};

export const refreshTokens = (refreshToken: string): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = executeTokenRefresh(refreshToken);
  }

  return refreshPromise;
};

// Reset guard khi user login lại
export const resetSignOutGuard = () => {
  isSigningOut = false;
};

export const isTokenExpiringSoon = (accessToken: string | null): boolean => {
  if (!accessToken) {
    return false;
  }

  const tokenData: JwtPayload = parseJwt(accessToken);
  const bufferInMinutes = 5;
  return (
    !!tokenData.exp &&
    Date.now() >= tokenData.exp * 1000 - bufferInMinutes * 60 * 1000
  );
};
