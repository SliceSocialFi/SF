import { Web3Auth } from "@web3auth/single-factor-auth";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { WEB3AUTH_CLIENT_ID, CHAIN, WEB3AUTH_CONNECTION_NAME } from "@slice/data/constants";

/**
 * Web3Auth Single Factor Authentication (SFA) Configuration
 * 
 * SFA cho phép key reconstruction chạy hoàn toàn ngầm (silent/background)
 * mà không hiển thị popup "Constructing your key" như MPC.
 * 
 * Lưu ý: SFA sử dụng single factor (chỉ JWT) thay vì multi-party computation,
 * do đó bảo mật thấp hơn một chút nhưng UX tốt hơn.
 */

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: `0x${CHAIN.id.toString(16)}`,
  rpcTarget: CHAIN.rpcUrls.default.http[0],
  displayName: CHAIN.name,
  blockExplorerUrl: CHAIN.blockExplorers?.[0]?.url || "",
  ticker: CHAIN.nativeCurrency.symbol,
  tickerName: CHAIN.nativeCurrency.name,
  logo: "",
};

// Provider quản lý Private Key cho EVM chains
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Khởi tạo Web3Auth SFA Instance
// SFA chạy hoàn toàn ngầm, không có popup UI
const web3authSfa = new Web3Auth({
  clientId: WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

export { web3authSfa, chainConfig, WEB3AUTH_CONNECTION_NAME };
