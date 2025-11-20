import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useWatchAsset, useSwitchChain, useReadContract } from "wagmi";
import { Button, Card, Image, Modal } from "@/components/Shared/UI";
import Loader from "@/components/Shared/Loader";
import { getChains } from "@/helpers/getChains";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";

interface ImportTokenModalProps {
  show: boolean;
  onClose: () => void;
}

type ChainKey = "bsc" | "lensChain";

const ImportTokenModal = ({ show, onClose }: ImportTokenModalProps) => {
    const { address, chainId: currentChainId } = useAccount();
    const chains = getChains();
    const [isChecking, setIsChecking] = useState(true);
    const [missingChains, setMissingChains] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importingChain, setImportingChain] = useState<ChainKey | null>(null);
    
    const { watchAssetAsync } = useWatchAsset();
    const { switchChainAsync } = useSwitchChain();

    useEffect(() => {
        if (!show || !address) return;

        const checkTokens = async () => {
            setIsChecking(true);
            const missing: string[] = [];
            
            try {
                const hasSeenModal = localStorage.getItem("hasSeenImportTokenModal");
                if (!hasSeenModal) {
                    missing.push("bsc", "lensChain");
                }
            } catch (error) {
                console.error("Error checking tokens:", error);
            }

            setMissingChains(missing);
            setIsChecking(false);
        };

        checkTokens();
    }, [show, address]);

    const handleImportToken = async (chainKey: ChainKey) => {
        try {
            setIsImporting(true);
            setImportingChain(chainKey);
            const chain = chains[chainKey];
            
            // Switch to correct chain first
            if (currentChainId !== chain.chainId) {
                try {
                    await switchChainAsync({ chainId: chain.chainId });
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error: any) {
                    console.error("Chain switch error:", error);
                    toast.error(`Failed to switch chain: ${error.message}`);
                    setIsImporting(false);
                    setImportingChain(null);
                    return;
                }
            }
            
            // After switching chain, import token with watchAsset
            await watchAssetAsync({
                type: "ERC20",
                options: {
                    address: chain.token.address as `0x${string}`,
                    symbol: chain.token.symbol,
                    decimals: chain.token.decimals,
                    image: window.location.origin + chain.token.icon,
                },
            });
            
            setMissingChains(prev => prev.filter(c => c !== chainKey));
        } catch (error: any) {
            console.error("Error importing token:", error);
            toast.error(`Failed to import token: ${error.message}`);
        } finally {
            setIsImporting(false);
            setImportingChain(null);
        }
    };

    const handleSkip = () => {
        localStorage.setItem("hasSeenImportTokenModal", "true");
        onClose();
    };

    if (isChecking) {
        return (
        <Modal show={show} onClose={onClose} title="Import Token">
            <div className="flex flex-col items-center gap-4 p-10">
                <Loader />
                <span className="text-gray-500 text-sm dark:text-gray-400">
                    Checking wallet tokens...
                </span>
            </div>
        </Modal>
        );
    }

    if (missingChains.length === 0) {
        return null;
    }

    return (
        <Modal show={show} onClose={onClose} title="Import Token to Wallet">
            <Card className="m-3" forceRounded>
                <div className="p-5 space-y-5">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Image
                            alt={ERC20_TOKEN_SYMBOL}
                            className="size-16 rounded-full"
                            src={chains.lensChain.token.icon}
                        />
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg">
                                Import {ERC20_TOKEN_SYMBOL} Token
                            </h3>
                            <p className="text-gray-500 text-sm dark:text-gray-400">
                                Would you like to add {ERC20_TOKEN_SYMBOL} token to your MetaMask wallet? 
                                This will make it easier to view and manage your token balance.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {missingChains.map((chainKey) => (
                            <div key={chainKey} className="flex items-center justify-between py-3 px-4 rounded-2xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <Image
                                        alt={chains[chainKey as keyof typeof chains].name}
                                        className="size-8 rounded-full"
                                        src={chains[chainKey as keyof typeof chains].icon}
                                    />
                                    <div>
                                        <div className="font-medium text-sm">
                                            {chains[chainKey as keyof typeof chains].name}
                                        </div>
                                        <div className="text-gray-500 text-xs dark:text-gray-400">
                                            {chains[chainKey as keyof typeof chains].token.symbol}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => handleImportToken(chainKey as ChainKey)}
                                    disabled={isImporting}
                                    loading={importingChain === chainKey}
                                    size="sm"
                                    outline
                                >
                                    Import
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleSkip}
                        disabled={isImporting}
                    >
                        Skip
                    </Button>
                </div>
            </Card>
        </Modal>
    );
};

export default ImportTokenModal;
