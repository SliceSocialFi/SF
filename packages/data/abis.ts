import { parseAbi } from "viem";

export const BRIDGE_GATEWAY_BSC_ABI = parseAbi([
  'function unlock(address toOnBsc, uint256 amount, bytes32 srcTxHash, uint256 srcChainId, uint256 srcNonce) external',
  'function processed(uint256, bytes32) view returns (bool)',
  'function pause() external',
  'function unpause() external',
  'event Locked(address indexed from, address indexed toOnLens, uint256 amount, uint256 nonce, uint256 dstChainId)',
  'event Unlocked(address indexed toOnBsc, uint256 amount, uint256 amountOut, bytes32 indexed srcTxHash, uint256 srcChainId, uint256 srcNonce)',
]);

export const BRIDGE_MINTER_LENS_ABI = parseAbi([
  "function mintTo(address to, uint256 amount, bytes32 srcTxHash, uint256 srcChainId, uint256 srcNonce) external",
  "function burnToBsc(uint256 amount, address toOnBsc) external",
  "function pause() external",
  "function unpause() external",
  "function setFee(uint256 _feeBps, address _treasury) external",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function processed(uint256 srcChainId, bytes32 srcTxHash) view returns (bool)",
  "function feeBps() view returns (uint256)",
  "function treasury() view returns (address)",
  "event Minted(address indexed to, uint256 amount, bytes32 indexed srcTxHash, uint256 srcNonce)",
  "event Burned(address from, uint256 amount, address toOnBsc, uint256 nonce)"
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

export const TRYF_LENSCHAIN_ABI = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function burnFrom(address account, uint256 amount) external",
  "function pause() external",
  "function unpause() external",
  "function setBlacklist(address account, bool isBlacklisted) external",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);


