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
  blockExplorerUrl: CHAIN.blockExplorers?.[0]?.url || "",
  ticker: CHAIN.nativeCurrency.symbol,
  tickerName: CHAIN.nativeCurrency.name,
  logo: "",
};

// Provider quản lý Private Key
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Auth Adapter với cấu hình JWT verifier - v9.x API
// Cấu hình cho SFA (Single Factor Auth) flow - không cần popup loading
const authAdapter = new AuthAdapter({
  adapterSettings: {
    uxMode: "popup",
    // Cấu hình login cho custom JWT verifier (SFA)
    loginConfig: {
      // Custom JWT verifier cho SFA flow
      custom: {
        verifier: WEB3AUTH_CONNECTION_NAME, // "slice-backend-verifier"
        typeOfLogin: "jwt",
        clientId: WEB3AUTH_CLIENT_ID,
      },
      // Giữ lại cấu hình jwt cũ cho backward compatibility
      jwt: {
        verifier: WEB3AUTH_CONNECTION_NAME,
        typeOfLogin: "jwt",
        clientId: WEB3AUTH_CLIENT_ID,
      },
    },
  },
  privateKeyProvider,
});

// Khởi tạo Web3Auth NoModal Instance - v9.x API
const web3auth = new Web3AuthNoModal({
  clientId: WEB3AUTH_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
  enableLogging: true,
});

// Cấu hình adapter
web3auth.configureAdapter(authAdapter);

export { web3auth, WEB3AUTH_CONNECTION_NAME, chainConfig };