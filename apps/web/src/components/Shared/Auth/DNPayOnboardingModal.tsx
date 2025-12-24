import React from "react";
import { Card, Image, Spinner } from "@/components/Shared/UI";

interface DNPayOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onHasWallet: () => void;
}

const DNPayOnboardingModal: React.FC<DNPayOnboardingModalProps> = ({ open, onClose, onHasWallet }) => {
  if (!open) {
    // Show spinner overlay while waiting for modal to appear
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <Spinner size="md" />
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#121212] rounded-xl p-0 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header: Success + Close */}
        <div className="flex items-center justify-between px-6 pt-3 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-base">Success</span>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl button-animated rounded-full w-9 h-9 flex items-center justify-center">✕</button>
        </div>
        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800 flex" />
        {/* DNPAY Logo + Title */}
        <div className="flex flex-col items-center px-6 pt-6 pb-6">
          <img
            src="/dnpay-logo-darkmode.png"
            alt="DNPAY Logo"
            className="w-14 h-14 mb-6 dark:block hidden"
            draggable={false}
          />
          <img
            src="/dnpay-logo-lightmode.png"
            alt="DNPAY Logo"
            className="w-14 h-14 mb-2 dark:hidden block"
            draggable={false}
          />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">Wallet linking required to continue</h2>
        </div>
        {/* Options */}
        <div className="flex flex-col gap-4 px-6 pb-6">
          {/* Option 1: Đã có ví */}
          <Card
            className="cursor-pointer transition-all hover:shadow-lg px-5 py-4 button-animated flex items-center gap-4"
            forceRounded
            onClick={onHasWallet}
          >
            <div className="flex-shrink-0">
              <Image
                alt="MetaMask"
                className="size-9"
                src="/metamask-logo.png"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base">Already have a wallet</h4>
              <p className="text-gray-500 text-sm dark:text-gray-400">Link your MetaMask wallet</p>
            </div>
            <div className="flex-shrink-0">
              <svg className="size-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
          </Card>
          {/* Option 2: Chưa có ví */}
          <Card
            className="cursor-pointer transition-all px-5 py-4 button-animated flex items-center gap-4"
            forceRounded
            onClick={e => e.preventDefault()}
          >
            <div className="flex-shrink-0">
              <Image
                alt="Web3Auth"
                className="size-9"
                src="/web3auth.png"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base">No wallet yet?</h4>
              <p className="text-gray-500 text-sm dark:text-gray-400">Create a crypto wallet</p>
            </div>
            <div className="flex-shrink-0">
              <svg className="size-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DNPayOnboardingModal;
