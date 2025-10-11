import { IS_MAINNET } from "./constants";
import { MAINNET_CONTRACTS, TESTNET_CONTRACTS } from "./contracts";

const mainnetTokens = [
  {
    contractAddress: MAINNET_CONTRACTS.defaultToken,
    decimals: 18,
    name: "Wrapped GHO",
    symbol: "WGHO"
  },
  {
    contractAddress: "0xB0588f9A9cADe7CD5f194a5fe77AcD6A58250f82",
    decimals: 18,
    name: "Bonsai",
    symbol: "BONSAI"
  }
];

const testnetTokens = [
  {
    contractAddress: TESTNET_CONTRACTS.defaultToken,
    decimals: 18,
    name: "Wrapped Grass",
    symbol: "WGRASS"
  },
  {
    contractAddress: "0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39",
    decimals: 18, // Điều chỉnh nếu token dùng decimals khác
    name: "RYF coin",
    symbol: "YOUR_TOKEN"
  }
];

export const tokens = IS_MAINNET ? mainnetTokens : testnetTokens;
