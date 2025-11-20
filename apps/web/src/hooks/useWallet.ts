/**
 * useWallet - Simplified wallet hook using wagmi
 * Wagmi handles connection, network switching, and account changes automatically
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { CHAIN } from "@slice/data/constants";

export function useWallet() {
  const { address, isConnected, chainId } = useAccount();
  const { connect: wagmiConnect, connectors, isPending } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Check if MetaMask is available
  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum;

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask to continue");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      const connector = connectors.find((c) => c.id === "injected");
      if (!connector) {
        toast.error("MetaMask connector not found");
        return;
      }

      wagmiConnect({ connector });
      toast.success("Wallet connected successfully");
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast.error(error?.message || "Failed to connect wallet");
    }
  }, [connectors, wagmiConnect]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    wagmiDisconnect();
    toast.success("Wallet disconnected");
  }, [wagmiDisconnect]);

  // Switch network
  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      if (!switchChain) {
        toast.error("Network switching not available");
        return;
      }

      try {
        switchChain({ chainId: targetChainId });
      } catch (error: any) {
        console.error("Failed to switch network:", error);
        toast.error(error?.message || "Failed to switch network");
      }
    },
    [switchChain]
  );

  return {
    address: address || null,
    isConnected,
    isConnecting: isPending,
    chainId: chainId || null,
    isMetaMaskInstalled,
    connect,
    disconnect,
    switchNetwork,
    // Legacy compatibility (no longer needed with wagmi)
    provider: null,
    signer: null
  };
}
