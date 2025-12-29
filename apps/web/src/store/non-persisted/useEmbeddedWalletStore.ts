import { create } from "zustand";
import { persist } from "zustand/middleware";

interface EmbeddedWalletState {
  provider: any | null;
  address: string | null;
  web3AuthToken: string | null;
  isEmbeddedWallet: boolean;
  setEmbeddedWallet: (address: string, provider: any, web3AuthToken?: string) => void;
  clearEmbeddedWallet: () => void;
}

export const useEmbeddedWalletStore = create<EmbeddedWalletState>()(
  persist(
    (set) => ({
      provider: null,
      address: null,
      web3AuthToken: null,
      isEmbeddedWallet: false,
      setEmbeddedWallet: (address, provider, web3AuthToken) =>
        set({ address, provider, web3AuthToken, isEmbeddedWallet: true }),
      clearEmbeddedWallet: () =>
        set({ address: null, provider: null, web3AuthToken: null, isEmbeddedWallet: false })
    }),
    {
      name: "embedded-wallet-store",
      partialize: (state) => ({
        // Chỉ lưu những thông tin có thể serialize
        address: state.address,
        web3AuthToken: state.web3AuthToken,
        isEmbeddedWallet: state.isEmbeddedWallet
        // KHÔNG lưu provider vì không serialize được
      })
    }
  )
);
