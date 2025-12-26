import { useState } from 'react';
import { toast } from 'sonner';
import { createWalletClient, custom } from 'viem';
import { useChallengeMutation, useAuthenticateMutation, useAccountsAvailableLazyQuery, ManagedAccountsVisibility } from '@slice/indexer';
import { CHAIN, IS_MAINNET, SLICE_APP } from '@slice/data/constants';
import { ERRORS } from '@slice/data/errors';

interface LoginResult {
    accessToken: string;
    refreshToken: string;
    profileId?: string;
    isNewUser?: boolean;
}

export const useWeb3AuthLogin = () => {
    const [loadChallenge] = useChallengeMutation();
    const [authenticate] = useAuthenticateMutation();
    const [fetchAccountsAvailable] = useAccountsAvailableLazyQuery();
    const [isLoading, setIsLoading] = useState(false);

    const login = async (provider: any, address: string): Promise<LoginResult | null> => {
        setIsLoading(true);
        try {
            // Bước 1: Kiểm tra xem wallet có Lens Account không
            console.log("Checking Lens accounts for wallet:", address);
            const accountsResult = await fetchAccountsAvailable({
                variables: {
                    accountsAvailableRequest: {
                        hiddenFilter: ManagedAccountsVisibility.NoneHidden,
                        managedBy: address
                    },
                    lastLoggedInAccountRequest: { address }
                },
                fetchPolicy: "network-only"
            });

            const accounts = accountsResult.data?.accountsAvailable?.items || [];
            console.log("Found Lens accounts:", accounts.length);

            // Nếu chưa có account → user mới, cần tạo profile
            if (accounts.length === 0) {
                console.log("No Lens account found - new user needs to create profile");
                toast.info("You need to create a Lens profile to continue");
                return {
                    accessToken: "",
                    refreshToken: "",
                    isNewUser: true
                };
            }

            // Lấy account đầu tiên hoặc lastLoggedIn
            const lastLoggedIn = accountsResult.data?.lastLoggedInAccount;
            const accountToUse = lastLoggedIn || accounts[0];
            
            // Lấy account address từ account object
            let accountAddress: string;
            if (accountToUse.__typename === "AccountOwned") {
                accountAddress = accountToUse.account.address;
            } else if (accountToUse.__typename === "AccountManaged") {
                accountAddress = accountToUse.account.address;
            } else {
                // Fallback cho lastLoggedInAccount
                accountAddress = (accountToUse as any).address;
            }

            console.log("Using Lens account:", accountAddress);
            console.log("Wallet (owner):", address);

            // Bước 2: Tạo challenge với account address và owner address
            const meta = { account: accountAddress, app: IS_MAINNET ? SLICE_APP : undefined };
            const request = {
                accountOwner: { owner: address, ...meta }
            };

            const challengeRes = await loadChallenge({ 
                variables: { request } 
            });

            const challenge = challengeRes.data?.challenge;
            
            if (!challenge?.text || !challenge?.id) {
                throw new Error("Không thể lấy Challenge từ Lens API");
            }

            // Bước 3: Ký message
            const walletClient = createWalletClient({
                chain: CHAIN,
                transport: custom(provider),
            });

            const signature = await walletClient.signMessage({
                account: address as `0x${string}`,
                message: challenge.text,
            });

            // Bước 4: Authenticate
            const authRes = await authenticate({
                variables: { 
                    request: { id: challenge.id, signature } 
                }
            });

            const authData = authRes.data?.authenticate;
            if (authData?.__typename === "AuthenticationTokens") {
                toast.success("Đăng nhập Lens thành công!");
                return {
                    accessToken: authData.accessToken,
                    refreshToken: authData.refreshToken,
                    isNewUser: false
                };
            } else {
                toast.error(ERRORS.SomethingWentWrong);
                throw new Error("Phản hồi xác thực không hợp lệ");
            }
        } catch (error: any) {
            console.error("Lens Login Error:", error);
            toast.error(error.message || "Đăng nhập thất bại");
            return null;
        }
    };

    return { 
        login, 
        isLoading 
    };
};