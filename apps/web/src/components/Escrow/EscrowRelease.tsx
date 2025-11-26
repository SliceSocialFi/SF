/**
 * EscrowRelease - Component for releasing funds after deadline (permissionless)
 * Can be called by anyone after deadline:
 * - If work submitted but no feedback: release to freelancer
 * - If no work submitted: release to employer
 */

import { useState, useEffect } from "react";
import { useEscrow } from "@/hooks/useEscrow";
import { apiClient } from "@/lib/apiClient";
import Button from "@/components/Shared/UI/Button";
import { toast } from "sonner";
import type { Address } from "viem";

interface EscrowReleaseProps {
  taskExternalId: string;
  taskId?: string; // DB task ID for checking application status
  freelancerAddress?: string;
  employerAddress?: string;
  taskDeadline?: string; // Task deadline ISO string (optional, can read from chain)
  onSuccess?: (txHash: string) => void;
}

// Validate Ethereum address format
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export function EscrowRelease({
  taskExternalId,
  taskId,
  freelancerAddress,
  employerAddress,
  taskDeadline,
  onSuccess,
}: EscrowReleaseProps) {
  const [loading, setLoading] = useState(false);
  const [hasSubmission, setHasSubmission] = useState<boolean | null>(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  // Auto-populated fields (read-only)
  const [recipientAddress, setRecipientAddress] = useState("");
  const [reason, setReason] = useState("");

  const { releaseAfterDeadline, isReleasing } = useEscrow({
    onSuccess: (tx) => {
      toast.success(`Release successful! Tx: ${tx.txHash.slice(0, 10)}...`);
      onSuccess?.(tx.txHash);
    },
    onError: (err) => {
      console.error("Release error:", err);
    },
  });

  // Check submission status and deadline
  useEffect(() => {
    const checkStatus = async () => {
      if (!taskId || !taskExternalId) return;

      setLoading(true);
      try {
        // Check deadline from task data (ISO string)
        if (taskDeadline) {
          const deadlineTime = new Date(taskDeadline).getTime();
          const now = new Date().getTime();
          setDeadlinePassed(now > deadlineTime);
        }

        // Check if there's a submission
        const applications = await apiClient.getApplicationsByTask(taskId);
        const acceptedApp = applications.find(
          (app) => app.status === "accepted"
        );

        if (acceptedApp) {
          // Has submission if outcome exists
          setHasSubmission(!!acceptedApp.outcome);

          // Auto-populate suggested recipient and reason
          if (acceptedApp.outcome && freelancerAddress) {
            setRecipientAddress(freelancerAddress);
            setReason(
              "Work submitted but no feedback received before deadline"
            );
          } else if (!acceptedApp.outcome && employerAddress) {
            setRecipientAddress(employerAddress);
            setReason("No work submitted before deadline");
          }
        } else {
          setHasSubmission(false);
          if (employerAddress) {
            setRecipientAddress(employerAddress);
            setReason("No application accepted");
          }
        }
      } catch (error) {
        console.error("Failed to check status:", error);
        toast.error("Failed to load task status");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [
    taskId,
    taskExternalId,
    taskDeadline,
    freelancerAddress,
    employerAddress,
  ]);

  const handleRelease = async () => {
    // Validate auto-populated data
    if (!recipientAddress.trim()) {
      toast.error(
        "Recipient address not determined. Please check task status."
      );
      return;
    }

    if (!isValidAddress(recipientAddress)) {
      toast.error("Invalid recipient address format");
      return;
    }

    if (!reason.trim()) {
      toast.error("Release reason not determined. Please check task status.");
      return;
    }

    if (!taskExternalId) {
      toast.error("Missing task information");
      return;
    }

    try {
      // Call backend API (no Metamask confirmation needed)
      await releaseAfterDeadline(
        taskExternalId,
        recipientAddress as Address,
        reason
      );

      // Update task status in backend
      if (taskId) {
        await apiClient.updateTask(taskId, {
          status: "completed",
        });
      }
    } catch (error: any) {
      console.error("Release failed:", error);
      // Error toast already shown in hook
    }
  };

  // Render: Loading status
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-gray-600 text-sm dark:text-gray-400">
          Loading task status...
        </p>
      </div>
    );
  }

  // Render: Deadline not passed
  if (!deadlinePassed) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-yellow-800 text-sm dark:text-yellow-200">
          ⏳ Deadline has not passed yet. Auto Release Function will be
          available after the deadline.
        </p>
      </div>
    );
  }

  // Render: Main release UI
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-4">
        <h4 className="mb-2 font-medium text-gray-900 dark:text-white">
          Release Funds After Deadline
        </h4>
        <p className="text-gray-600 text-sm dark:text-gray-400">
          The deadline has passed. Review the auto-populated details and confirm
          to release funds.
        </p>
      </div>

      {/* Status Info */}
      {hasSubmission !== null && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-blue-800 text-xs dark:text-blue-200">
            <strong>Status:</strong>{" "}
            {hasSubmission ? "✅ Work Submitted" : "❌ No Submission"}
            <br />
            <strong>Suggested recipient:</strong>{" "}
            {hasSubmission ? "Freelancer" : "Employer"}
          </p>
        </div>
      )}

      {/* Recipient Address (Read-only) */}
      <div className="mb-4">
        <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
          Recipient Address
        </label>
        <input
          type="text"
          value={recipientAddress}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400"
        />
        <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
          Automatically determined based on submission status
        </p>
      </div>

      {/* Reason (Read-only) */}
      <div className="mb-4">
        <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
          Reason
        </label>
        <textarea
          value={reason}
          readOnly
          rows={3}
          className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400"
        />
        <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
          Automatically generated reason for this release
        </p>
      </div>

      {/* Release Button */}
      <Button
        onClick={handleRelease}
        loading={isReleasing}
        disabled={isReleasing || !recipientAddress || !reason}
        className="w-full"
      >
        {isReleasing ? "Releasing..." : "Release Funds"}
      </Button>
    </div>
  );
}
