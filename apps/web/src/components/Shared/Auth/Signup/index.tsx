import { createTrackedSelector } from "react-tracked";
import { useAccount } from "wagmi";
import { create } from "zustand";
import WalletSelector from "@/components/Shared/Auth/WalletSelector";
import ChooseUsername from "./ChooseUsername";
import Minting from "./Minting";
import Success from "./Success";

interface SignupState {
  chosenUsername: string;
  accountAddress: string;
  screen: "choose" | "minting" | "success";
  transactionHash: string;
  onboardingToken: string;
  // Embedded wallet state
  embeddedWalletAddress: string;
  embeddedWalletProvider: any;
  setChosenUsername: (username: string) => void;
  setAccountAddress: (accountAddress: string) => void;
  setScreen: (screen: "choose" | "minting" | "success") => void;
  setTransactionHash: (hash: string) => void;
  setOnboardingToken: (token: string) => void;
  setEmbeddedWallet: (address: string, provider: any) => void;
  clearEmbeddedWallet: () => void;
}

const store = create<SignupState>((set) => ({
  accountAddress: "",
  chosenUsername: "",
  onboardingToken: "",
  screen: "choose",
  embeddedWalletAddress: "",
  embeddedWalletProvider: null,
  setAccountAddress: (accountAddress) => set({ accountAddress }),
  setChosenUsername: (username) => set({ chosenUsername: username }),
  setOnboardingToken: (token) => set({ onboardingToken: token }),
  setScreen: (screen) => set({ screen }),
  setTransactionHash: (hash) => set({ transactionHash: hash }),
  setEmbeddedWallet: (address, provider) => set({ embeddedWalletAddress: address, embeddedWalletProvider: provider }),
  clearEmbeddedWallet: () => set({ embeddedWalletAddress: "", embeddedWalletProvider: null }),
  transactionHash: ""
}));

export const useSignupStore = createTrackedSelector(store);

const Signup = () => {
  const { screen, embeddedWalletAddress } = useSignupStore();
  const { connector: activeConnector } = useAccount();

  // Cho phép signup nếu có wagmi connector HOẶC embedded wallet
  const hasWallet = activeConnector?.id || embeddedWalletAddress;

  return hasWallet ? (
    <div className="space-y-2.5">
      {screen === "choose" ? (
        <ChooseUsername />
      ) : screen === "minting" ? (
        <Minting />
      ) : (
        <Success />
      )}
    </div>
  ) : (
    <WalletSelector />
  );
};

export default Signup;
