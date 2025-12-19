import { KeyIcon } from "@heroicons/react/24/outline";
import type { FC } from "react";
import { Link } from "react-router";
import type { Connector } from "wagmi";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import cn from "@/helpers/cn";
import getWalletDetails from "@/helpers/getWalletDetails";
import DNPayLoginButton from "./DNPayLoginButton";

const WalletSelector: FC = () => {
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { connector: activeConnector } = useAccount();

  const allowedConnectors = [
    "familyAccountsProvider",
    "injected",
    "walletConnect"
  ];

  const filteredConnectors = connectors
    .filter((connector: any) => allowedConnectors.includes(connector.id))
    .sort(
      (a: Connector, b: Connector) =>
        allowedConnectors.indexOf(a.id) - allowedConnectors.indexOf(b.id)
    );

  const handleConnect = async (connector: Connector) => {
    try {
      await connectAsync({ connector });
    } catch {}
  };

  return activeConnector?.id ? (
    <div className="space-y-2.5">
      <button
        className="flex items-center space-x-1 text-sm underline"
        onClick={() => disconnect?.()}
        type="reset"
      >
        <KeyIcon className="size-4" />
        <div>Change wallet</div>
      </button>
    </div>
  ) : (
    <div className="inline-block w-full space-y-3 overflow-hidden text-left align-middle">
      <DNPayLoginButton
        className="w-full"
        onSuccess={(data) => {
          console.log("=== DNPAY LOGIN SUCCESS ===");
          console.log("Authorization data:", data);
          
          // Double-check localStorage
          const savedToken = localStorage.getItem("TokenAccessDNPAY");
          console.log("Token from localStorage (TokenAccessDNPAY):", savedToken);
          
          if (data.code) {
            console.log("Code:", data.code);
          }
          if (data.token) {
            console.log("Token:", data.token);
          }
          if (data.access_token) {
            console.log("Access Token:", data.access_token);
            console.log("Token saved to localStorage: ✓");
          }
          console.log("==========================");
          // TODO: Handle DNPAY authentication flow
          // Next step: Use access_token from localStorage or data.access_token
        }}
      />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white dark:bg-black px-2 text-gray-500">Or continue with wallet</span>
        </div>
      </div>

      {filteredConnectors.map((connector: any) => {
        return (
          <button
            className={cn(
              {
                "button-animated dark:bg-[#121212]":
                  connector.id !== activeConnector?.id
              },
              "flex w-full items-center justify-between space-x-2.5 overflow-hidden rounded-xl border border-gray-200 px-4 py-3 outline-hidden dark:border-gray-700"
            )}
            disabled={connector.id === activeConnector?.id || isPending}
            key={connector.id}
            onClick={() => handleConnect(connector)}
            type="button"
          >
            <span>{getWalletDetails(connector.id).name}</span>
            <img
              alt={connector.id}
              className="size-6"
              draggable={false}
              height={24}
              src={getWalletDetails(connector.id).logo}
              width={24}
            />
          </button>
        );
      })}
      <div className="linkify text-gray-500 text-sm">
        By connecting wallet, you agree to our{" "}
        <Link target="_blank" to="/terms">
          Terms
        </Link>{" "}
        and{" "}
        <Link target="_blank" to="/privacy">
          Policy
        </Link>
        .
      </div>
    </div>
  );
};

export default WalletSelector;
