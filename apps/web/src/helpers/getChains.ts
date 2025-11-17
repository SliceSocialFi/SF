import { IS_MAINNET } from "@slice/data/constants";
import { MAINNET_CHAINS, TESTNET_CHAINS } from "@slice/data/chains";

export const getChains = () => {
  return IS_MAINNET ? MAINNET_CHAINS : TESTNET_CHAINS;
}