/**
 * EscrowRelease - Component for releasing escrow funds after deadline (API v4.0 - Auto Logic)
 *
 * ✨ FULLY AUTOMATIC - Backend decides recipient based on work status:
 * - ✅ If freelancer submitted work (in_review/completed) → Release to freelancer
 * - 🔄 If freelancer NOT submitted → Refund to employer
 *
 * Features:
 * - User only needs to confirm (optional reason input)
 * - Backend uses ADMIN WALLET to execute release (no user signature needed)
 * - Fully automatic recipient determination and address lookup
 *
 * Flow:
 * 1. User reviews task status info
 * 2. User optionally enters reason (or let backend auto-generate)
 * 3. User clicks "Release Payment" button
 * 4. Frontend calls POST /tasks/:id/release-after-deadline (only reason)
 * 5. Backend:
 *    - Validates deadline has passed
 *    - Checks freelancer work submission status
 *    - Auto-decides recipient (freelancer or employer)
 *    - Finds recipient address from database
 *    - Calls smart contract release() using ADMIN wallet
 *    - Updates task status and sends notifications
 * 6. Frontend shows success message with recipient info
 *
 * Error Handling:
 * - DEADLINE_NOT_REACHED: Shows time remaining
 * - ESCROW_NOT_FOUND: Contact support
 * - NO_DEPOSIT: Task has no deposit
 * - NO_WALLET_FOUND: Cannot find recipient wallet
 * - INVALID_ADDRESS_FORMAT: Invalid Ethereum address
 */

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import Button from "@/components/Shared/UI/Button";
import { toast } from "sonner";

type EscrowStatus = "active" | "settled" | "unknown";

interface EscrowReleaseProps {
  taskExternalId: string;
  taskId?: string; // DB task ID for checking application status
  taskDeadline?: string; // Task deadline ISO string (optional, can read from chain)
  onSuccess?: (txHash: string) => void;
}

