/**
 * Wagmi configuration for web3 connection
 */

import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { CHAIN, IS_MAINNET } from "@slice/data/constants";

// Fallback chain configs
const MAINNET_CHAIN_CONFIG = {
  id: 232,
  name: "Lens",
  nativeCurrency: { name: "GHO", symbol: "GHO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.lens.xyz"] },
    public: { http: ["https://rpc.lens.xyz"] }
  },
  blockExplorers: {
    default: { name: "Lenscan", url: "https://lenscan.io" }
  },
  testnet: false
} as const;

const TESTNET_CHAIN_CONFIG = {
  id: 37111,
  name: "Lens Testnet",
  nativeCurrency: { name: "GRASS", symbol: "GRASS", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.lens.dev"] },
    public: { http: ["https://rpc.testnet.lens.dev"] }
  },
  blockExplorers: {
    default: { name: "Lenscan Testnet", url: "https://testnet.lenscan.io" }
  },
  testnet: true
} as const;

// Use CHAIN from constants if available, otherwise use fallback
const getChainConfig = () => {
  // Check if CHAIN has required properties
  if (CHAIN?.id && CHAIN?.name && CHAIN?.nativeCurrency && CHAIN?.rpcUrls) {
    return {
      id: CHAIN.id,
      name: CHAIN.name,
      nativeCurrency: CHAIN.nativeCurrency,
      rpcUrls: {
        default: { http: CHAIN.rpcUrls.default.http },
        public: { http: CHAIN.rpcUrls.default.http }
      },
      blockExplorers: CHAIN.blockExplorers
        ? {
            default: {
              name: CHAIN.blockExplorers.default.name,
              url: CHAIN.blockExplorers.default.url
            }
          }
        : undefined,
      testnet: !IS_MAINNET
    } as const;
  }
  
  // Fallback to hardcoded config
  return IS_MAINNET ? MAINNET_CHAIN_CONFIG : TESTNET_CHAIN_CONFIG;
};

const lensChain = getChainConfig();

export const wagmiConfig = createConfig({
  chains: [lensChain],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [lensChain.id]: http(lensChain.rpcUrls.default.http[0])
  }
});
