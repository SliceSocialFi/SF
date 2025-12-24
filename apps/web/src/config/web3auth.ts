import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { WEB3AUTH_CLIENT_ID, CHAIN, WEB3AUTH_CONNECTION_NAME } from "@slice/data/constants";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: `0x${CHAIN.id.toString(16)}`,
  rpcTarget: CHAIN.rpcUrls.default.http[0],
  displayName: CHAIN.name,
  blockExplorerUrl: CHAIN.blockExplorers?.[0]?.url,
  ticker: CHAIN.nativeCurrency.symbol,
  tickerName: CHAIN.nativeCurrency.name,
};

// Provider quản lý Private Key
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Khởi tạo Web3Auth Instance (v10.x API)
const web3auth = new Web3Auth({
  clientId: WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider as any,
  // Configure login settings directly in constructor for v10.x
  authBuildEnv: "testing",
  uiConfig: {
    loginMethodsOrder: ["jwt"],
  },
});

export { web3auth, WEB3AUTH_CONNECTION_NAME };