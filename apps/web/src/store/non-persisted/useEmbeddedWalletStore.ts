import { create } from "zustand";

interface EmbeddedWalletState {
  provider: any | null;
  address: string | null;
  isEmbeddedWallet: boolean;
  setEmbeddedWallet: (address: string, provider: any) => void;
  clearEmbeddedWallet: () => void;
}

export const useEmbeddedWalletStore = create<EmbeddedWalletState>((set) => ({
  provider: null,
  address: null,
  isEmbeddedWallet: false,
  setEmbeddedWallet: (address, provider) =>
    set({ address, provider, isEmbeddedWallet: true }),
  clearEmbeddedWallet: () =>
    set({ address: null, provider: null, isEmbeddedWallet: false })
}));
