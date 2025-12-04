/**
 * EscrowRelease - Component for employer to approve work and release escrow
 * This should be shown when freelancer submits outcome and employer reviews it
 */

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import Button from "@/components/Shared/UI/Button";
import Card from "@/components/Shared/UI/Card";
import { toast } from "sonner";
import type { Application } from "@/types/task-api";

interface EscrowReleaseProps {
  application: Application;
  taskExternalId: string;
  freelancerAddress: string;
  onSuccess?: () => void;
}
// Component for releasing escrow payment to freelancer
export function EscrowRelease({
  application,
  taskExternalId,
  freelancerAddress,
  onSuccess,
}: EscrowReleaseProps) {
  const { isConnected, connect } = useWallet();
  const [taskId, setTaskId] = useState<string>("");
  const [isLoadingTaskId, setIsLoadingTaskId] = useState(false);

  const { adminReleaseEscrow, isReleasing } = useEscrow({
    onSuccess: (tx) => {
      toast.success(
        `Escrow released! Freelancer received payment. Tx: ${tx.txHash.slice(
          0,
          10
        )}...`
      );
      onSuccess?.();
    },
    onError: (err) => {
      console.error("Release error:", err);
    },
  });

  // Load on-chain taskId from externalTaskId
  // const handleLoadTaskId = async () => {
  //   if (!isConnected) {
  //     toast.error("Please connect wallet first");
  //     return;
  //   }

  //   setIsLoadingTaskId(true);
  //   try {
  //     const onChainTaskId = await getTaskIdFromExternal(taskExternalId);
  //     setTaskId(onChainTaskId);
  //     toast.success(`Found on-chain task ID: ${onChainTaskId}`);
  //   } catch (err: any) {
  //     console.error("Failed to get task ID:", err);
  //     toast.error(err?.message || "Failed to get on-chain task ID");
  //   } finally {
  //     setIsLoadingTaskId(false);
  //   }
  // };

  const handleRelease = async () => {
    if (!isConnected) {
      toast.error("Please connect wallet first");
      return;
    }

    if (!taskExternalId) {
      toast.error("Task External ID is missing.");
      return;
    }

    try {
      // Call backend API with DB UUID (taskExternalId)
      // Backend handles: fetching on-chain ID, calling contract, updating DB
      await adminReleaseEscrow(
        taskExternalId, // Pass DB UUID, not on-chain ID
        `Work approved for application ${application.id}`
      );
    } catch (err) {
      console.error("Failed to release escrow:", err);
    }
  };

  return (
    <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
      {/* XÓA KHỐI NÀY, chỉ hiển thị nút Release */}

      <div className="flex-1 rounded bg-gray-100 p-2 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Task ID (DB UUID):
        </p>
        {/* HIỂN THỊ taskExternalId debug */}
        <p className="font-mono text-sm">{taskExternalId}</p>
      </div>

      <Button
        onClick={handleRelease}
        loading={isReleasing}
        disabled={isReleasing}
        className="bg-green-600 hover:bg-green-700"
      >
        {isReleasing ? "Releasing..." : "Release Payment"}
      </Button>
    </div>
  );
}
