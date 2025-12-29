import axios from "axios";
import { createWalletClient, custom } from "viem";
import { web3authSfa, WEB3AUTH_CONNECTION_NAME } from "@/config/web3auth-sfa";
import { PAYMENT_API_URL as API_BASE_URL, CHAIN } from "@slice/data/constants";
import { hydrateAuthTokens } from "@/store/persisted/useAuthStore";

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
        `${API_BASE_URL}api/auth/dnpay/link-wallet`,
        {
            onboardingToken,
            walletAddress: existingWalletAddress
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

const getWeb3AuthToken = async (): Promise<string> => {
    const accessToken = hydrateAuthTokens().accessToken;
    if (!accessToken) {
        throw new Error("No access token available for Web3Auth");
    }

    const res = await axios.get(
        `${API_BASE_URL}api/auth/dnpay/get-web3-auth-token`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );
    const data = await res.data;
    if (!data.success) {
        throw new Error(data.message || "Failed to get Web3Auth token");
    }

    return data.data.token;
};

const connectWeb3Auth = async (web3AuthToken: string) => {
    const sfaInstance = web3authSfa as any;

    console.log("Web3Auth SFA Instance Status:", sfaInstance.status);
    
    // Khởi tạo SFA nếu chưa sẵn sàng
    if (sfaInstance.status === "not_ready") {
        await sfaInstance.init();
        console.log("Web3Auth SFA Initialized");
    }
    
    console.log("Web3Auth SFA Status After Init:", sfaInstance.status);
    
    // Disconnect nếu đã connected
    if (sfaInstance.status === "connected") {
        await sfaInstance.logout();
    }

    // Web3Auth SFA - Silent/Background key construction
    // Không hiển thị popup "Constructing your key"
    // Chỉ cần JWT token và verifier info
    const provider = await sfaInstance.connect({
        verifier: WEB3AUTH_CONNECTION_NAME, // "slice-backend-verifier"
        verifierId: extractSubFromJwt(web3AuthToken), // sub claim từ JWT
        idToken: web3AuthToken,
    });

    if (!provider) {
        console.log("Web3Auth SFA provider not found");
        throw new Error("Web3Auth SFA provider not found");
    }

    console.log("Web3Auth SFA Connected Successfully");

    // Dùng Viem để lấy địa chỉ ví
    const walletClient = createWalletClient({
        chain: CHAIN,
        transport: custom(provider),
    });

    const [address] = await walletClient.getAddresses();
    console.log("Web3Auth SFA Connected Address:", address);

    return { address, provider };
}

/**
 * Extract 'sub' claim from JWT token
 * JWT format: header.payload.signature (base64 encoded)
 */
const extractSubFromJwt = (token: string): string => {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.sub || decoded.email || decoded.user_id;
    } catch (error) {
        console.error("Failed to extract sub from JWT:", error);
        throw new Error("Invalid JWT token format");
    }
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
    getWeb3AuthToken,
    connectWeb3Auth,
    registerEmbeddedWallet
};