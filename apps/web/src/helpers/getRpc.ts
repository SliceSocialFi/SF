import {
  LENS_MAINNET_RPCS,
  LENS_TESTNET_RPCS,
  BSC_MAINNET_RPCS,
  BSC_TESTNET_RPCS
} from "@slice/data/rpcs";
import { MAINNET_CHAINS, TESTNET_CHAINS } from "@slice/data/chains";
import type { FallbackTransport } from "viem";
import { fallback, http } from "viem";
interface GetRpcOptions {
  chainId: number;
}

const BATCH_SIZE = 10;


const getRpcsByChainId = (chainId: number): string[] => {
  switch (chainId) {
    case MAINNET_CHAINS.lensChain.chainId:
      return LENS_MAINNET_RPCS;
    case MAINNET_CHAINS.bsc.chainId:
      return BSC_MAINNET_RPCS;
    case TESTNET_CHAINS.lensChain.chainId:
      return LENS_TESTNET_RPCS;
    case TESTNET_CHAINS.bsc.chainId:
      return BSC_TESTNET_RPCS;
    default:
      return [];
  }
}

const getRpc = ({ chainId }: GetRpcOptions): FallbackTransport => {
  const rpcs = getRpcsByChainId(chainId);
  return fallback(
    rpcs.map((rpc) => http(rpc, { batch: { batchSize: BATCH_SIZE } }))
  );
};

export default getRpc;
