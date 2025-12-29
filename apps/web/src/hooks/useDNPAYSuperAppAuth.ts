import { useEffect, useRef, useState } from "react";
import { useConnect, useDisconnect, useSignMessage } from "wagmi";
import { toast } from "sonner";
import { useDNPAYSuperApp } from "@/components/Common/Providers/DNPAYSuperAppProvider";
import { walletService } from "@/lib/api/auth-api";
import {
    AuthProvider,
    AuthStatus,
    type AuthLoginData
} from "./useDNPaySSO";
import {
    useAccountsAvailableQuery,
    useAuthenticateMutation,
    useChallengeMutation,
    type ChallengeRequest,
    ManagedAccountsVisibility,
    useAccountsAvailableLazyQuery
} from "@slice/indexer";
import { IS_MAINNET, SLICE_APP } from "@slice/data/constants";
import { ERRORS } from "@slice/data/errors";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useSignupStore } from "@/components/Shared/Auth/Signup";
import { signIn } from "@/store/persisted/useAuthStore";
import { useEmbeddedWalletStore } from "@/store/non-persisted/useEmbeddedWalletStore";

interface OnboardingData {
    onboardingToken: string;
    email: string;
    shouldAutoCreate?: boolean;
}

interface UseDNPAYSuperAppAuthOptions {
    onSuccess?: (data: AuthLoginData) => void;
    onError?: (error: string) => void;
    onOnboardingRequired?: (data: OnboardingData) => void;
}

