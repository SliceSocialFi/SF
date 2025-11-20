/**
 * EscrowCancel - Component for cancelling escrow (employer only, before deadline)
 */

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import Button from "@/components/Shared/UI/Button";
import Input from "@/components/Shared/UI/Input";
import { toast } from "sonner";

interface EscrowCancelProps {
  taskId: string;
  onChainTaskId?: string;
  isEmployer: boolean;
  deadline?: number;
  onSuccess?: (txHash: string) => void;
}

export function EscrowCancel({
  taskId,
  onChainTaskId,
  isEmployer,
  deadline,
  onSuccess,
}: EscrowCancelProps) {
  const { isConnected, connect } = useWallet();
  const [reason, setReason] = useState("Cancelled by employer");
  const [showConfirm, setShowConfirm] = useState(false);

  const { cancel, isCancelling } = useEscrow({
    onSuccess: (tx) => {
      toast.success(`Escrow cancelled! Tx: ${tx.txHash.slice(0, 10)}...`);
      onSuccess?.(tx.txHash);
      setShowConfirm(false);
    },
    onError: (err) => {
      console.error("Cancel error:", err);
    },
  });

  const handleCancel = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!isEmployer) {
      toast.error("Only the employer can cancel this escrow");
      return;
    }

    if (!onChainTaskId) {
      toast.error("On-chain task ID not found");
      return;
    }

    // Check if deadline has passed
    if (deadline && Date.now() / 1000 > deadline) {
      toast.error("Cannot cancel after deadline. Use release instead.");
      return;
    }

    try {
      await cancel(onChainTaskId, reason);
    } catch (err) {
      console.error("Failed to cancel:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="mb-3 text-gray-600 text-sm dark:text-gray-400">
          Connect your wallet to cancel this escrow.
        </p>
        <Button onClick={connect} outline>
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!isEmployer) {
    return null;
  }

  if (deadline && Date.now() / 1000 > deadline) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Deadline has passed. You cannot cancel this escrow. Use "Release After
          Deadline" instead.
        </p>
      </div>
    );
  }

  if (!showConfirm) {
    return (
      <Button
        onClick={() => setShowConfirm(true)}
        outline
        className="border-red-500 text-red-500"
      >
        Cancel Escrow
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
      <p className="font-medium text-red-800 text-sm dark:text-red-200">
        Are you sure you want to cancel this escrow? Funds will be refunded to
        your wallet.
      </p>

      <div>
        <label className="mb-1 block text-sm">Reason</label>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation"
          disabled={isCancelling}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCancel}
          loading={isCancelling}
          disabled={isCancelling}
          className="bg-red-500 hover:bg-red-600"
        >
          {isCancelling ? "Cancelling..." : "Confirm Cancel"}
        </Button>
        <Button
          onClick={() => setShowConfirm(false)}
          outline
          disabled={isCancelling}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
