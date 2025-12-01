/**
 * EscrowDeposit - Component for depositing funds into escrow
 * Refactored to use wagmi + viem for better error handling
 */

import { useState } from "react";
import { parseUnits, isAddress } from "viem";
import { useWallet } from "@/hooks/useWallet";
import { useEscrow } from "@/hooks/useEscrow";
import Button from "@/components/Shared/UI/Button";
import Input from "@/components/Shared/UI/Input";
import Card from "@/components/Shared/UI/Card";
import { toast } from "sonner";
import {
  TASK_ESCROW_POOL_ADDRESS,
  ERC20_TOKEN_ADDRESS,
} from "@slice/data/constants";

interface EscrowDepositProps {
  taskId?: string;
  freelancerAddress?: string;
  defaultAmount?: string;
  defaultDeadlineDays?: number;
  taskDeadline?: string; // ISO date string for absolute deadline
  onSuccess?: (txHash: string, onChainTaskId?: string) => void;
  readOnly?: boolean;
}

export function EscrowDeposit({
  taskId,
  freelancerAddress: defaultFreelancer,
  defaultAmount = "100",
  defaultDeadlineDays = 7,
  taskDeadline,
  onSuccess,
  readOnly = false,
}: EscrowDepositProps) {
  const { isConnected, signer, connect } = useWallet();
  const [freelancerAddress, setFreelancerAddress] = useState(
    defaultFreelancer || ""
  );
  const [amount, setAmount] = useState(defaultAmount);

  // Calculate deadline days from task deadline or use default
  const calculateDeadlineDays = () => {
    if (taskDeadline) {
      const taskDeadlineDate = new Date(taskDeadline);
      const daysRemaining = Math.max(
        1,
        Math.ceil(
          (taskDeadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      );
      console.log("🔍 Task Deadline:", taskDeadline);
      console.log("📅 Days Remaining:", daysRemaining);
      console.log("🎯 Deadline Date:", taskDeadlineDate.toLocaleString());
      return daysRemaining.toString();
    }
    console.log(
      "⚠️ No taskDeadline provided, using default:",
      defaultDeadlineDays
    );
    return defaultDeadlineDays.toString();
  };

  const [deadlineDays, setDeadlineDays] = useState(calculateDeadlineDays());

  // Calculate actual deadline unix timestamp
  const getDeadlineUnix = () => {
    if (taskDeadline) {
      // Use absolute task deadline
      return Math.floor(new Date(taskDeadline).getTime() / 1000);
    }
    // Fallback: calculate from days
    return Math.floor(Date.now() / 1000) + Number(deadlineDays) * 86400;
  };

  const { deposit, isDepositing } = useEscrow({
    onSuccess: (tx) => {
      toast.success(`Deposit successful! Tx: ${tx.txHash.slice(0, 10)}...`);
      onSuccess?.(tx.txHash, tx.taskId);
    },
    onError: (err) => {
      console.error("Deposit error:", err);
    },
  });

  const handleDiagnose = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    toast.info(
      "With viem, errors are automatically decoded. Just try depositing!"
    );
  };

  const handleDeposit = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!freelancerAddress || !isAddress(freelancerAddress)) {
      toast.error("Invalid freelancer address");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Invalid amount");
      return;
    }

    if (!taskId) {
      toast.error("Task ID is required");
      return;
    }

    try {
      // Parse amount to wei (assuming 18 decimals)
      const amountWei = parseUnits(amount, 18);

      // Get deadline unix timestamp
      const deadlineUnix = getDeadlineUnix();

      await deposit({
        freelancerAddress,
        amountWei,
        deadlineUnix,
        externalTaskId: taskId,
      });
    } catch (err) {
      console.error("Failed to deposit:", err);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6">
        <h3 className="mb-4 font-bold text-lg">Deposit Escrow Funds</h3>
        <p className="mb-4 text-gray-600 text-sm dark:text-gray-400">
          Connect your wallet to deposit funds into escrow for this task.
        </p>
        <Button onClick={connect}>Connect Wallet</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-bold text-lg">Deposit Escrow Funds</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block font-medium text-sm">Task ID</label>
          <Input
            value={taskId || ""}
            disabled
            className="bg-gray-100 dark:bg-gray-800"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-sm">
            Freelancer Address
          </label>
          <Input
            value={freelancerAddress}
            onChange={(e) => setFreelancerAddress(e.target.value)}
            placeholder="0x..."
            disabled={readOnly || isDepositing}
            className={readOnly ? "bg-gray-100 dark:bg-gray-800" : ""}
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-sm">
            Amount (tokens)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            disabled={readOnly || isDepositing}
            className={readOnly ? "bg-gray-100 dark:bg-gray-800" : ""}
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-sm">
            Deadline (days from now)
          </label>
          <Input
            type="number"
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(e.target.value)}
            placeholder="7"
            disabled={readOnly || isDepositing}
            className={readOnly ? "bg-gray-100 dark:bg-gray-800" : ""}
          />
        </div>

        <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
          {!readOnly && (
            <Button
              onClick={handleDiagnose}
              disabled={!isConnected}
              outline
              className="flex-1"
            >
              Run Diagnostic
            </Button>
          )}
          <Button
            onClick={handleDeposit}
            loading={isDepositing}
            disabled={isDepositing}
            className={readOnly ? "w-full" : "flex-1"}
          >
            {isDepositing
              ? "Depositing..."
              : readOnly
              ? "Confirm & Deposit"
              : "Deposit Funds"}
          </Button>
        </div>

        <p className="text-gray-500 text-xs dark:text-gray-400">
          You will be asked to approve the token transfer first, then deposit
          the funds. Both transactions require your confirmation in MetaMask.
        </p>

        {/* Debug Info */}
        <details className="mt-4 rounded border border-gray-200 p-2 dark:border-gray-700">
          <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
            Debug Info (Click to expand)
          </summary>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Escrow Contract:</span>
              <span className="font-mono">
                {TASK_ESCROW_POOL_ADDRESS.slice(0, 10)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Token Address:</span>
              <span className="font-mono">
                {ERC20_TOKEN_ADDRESS.slice(0, 10)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Task ID:</span>
              <span className="font-mono">{taskId || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount (Wei):</span>
              <span className="font-mono">
                {amount ? parseUnits(amount, 18).toString() : "0"}
              </span>
            </div>
          </div>
        </details>
      </div>
    </Card>
  );
}
