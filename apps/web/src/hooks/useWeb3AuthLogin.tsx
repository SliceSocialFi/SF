import { useState } from 'react';
import { toast } from 'sonner';
import { createWalletClient, custom } from 'viem';
import { useChallengeMutation, useAuthenticateMutation } from '@slice/indexer';
import { CHAIN, IS_MAINNET, SLICE_APP } from '@slice/data/constants';
import { ERRORS } from '@slice/data/errors';

interface LoginResult {
    accessToken: string;
    refreshToken: string;
    profileId?: string;
}

export const useWeb3AuthLogin = () => {
    const [loadChallenge] = useChallengeMutation();
    const [authenticate] = useAuthenticateMutation();
    const [isLoading, setIsLoading] = useState(false);

    const login = async (provider: any, address: string): Promise<LoginResult | null> => {
        setIsLoading(true);
        try {
            const meta = { account: address, app: IS_MAINNET ? SLICE_APP : undefined };
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

            const walletClient = createWalletClient({
                chain: CHAIN,
                transport: custom(provider),
            });

            const signature = await walletClient.signMessage({
                account: address as `0x${string}`,
                message: challenge.text,
            });

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
                };
            } else {
                toast.error(ERRORS.SomethingWentWrong);
                throw new Error("Phản hồi xác thực không hợp lệ");
            }
        } catch (error: any) {
            console.error("Lens Login Error:", error);
            toast.error(error.message || "Đăng nhập thất bại");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { 
        login, 
        isLoading 
    };
};