import { IS_MAINNET } from "./constants";
import { MAINNET_CONTRACTS, TESTNET_CONTRACTS } from "./contracts";

const mainnetTokens = [
  {
    contractAddress: MAINNET_CONTRACTS.defaultToken,
    decimals: 18,
    name: "Wrapped GHO",
    symbol: "WGHO"
  }
];

const testnetTokens = [
  {
    contractAddress: TESTNET_CONTRACTS.defaultToken,
    decimals: 18,
    name: "Testnet Rise Your Future",
    symbol: "tRYF"
  }
];

export const tokens = IS_MAINNET ? mainnetTokens : testnetTokens;
