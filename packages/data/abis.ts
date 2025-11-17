import { parseAbi } from "viem";

export const BRIDGE_GATEWAY_BSC_ABI = parseAbi([
  "function lock(uint256 amount, address toOnLens) external",
]);

export const BRIDGE_MINTER_LENS_ABI = parseAbi([
  "function burnToBsc(uint256 amount, address toOnBsc) external",
]);

export const ERC20_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const LENS_ACCOUNT_ABI = parseAbi([
  "function executeTransaction(address target, uint256 value, bytes calldata data) external payable returns (bytes memory)"
]);