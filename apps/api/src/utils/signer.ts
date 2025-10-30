import { chains } from "@lens-chain/sdk/viem";
import { LENS_MAINNET_RPCS } from "@slice/data/rpcs";
import { createWalletClient, type Hex, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);

const signer = createWalletClient({
  account,
  chain: chains.mainnet,
  transport: http(LENS_MAINNET_RPCS[0])
});

export default signer;
