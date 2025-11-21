import {
  CHAIN,
  IS_MAINNET,
  WALLETCONNECT_PROJECT_ID
} from "@slice/data/constants";
import { familyAccountsConnector } from "family";
import type { ReactNode } from "react";
import { createConfig, WagmiProvider } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { bscTestnet, bsc } from "wagmi/chains";
import getRpc from "@/helpers/getRpc";

const connectors = [
  familyAccountsConnector(),
  walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }),
  injected()
];

// Thêm BSC chain để hỗ trợ bridge
const BSC_CHAIN = IS_MAINNET ? bsc : bscTestnet;

const config = createConfig({
  chains: [CHAIN, BSC_CHAIN],
  connectors,
  transports: {
    [CHAIN.id]: getRpc({ chainId: CHAIN.id }),
    [BSC_CHAIN.id]: getRpc({ chainId: BSC_CHAIN.id })
  }
});

interface Web3ProviderProps {
  children: ReactNode;
}

const Web3Provider = ({ children }: Web3ProviderProps) => {
  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};

export default Web3Provider;
