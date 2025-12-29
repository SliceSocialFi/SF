import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
      setEmbeddedWallet: (address, provider, web3AuthToken) => {
        console.log("📝 setEmbeddedWallet called:", { address, hasProvider: !!provider, hasToken: !!web3AuthToken });
        set({ address, provider, web3AuthToken, isEmbeddedWallet: true });
      },
      clearEmbeddedWallet: () => {
        console.log("🗑️ clearEmbeddedWallet called");
        set({ address: null, provider: null, web3AuthToken: null, isEmbeddedWallet: false });
      }
    }),
    {
      name: "embedded-wallet-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Chỉ lưu những thông tin có thể serialize
        address: state.address,
        web3AuthToken: state.web3AuthToken,
        isEmbeddedWallet: state.isEmbeddedWallet
        // KHÔNG lưu provider vì không serialize được
      }),
      onRehydrateStorage: () => (state) => {
        console.log("🔄 Hydrating embedded wallet store from localStorage");
        if (state) {
          console.log("✅ Hydrated state:", {
            address: state.address,
            hasToken: !!state.web3AuthToken,
            isEmbeddedWallet: state.isEmbeddedWallet
          });
        }
      }
    }
  )
);
