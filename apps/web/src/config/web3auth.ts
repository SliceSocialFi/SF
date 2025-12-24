import { Web3AuthNoModal } from "@web3auth/no-modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { AuthAdapter } from "@web3auth/auth-adapter";
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

// Auth Adapter với JWT config cho custom verifier
const authAdapter = new AuthAdapter({
  adapterSettings: {
    uxMode: "popup",
    loginConfig: {
      jwt: {
        verifier: WEB3AUTH_CONNECTION_NAME,
        typeOfLogin: "jwt",
        clientId: WEB3AUTH_CLIENT_ID,
      },
    },
  },
  privateKeyProvider: privateKeyProvider as any,
});

// Khởi tạo Web3Auth NoModal Instance (v10.x API) - dùng cho JWT login
const web3auth = new Web3AuthNoModal({
  clientId: WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider: privateKeyProvider as any,
  connectors: [authAdapter as any],
});

export { web3auth, WEB3AUTH_CONNECTION_NAME, chainConfig };