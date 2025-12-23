import React from "react";

interface DNPayOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onHasWallet: () => void;
}

const DNPayOnboardingModal: React.FC<DNPayOnboardingModalProps> = ({ open, onClose, onHasWallet }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Bạn đã có ví DNPAY chưa?</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base font-medium"
            onClick={onHasWallet}
          >
            Tôi đã có ví
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-base font-medium cursor-not-allowed"
            disabled
          >
            Tôi chưa có ví (sắp ra mắt)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DNPayOnboardingModal;