export const useDNPAYSuperAppAuth = (options: UseDNPAYSuperAppAuthOptions = {}) => {
    const { isReady, token: superAppToken } = useDNPAYSuperApp();
    const { currentAccount } = useAccountStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [authData, setAuthData] = useState<AuthLoginData | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const processedRef = useRef(false);

    const { connectAsync, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const { signMessageAsync } = useSignMessage();
    const [loadChallenge] = useChallengeMutation();
    const [authenticate] = useAuthenticateMutation();
    const { setEmbeddedWallet } = useSignupStore();
    const { setEmbeddedWallet: setGlobalEmbeddedWallet } = useEmbeddedWalletStore();

    const { refetch: refetchAccounts } = useAccountsAvailableQuery({
        skip: !walletAddress,
        fetchPolicy: "network-only",
        variables: {
            accountsAvailableRequest: {
                hiddenFilter: ManagedAccountsVisibility.NoneHidden,
                managedBy: walletAddress || ""
            },
            lastLoggedInAccountRequest: { address: walletAddress || "" }
        }
    });

    // Lazy query để fetch accounts với address cụ thể
    const [fetchAccountsLazy] = useAccountsAvailableLazyQuery({
        fetchPolicy: "network-only"
    });

    const { onSuccess, onError, onOnboardingRequired } = options;

    const authenticateWithLens = async (
        accountAddress: string, 
        walletAddress: string,
        provider: any = null,
        providerType: string | null = null
    ) => {
        try {
            const meta = { account: accountAddress, app: IS_MAINNET ? SLICE_APP : undefined };
            const request: ChallengeRequest = {
                accountOwner: { owner: walletAddress, ...meta }
            };

            // Get challenge
            const challenge = await loadChallenge({ variables: { request } });
            if (!challenge?.data?.challenge?.text) {
                throw new Error("Failed to get challenge from Lens Protocol");
            }

            let signature: string;
            if (providerType === AuthProvider.DNPAY_EMBEDDED && provider) {
                const accounts = await provider.request({ 
                    method: "eth_accounts" 
                });
                
                if (!accounts || accounts.length === 0) {
                    throw new Error("No accounts found in embedded wallet");
                }

                signature = await provider.request({
                    method: "personal_sign",
                    params: [challenge.data.challenge.text, accounts[0]]
                });
            } else {                
                const injectedConnector = connectors.find(c => c.id === "injected");
                if (!injectedConnector) {
                    throw new Error("Injected connector not found. Please install MetaMask.");
                }

                const connectResult = await connectAsync({ connector: injectedConnector });
                const connectedAddress = connectResult.accounts[0];
                if (connectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                    disconnect();
                    throw new Error("Connected wallet does not match DNPAY wallet");
                }

                signature = await signMessageAsync({
                    message: challenge.data.challenge.text
                });
            }

            // Authenticate
            const authResult = await authenticate({
                variables: { request: { id: challenge.data.challenge.id, signature } }
            });

            if (authResult.data?.authenticate.__typename === "AuthenticationTokens") {
                const accessToken = authResult.data.authenticate.accessToken;
                const refreshToken = authResult.data.authenticate.refreshToken;
                signIn({ accessToken, refreshToken });
                toast.success("Successfully authenticated with Lens Protocol");
                return authResult.data.authenticate;
            } else {
                throw new Error(ERRORS.SomethingWentWrong);
            }
        } catch (err: any) {
            console.error("authenticateWithLens error:", err);
            toast.error(err.message || "Failed to authenticate with Lens");
            throw err;
        }
    };

    const handleVerifyResult = async (data: any) => {
        const status = data.status;

        if (status === AuthStatus.LOGIN_SUCCESS) {
            const walletAddr = data.user.id;
            const authProvider = data.user.authProvider;

            console.log("DNPAY SuperApp Login Success:", { walletAddress: walletAddr, authProvider });
            setWalletAddress(walletAddr);

            if (authProvider === AuthProvider.DNPAY_EMBEDDED && data.web3AuthToken) {
                try {
                    const { address, provider } = await walletService.connectWeb3Auth(data.web3AuthToken);
                    console.log("Web3Auth Connected (SuperApp):", address);

                    const actualWalletAddress = address;
                    if (walletAddr.toLowerCase() !== actualWalletAddress.toLowerCase()) {
                        console.warn("Address mismatch! Using Web3Auth address:", actualWalletAddress);
                        setWalletAddress(actualWalletAddress);
                    }
                    
                    // ✅ Lưu embedded wallet provider vào global store
                    console.log("💾 Saving embedded wallet to global store (SuperApp):", actualWalletAddress);
                    setGlobalEmbeddedWallet(actualWalletAddress, provider, data.web3AuthToken);
                    
                    setEmbeddedWallet(actualWalletAddress, provider);
                    const accountsResult = await fetchAccountsLazy({
                        variables: {
                            accountsAvailableRequest: {
                                hiddenFilter: ManagedAccountsVisibility.NoneHidden,
                                managedBy: actualWalletAddress
                            },
                            lastLoggedInAccountRequest: { address: actualWalletAddress }
                        }
                    });

                    const accounts = accountsResult.data?.accountsAvailable?.items || [];
                    if (accounts.length === 0) {
                        toast.info("Welcome! Please create your Lens profile.");
                        onOnboardingRequired?.({
                            onboardingToken: "", // No token needed - not creating wallet
                            email: data.user.email || "",
                            shouldAutoCreate: false // Don't create wallet, just create Lens profile
                        });
                        return;
                    }

                    const firstAccount = accounts[0];
                    const accountAddress = firstAccount.account.address;
                    await authenticateWithLens(accountAddress, actualWalletAddress, provider, authProvider);

                    const successData: AuthLoginData = {
                        status: AuthStatus.LOGIN_SUCCESS,
                        user: {
                            id: data.user.id,
                            email: data.user.email,
                            walletAddress: actualWalletAddress, // Use Web3Auth address
                            authProvider
                        },
                        web3AuthToken: data.web3AuthToken
                    };

                    setAuthData(successData);
                    onSuccess?.(successData);
                    
                    toast.success("Login successful!");
                    // ⚠️ KHÔNG reload page để giữ embedded wallet provider trong memory
                    console.log("✅ Login successful, provider kept in memory");
                } catch (err) {
                    console.error("Web3Auth connection error:", err);
                    toast.error("Failed to connect embedded wallet");
                    onError?.("Failed to connect embedded wallet");
                    return;
                }
            } else {
                // Linked wallet flow (MetaMask)
                try {
                    console.log("🔗 Linked wallet flow - checking Lens accounts...");
                    const accountsResult = await refetchAccounts();
                    const accounts = accountsResult.data?.accountsAvailable?.items || [];

                    if (accounts.length === 0) {
                        console.log("No Lens account found for linked wallet");
                        
                        // User đã có MetaMask wallet, chỉ cần tạo Lens profile
                        // shouldAutoCreate: false vì wallet đã tồn tại
                        toast.info("No Lens account found. Please create your profile.");
                        onOnboardingRequired?.({
                            onboardingToken: data.onboardingToken || "",
                            email: data.user.email || "",
                            shouldAutoCreate: false
                        });
                        return;
                    }

                    // Auto-select first account và authenticate
                    console.log("✅ Found Lens account, authenticating...");
                    const firstAccount = accounts[0];
                    const accountAddress = firstAccount.account.address;
                    await authenticateWithLens(accountAddress, walletAddr, null, authProvider);

                    const successData: AuthLoginData = {
                        status: AuthStatus.LOGIN_SUCCESS,
                        user: {
                            id: data.user.id,
                            email: data.user.email,
                            walletAddress: walletAddr,
                            authProvider
                        },
                        web3AuthToken: data.web3AuthToken
                    };

                    setAuthData(successData);
                    onSuccess?.(successData);
                    
                    toast.success("Login successful!");
                    console.log("✅ Login successful");
                } catch (err: any) {
                    console.error("Lens authentication error:", err);
                    toast.error("Failed to authenticate with Lens Protocol");
                    onError?.(err.message || "Lens authentication failed");
                }
            }
        } else if (status === AuthStatus.ONBOARDING_REQUIRED) {
            console.log("DNPAY SuperApp Onboarding Required:", data);
            
            // User mới hoàn toàn, cần chọn phương thức tạo/liên kết ví
            // shouldAutoCreate: true → Hiển thị modal để user chọn
            onOnboardingRequired?.({
                onboardingToken: data.onboardingToken,
                email: data.email,
                shouldAutoCreate: true // Hiển thị modal cho user chọn phương thức
            });
        } else {
            console.warn("DNPAY SuperApp Unknown Auth Status:", status);
        }
    };

    const verifySuperAppToken = async () => {
        if (!superAppToken || processedRef.current) {
            return;
        }

        processedRef.current = true;
        setIsProcessing(true);

        try {
            console.log("Verifying DNPAY SuperApp Token...");
            const data = await walletService.verifyDNPAYLogin(superAppToken);
            await handleVerifyResult(data);
        } catch (err: any) {
            console.error("SuperApp token verification error:", err);
            toast.error(err.message || "Failed to verify SuperApp token");
            onError?.(err.message || "Token verification failed");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (isReady && superAppToken && !currentAccount && !isProcessing && !processedRef.current) {
            console.log("DNPAY SuperApp detected, starting auto-authentication...");
            verifySuperAppToken();
        }
    }, [isReady, superAppToken, currentAccount, isProcessing]);

    return {
        isProcessing,
        authData,
        isSuperAppMode: isReady && !!superAppToken
    };
};
