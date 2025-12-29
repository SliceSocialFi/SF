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
        // Chỉ lưu address và flag, KHÔNG lưu token vì nó one-time use
        address: state.address,
        isEmbeddedWallet: state.isEmbeddedWallet
        // KHÔNG lưu web3AuthToken vì nó chỉ dùng được một lần
        // KHÔNG lưu provider vì không serialize được
      }),
      onRehydrateStorage: () => (state) => {
        console.log("🔄 Hydrating embedded wallet store from localStorage");
        if (state) {
          console.log("✅ Hydrated state:", {
            address: state.address,
            hasToken: false, // Token không được lưu
            isEmbeddedWallet: state.isEmbeddedWallet
          });
        }
      }
    }
  )
);
