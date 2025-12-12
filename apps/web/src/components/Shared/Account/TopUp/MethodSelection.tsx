import { Card, Image } from "@/components/Shared/UI";
import { useTheme } from "@/hooks/useTheme";

interface MethodSelectionProps {
  onSelectMetaMask: () => void;
  onSelectDNPAY: () => void;
}

const MethodSelection = ({ 
  onSelectMetaMask, 
  onSelectDNPAY
}: MethodSelectionProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="m-5 space-y-4">
      <div className="mb-6 text-center">
        <h3 className="font-semibold text-lg">Choose a top-up method</h3>
        <p className="text-gray-500 text-sm dark:text-gray-400 mt-1">
          Select how you would like to fund your account
        </p>
      </div>

      {/* MetaMask Method */}
      <Card 
        className="cursor-pointer transition-all hover:border-brand-500 hover:shadow-lg px-6 py-4"
        forceRounded
        onClick={onSelectMetaMask}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Image
              alt="MetaMask"
              className="size-8"
              src="/metamask-logo.png"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-base">MetaMask Wallet</h4>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Transfer from your MetaMask wallet
            </p>
          </div>
          <div className="flex-shrink-0">
            <svg 
              className="size-6 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                d="M9 5l7 7-7 7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>
      </Card>

      {/* DNPAY Method */}
      <Card 
        className="cursor-pointer transition-all hover:border-brand-500 hover:shadow-lg px-6 py-4"
        forceRounded
        onClick={onSelectDNPAY}
      >
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <Image
              alt="DNPAY"
              className="size-8"
              src={isDark ? "/dnpay-logo-darkmode.png" : "/dnpay-logo-lightmode.png"}
            />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-base">DNPAY</h4>
            <p className="text-gray-500 text-sm dark:text-gray-400">
              Top-up with USDT or VNDC via DNPAY
            </p>
          </div>
          <div className="flex-shrink-0">
            <svg 
              className="size-6 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                d="M9 5l7 7-7 7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2}
              />
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MethodSelection;
