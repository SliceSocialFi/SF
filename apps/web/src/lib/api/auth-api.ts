import axios from "axios";
import { web3auth } from "@/config/web3auth";
import { createWalletClient, custom } from "viem";
import { lens } from "viem/chains";
import { PAYMENT_API_URL as API_BASE_URL } from "@slice/data/constants";

const mintWeb3AuthToken = async (onboardingToken: string) => {
    const res = await axios.post(
        `${API_BASE_URL}/dnpay/mint-web3-auth-token`,
        { onboardingToken }
    );
    
    const data = await res.data;
    if (!data.success) throw new Error(data.message || "Mint token failed");
    
    return data.data.token;
}

const connectWeb3Auth = async (web3AuthToken: string) => {
    const web3authInstance = web3auth as any;

    if (web3authInstance.status === "not_ready") {
        await web3authInstance.initModal();
    }
    
    if (web3authInstance.connected) {
        await web3authInstance.logout();
    }

    const provider = await web3authInstance.connectTo("openlogin", {
        loginProvider: "jwt",
        extraLoginOptions: {
            id_token: web3AuthToken,
            verifierIdField: "sub",
            domain: "https://slice.socialfi",
        },
    });

    if (!provider) throw new Error("Web3Auth provider not found");

    // Dùng Viem để lấy địa chỉ ví
    const walletClient = createWalletClient({
        chain: lens,
        transport: custom(provider),
    });

    const [address] = await walletClient.getAddresses();
    return { address, provider };
}

const registerEmbeddedWallet = async (onboardingToken: string, newWalletAddress: string) => {
    const res = await axios.post(
        `${API_BASE_URL}/dnpay/register-embedded`,
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
    mintWeb3AuthToken,
    connectWeb3Auth,
    registerEmbeddedWallet
};