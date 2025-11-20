/**
 * EscrowStatus - Component to display escrow status and info
 */

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { apiClient } from "@/lib/apiClient";
import Card from "@/components/Shared/UI/Card";
import Spinner from "@/components/Shared/UI/Spinner";
import type { EscrowInfo } from "@slice/types/escrow";

interface EscrowStatusProps {
  taskId: string;
  onChainTaskId?: string;
}

export function EscrowStatus({ taskId, onChainTaskId }: EscrowStatusProps) {
  const [escrow, setEscrow] = useState<EscrowInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEscrow = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from backend first
        let data: EscrowInfo;
        if (onChainTaskId) {
          data = await apiClient.getEscrowTask(onChainTaskId);
        } else {
          data = await apiClient.getEscrowByExternalId(taskId);
        }

        setEscrow(data);
      } catch (err: any) {
        console.error("Failed to fetch escrow:", err);
        setError(err?.message || "Failed to fetch escrow info");
      } finally {
        setLoading(false);
      }
    };

    fetchEscrow();
  }, [taskId, onChainTaskId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-xs">
            Escrow may not be set up yet for this task.
          </p>
        </div>
      </Card>
    );
  }

  if (!escrow) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">No escrow found for this task.</p>
        </div>
      </Card>
    );
  }

  const deadlineDate = new Date(escrow.deadline * 1000);
  const isPastDeadline = Date.now() / 1000 > escrow.deadline;
  const formattedAmount = ethers.formatUnits(escrow.amount, 18);

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-bold text-lg">Escrow Details</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm dark:text-gray-400">
            Status
          </span>
          <span
            className={`rounded-full px-3 py-1 font-medium text-xs ${
              escrow.settled
                ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                : isPastDeadline
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            }`}
          >
            {escrow.settled
              ? "Settled"
              : isPastDeadline
              ? "Past Deadline"
              : "Active"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm dark:text-gray-400">
            Amount
          </span>
          <span className="font-medium text-sm">{formattedAmount} tokens</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm dark:text-gray-400">
            Employer
          </span>
          <span className="font-mono text-sm">
            {escrow.employer.slice(0, 10)}...
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm dark:text-gray-400">
            Freelancer
          </span>
          <span className="font-mono text-sm">
            {escrow.freelancer.slice(0, 10)}...
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600 text-sm dark:text-gray-400">
            Deadline
          </span>
          <span className="text-sm">
            {deadlineDate.toLocaleDateString()}{" "}
            {deadlineDate.toLocaleTimeString()}
          </span>
        </div>

        {escrow.depositedTx && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm dark:text-gray-400">
              Deposit Tx
            </span>
            <a
              href={`https://testnet.lenscan.io/tx/${escrow.depositedTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 text-sm hover:underline"
            >
              {escrow.depositedTx.slice(0, 10)}...
            </a>
          </div>
        )}

        {escrow.releasedTx && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm dark:text-gray-400">
              Release Tx
            </span>
            <a
              href={`https://testnet.lenscan.io/tx/${escrow.releasedTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 text-sm hover:underline"
            >
              {escrow.releasedTx.slice(0, 10)}...
            </a>
          </div>
        )}

        {escrow.releaseReason && (
          <div>
            <span className="mb-1 block text-gray-600 text-sm dark:text-gray-400">
              Release Reason
            </span>
            <p className="rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
              {escrow.releaseReason}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