export function EscrowRelease({
  taskExternalId,
  taskId,
  taskDeadline,
  onSuccess,
}: EscrowReleaseProps) {
  const [loading, setLoading] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus>("unknown");

  // Fixed reason based on deadline status
  const reason = deadlinePassed
    ? "Deadline has passed - automatic release/refund based on work submission status"
    : "";

  // Release loading state
  const [isReleasing, setIsReleasing] = useState(false);

  // Calculate time remaining until deadline
  const formatTimeRemaining = (deadlineInput?: string | number | Date) => {
    if (!deadlineInput) return null;

    try {
      let deadline: Date;

      if (deadlineInput instanceof Date) {
        deadline = deadlineInput;
      } else if (
        typeof deadlineInput === "number" ||
        (typeof deadlineInput === "string" && /^\d+$/.test(deadlineInput))
      ) {
        const timestamp = Number(deadlineInput);
        if (timestamp < 100000000000) {
          deadline = new Date(timestamp * 1000);
        } else {
          deadline = new Date(timestamp);
        }
      } else {
        let dateString = String(deadlineInput).trim();
        if (dateString.includes(" ") && !dateString.includes("T")) {
          dateString = dateString.replace(" ", "T");
        }
        if (dateString.includes(".")) {
          const parts = dateString.split(".");
          if (parts[1] && parts[1].length > 3) {
            const msPart = parts[1].substring(0, 3);
            const timezonePart = parts[1].endsWith("Z")
              ? "Z"
              : parts[1].includes("+")
              ? parts[1].substring(parts[1].indexOf("+"))
              : "";
            dateString = `${parts[0]}.${msPart}${timezonePart}`;
          }
        }
        if (!dateString.endsWith("Z") && !dateString.includes("+")) {
          dateString += "Z";
        }
        deadline = new Date(dateString);
      }

      if (Number.isNaN(deadline.getTime())) return null;

      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs <= 0) return null;

      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return `${diffMins} minutes left`;
      } else if (diffHours < 24) {
        return `${diffHours} hours left`;
      } else {
        return `${diffDays} days left`;
      }
    } catch (error) {
      console.error("Deadline parsing error:", error);
      return null;
    }
  };

  const timeRemaining = formatTimeRemaining(taskDeadline);

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

        // Check escrow status from backend
        let isSettled = false;
        try {
          const taskData = await apiClient.getTask(taskId);
          // console.log("📋 Task status check:", {
          //   taskId,
          //   status: taskData.status,
          //   isSettled:
          //     taskData.status === "completed" ||
          //     taskData.status === "cancelled",
          // });

          // if (
          //   taskData.status === "completed" ||
          //   taskData.status === "cancelled"
          // ) {
          //   console.log("✅ Escrow already settled, showing settled UI");
          //   setEscrowStatus("settled" as EscrowStatus);
          //   isSettled = true;
          // } else {
          //   console.log("🟢 Escrow active, proceeding with checks");
          //   setEscrowStatus("active" as EscrowStatus);
          // }
        } catch (err) {
          console.warn("⚠️  Failed to check escrow status:", err);
          setEscrowStatus("unknown" as EscrowStatus);
        }

        // Backend will auto-decide recipient, no need to check applications here
      } catch (error) {
        console.error("Failed to check status:", error);
        toast.error("Failed to load task status");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [taskId, taskExternalId, taskDeadline]);

  const handleRelease = async () => {
    // console.log("🎯 Release button clicked:", {
    //   taskId,
    //   taskExternalId,
    //   escrowStatus,
    //   deadlinePassed,
    // });

    if (!taskId) {
      toast.error("Missing task ID");
      return;
    }

    if (escrowStatus === "settled") {
      toast.error("Escrow already settled. Please refresh the page.");
      return;
    }

    setIsReleasing(true);
    try {
      // Call API v4.0 release-after-deadline endpoint (backend auto-decides recipient)
      const result = await apiClient.releaseAfterDeadline(
        taskId!,
        reason.trim() || undefined
      );

      if (result.alreadySettled) {
        toast.success("✅ Payment have been released before. Database sync.");
      } else {
        const recipientLabel =
          result.recipientType === "freelancer" ? "freelancer" : "employer";
        toast.success(
          `✅ Payment released to ${recipientLabel}! Tx: ${result.txHash?.slice(
            0,
            10
          )}...`
        );
        onSuccess?.(result.txHash);
      }

      // Task status already updated by backend
    } catch (error: any) {
      console.error("Release failed:", error);

      // Handle specific error codes from API v4.0
      switch (error.body?.code) {
        case "DEADLINE_NOT_REACHED":
          const { days, hours, minutes } = error.body.remainingFormatted || {};
          toast.warning(
            `⏰ Cannot release yet. Time remaining: ${days}d ${hours}h ${minutes}m`
          );
          break;

        case "ESCROW_NOT_FOUND":
          toast.error("Escrow data not found. Please contact support.");
          break;

        case "NO_DEPOSIT":
          toast.error("Task has no deposit. Cannot release payment.");
          break;

        case "NO_WALLET_FOUND":
          toast.error("Wallet address not found. Please contact support.");
          break;

        case "INVALID_ADDRESS_FORMAT":
          toast.error(
            "Invalid Ethereum address format. Please contact support."
          );
          break;

        default:
          toast.error(
            error.body?.message ||
              error.message ||
              "An error occurred. Please try again."
          );
      }
    } finally {
      setIsReleasing(false);
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

  // Render: Escrow already settled
  if (escrowStatus === "settled") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
          ✅ Escrow Already Settled
        </h4>
        <p className="text-blue-800 text-sm dark:text-blue-200">
          This escrow has already been released or cancelled. No further action
          needed.
        </p>
      </div>
    );
  }

  // Render: Deadline not passed
  if (!deadlinePassed) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <p className="text-yellow-800 text-sm dark:text-yellow-200">
          ⏳ Deadline has not passed yet.
          {timeRemaining && (
            <span className="ml-2 font-semibold text-yellow-700 dark:text-yellow-300">
              ({timeRemaining})
            </span>
          )}
          <br />
          Auto Release Function will be available after the deadline.
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

      {/* Status Info - Backend Auto-Decision */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h5 className="mb-2 font-medium text-blue-900 text-sm dark:text-blue-100">
          Automatic Recipient Selection
        </h5>
        <p className="mb-2 text-blue-800 text-xs dark:text-blue-200">
          Backend will automatically decide the recipient based on work
          submission status:
        </p>
        <ul className="space-y-1 text-blue-700 text-xs dark:text-blue-300">
          <li>✅ If freelancer submitted work → Release to freelancer</li>
          <li>🔄 If freelancer NOT submitted → Refund to employer</li>
        </ul>
      </div>

      {/* Reason (Read-only) */}
      <div className="mb-4">
        <label className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
          Reason
        </label>
        <div className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-700 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {reason || "Automatic release after deadline"}
        </div>
        <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">
          Auto-generated based on deadline status
        </p>
      </div>

      {/* Release Button */}
      <Button
        onClick={handleRelease}
        loading={isReleasing}
        disabled={isReleasing || (escrowStatus as string) === "settled"}
        className="w-full"
      >
        {isReleasing
          ? "Releasing..."
          : "Release Payment (Auto-Decide Recipient)"}
      </Button>
    </div>
  );
}
