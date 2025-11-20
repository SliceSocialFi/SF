/**
 * Wagmi configuration for web3 connection
 */

import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { CHAIN } from "@slice/data/constants";

// Define Lens testnet chain
const lensTestnet = {
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
  testnet: true
} as const;

export const wagmiConfig = createConfig({
  chains: [lensTestnet],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [lensTestnet.id]: http(CHAIN.rpcUrls.default.http[0])
  }
});
