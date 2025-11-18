import { Localstorage } from "@slice/data/storage";
import clearLocalStorage from "@/helpers/clearLocalStorage";
import { createPersistedTrackedStore } from "@/store/createTrackedStore";
import parseJwt from "@slice/helpers/parseJwt";

interface Tokens {
  accessToken: null | string;
  refreshToken: null | string;
}

interface State {
  accessToken: Tokens["accessToken"];
  hydrateAuthTokens: () => Tokens;
  refreshToken: Tokens["refreshToken"];
  profileId: string | null;
  signIn: (tokens: { accessToken: string; refreshToken: string }) => void;
  signOut: () => void;
}

const { store } = createPersistedTrackedStore<State>(
  (set, get) => ({
    accessToken: null,
    profileId: null,
    hydrateAuthTokens: () => {
      const { accessToken, refreshToken, profileId } = get();
      return { accessToken, refreshToken, profileId };
    },
    refreshToken: null,
    signIn: ({ accessToken, refreshToken }) => {
      let profileId: string | null = null;
      try {
        const tokenData = parseJwt(accessToken);
        profileId = tokenData.act?.sub || tokenData.sub || null;
      } catch {
        profileId = null;
      }

      set({ accessToken, refreshToken, profileId });
    },
    signOut: async () => {
      // Reset state immediately
      set({ accessToken: null, refreshToken: null, profileId: null });
      
      // Clear localStorage
      clearLocalStorage();
    }
  }),
  { name: Localstorage.AuthStore }
);

export const signIn = (tokens: { accessToken: string; refreshToken: string }) =>
  store.getState().signIn(tokens);
export const signOut = () => store.getState().signOut();
export const hydrateAuthTokens = () => store.getState().hydrateAuthTokens();
