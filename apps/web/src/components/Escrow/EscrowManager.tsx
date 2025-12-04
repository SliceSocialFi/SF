/**
 * EscrowManager - Complete escrow management UI
 * Combines deposit, cancel, release, and status display
 */

import { useState } from "react";
import { EscrowDeposit } from "./EscrowDeposit";
import { EscrowCancel } from "./EscrowCancel";
import { EscrowRelease } from "./EscrowRelease";
import { EscrowStatus } from "./EscrowStatus";
import Card from "@/components/Shared/UI/Card";
import Tabs from "@/components/Shared/UI/Tabs";

interface EscrowManagerProps {
  taskId: string;
  freelancerAddress?: string;
  employerAddress?: string;
  currentUserAddress?: string;
  onChainTaskId?: string;
  defaultAmount?: string;
  defaultDeadlineDays?: number;
}

export function EscrowManager({
  taskId,
  freelancerAddress,
  employerAddress,
  currentUserAddress,
  onChainTaskId: initialOnChainTaskId,
  defaultAmount = "1",
  defaultDeadlineDays = 7,
}: EscrowManagerProps) {
  const [activeTab, setActiveTab] = useState<"status" | "deposit" | "actions">(
    "status"
  );
  const [onChainTaskId, setOnChainTaskId] = useState(initialOnChainTaskId);
  const [refreshKey, setRefreshKey] = useState(0);

  const isEmployer =
    currentUserAddress?.toLowerCase() === employerAddress?.toLowerCase();

  const handleDepositSuccess = (txHash: string, taskId?: string) => {
    // console.log("Deposit success:", txHash, taskId);
    if (taskId) {
      setOnChainTaskId(taskId);
    }
    setRefreshKey((prev) => prev + 1);
    setActiveTab("status");
  };

  const handleActionSuccess = (txHash: string) => {
    // console.log("Action success:", txHash);
    setRefreshKey((prev) => prev + 1);
  };

  const tabs = [
    { name: "Status", type: "status" as const },
    { name: "Deposit", type: "deposit" as const },
    { name: "Actions", type: "actions" as const },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="mb-4 font-bold text-xl">Escrow Management</h2>

        <Tabs
          active={activeTab}
          setActive={(type) =>
            setActiveTab(type as "status" | "deposit" | "actions")
          }
          tabs={tabs}
          layoutId="escrow-tabs"
        />

        <div className="mt-6">
          {activeTab === "status" && (
            <EscrowStatus
              key={refreshKey}
              taskId={taskId}
              onChainTaskId={onChainTaskId}
            />
          )}

          {activeTab === "deposit" && (
            <div className="space-y-4">
              <EscrowDeposit
                taskId={taskId}
                freelancerAddress={freelancerAddress}
                defaultAmount={defaultAmount}
                defaultDeadlineDays={defaultDeadlineDays}
                onSuccess={handleDepositSuccess}
              />

              {!onChainTaskId && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-blue-800 text-sm dark:text-blue-200">
                    💡 After depositing, the on-chain task ID will be available.
                    You can then use Cancel and Release actions.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              {!onChainTaskId ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <p className="text-gray-600 text-sm dark:text-gray-400">
                    No escrow found. Please deposit funds first in the "Deposit"
                    tab.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="mb-3 font-medium">
                      Cancel Escrow (Before Deadline)
                    </h3>
                    <EscrowCancel
                      taskId={taskId}
                      onChainTaskId={onChainTaskId}
                      isEmployer={isEmployer}
                      onSuccess={handleActionSuccess}
                    />
                  </div>

                  <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
                    <h3 className="mb-3 font-medium">
                      Release Funds (After Deadline)
                    </h3>
                    <EscrowRelease
                      taskExternalId={taskId}
                      onSuccess={handleActionSuccess}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-2 font-medium text-sm">How Escrow Works</h4>
        <ul className="list-inside list-disc space-y-1 text-gray-600 text-xs dark:text-gray-400">
          <li>Employer deposits funds with a deadline</li>
          <li>Funds are locked on-chain until deadline or cancellation</li>
          <li>
            Before deadline: only employer can cancel (refund to employer)
          </li>
          <li>After deadline: anyone can release funds to freelancer</li>
          <li>All transactions are on-chain and transparent</li>
        </ul>
      </div>
    </div>
  );
}
