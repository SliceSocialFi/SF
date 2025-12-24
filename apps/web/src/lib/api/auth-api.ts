import axios from "axios";
import { createWalletClient, custom } from "viem";
import { web3auth, WEB3AUTH_CONNECTION_NAME } from "@/config/web3auth";
import { PAYMENT_API_URL as API_BASE_URL, CHAIN } from "@slice/data/constants";

const verifyDNPAYLogin = async (dnpayAccessToken: string) => {
    const res = await axios.post(
        `${API_BASE_URL}api/auth/dnpay/verify`,
        { dnpayAccessToken }
    );
    
    const data = await res.data;
    if (!data.success) throw new Error(data.message);

    return data.data;
}

const linkWalletToDNPAY = async (onboardingToken: string, existingWalletAddress: string) => {
    const res = await axios.post(
        `${API_BASE_URL}api/auth/dnpay/link-embedded`,
        {
            onboardingToken,
            existingWalletAddress
        },
    );
    
    const data = await res.data;
    if (!data.success) throw new Error(data.message);

    return data.data;
}

const mintWeb3AuthToken = async (onboardingToken: string) => {
    const res = await axios.post(
        `${API_BASE_URL}api/auth/dnpay/mint-web3-auth-token`,
        { onboardingToken }
    );
    
    const data = await res.data;
    if (!data.success) throw new Error(data.message || "Mint token failed");
    
    return data.data.token;
}

const connectWeb3Auth = async (web3AuthToken: string) => {
    const web3authInstance = web3auth as any;

    console.log("Web3Auth Instance Status:", web3authInstance.status);
    if (web3authInstance.status === "not_ready") {
        // Web3Auth NoModal v10.x uses init()
        await web3authInstance.init();
    }
    
    console.log("Web3Auth Instance After Init:", web3authInstance.status);
    if (web3authInstance.connected) {
        await web3authInstance.logout();
    }

    // Web3Auth NoModal v10.x API - connect with JWT token using authConnectionId
    const provider = await web3authInstance.connectTo("auth", {
        authConnection: "custom",
        authConnectionId: WEB3AUTH_CONNECTION_NAME,
        idToken: web3AuthToken,
        extraLoginOptions: {
            verifierIdField: "sub",
        },
    });

    if (!provider) {
        console.log("Web3Auth provider not found");
        throw new Error("Web3Auth provider not found");
    }

    // Dùng Viem để lấy địa chỉ ví
    const walletClient = createWalletClient({
        chain: CHAIN,
        transport: custom(provider),
    });

    const [address] = await walletClient.getAddresses();
    console.log("Web3Auth Connected Address:", address);

    return { address, provider };
}

const registerEmbeddedWallet = async (onboardingToken: string, newWalletAddress: string) => {
    const res = await axios.post(
        `${API_BASE_URL}api/auth/dnpay/register-embedded`,
        {
            onboardingToken,
            newWalletAddress
        },
    );

    const data = await res.data;
    if (!data.success) throw new Error(data.message);
    
    return data.data;
}

export const walletService = {
    verifyDNPAYLogin,
    linkWalletToDNPAY,
    mintWeb3AuthToken,
    connectWeb3Auth,
    registerEmbeddedWallet
};