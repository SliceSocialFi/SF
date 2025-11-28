/**
 * Example: How to integrate EscrowManager into existing TaskDetailModal
 *
 * This example shows how to add escrow functionality to your task detail page.
 * Copy-paste relevant sections into your TaskDetailModal.tsx or TaskDetail page.
 */

import { useState } from "react";
import { EscrowManager } from "@/components/Escrow";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import Tabs from "@/components/Shared/UI/Tabs";

interface TaskDetailWithEscrowProps {
  task: {
    id: number;
    employerProfileId: string;
    freelancerProfileId?: string;
    title: string;
    rewardPoints: number;
    status: string;
  };
}

export function TaskDetailWithEscrow({ task }: TaskDetailWithEscrowProps) {
  const [activeTab, setActiveTab] = useState<
    "details" | "applications" | "escrow"
  >("details");
  const { currentAccount } = useAccountStore();

  const isEmployer =
    currentAccount?.address.toLowerCase() ===
    task.employerProfileId.toLowerCase();
  const isFreelancer =
    task.freelancerProfileId &&
    currentAccount?.address.toLowerCase() ===
      task.freelancerProfileId.toLowerCase();

  // Show escrow tab only if user is employer or assigned freelancer
  const showEscrowTab = isEmployer || isFreelancer;

  const tabs = [
    { name: "Details", type: "details" },
    { name: "Applications", type: "applications" },
    ...(showEscrowTab ? [{ name: "Escrow", type: "escrow" }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Task Header */}
      <div>
        <h1 className="font-bold text-2xl">{task.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Reward: {task.rewardPoints} points
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        active={activeTab}
        setActive={(type) => setActiveTab(type as any)}
        tabs={tabs}
        layoutId="task-detail-tabs"
      />

      {/* Tab Content */}
      <div>
        {activeTab === "details" && (
          <div>
            {/* Your existing task details UI */}
            <p>Task details, objective, deliverables, etc.</p>
          </div>
        )}

        {activeTab === "applications" && (
          <div>
            {/* Your existing applications list */}
            <p>Applications list</p>
          </div>
        )}

        {activeTab === "escrow" && showEscrowTab && (
          <EscrowManager
            taskId={task.id.toString()}
            freelancerAddress={task.freelancerProfileId}
            employerAddress={task.employerProfileId}
            currentUserAddress={currentAccount?.address}
            defaultAmount={task.rewardPoints.toString()}
            defaultDeadlineDays={7}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Alternative: Inline Escrow in Task Details
 *
 * If you want escrow UI always visible instead of in a tab:
 */

import {
  EscrowStatus,
  EscrowDeposit,
  EscrowCancel,
  EscrowRelease,
} from "@/components/Escrow";

export function TaskDetailInlineEscrow({ task }: TaskDetailWithEscrowProps) {
  const { currentAccount } = useAccountStore();
  const isEmployer =
    currentAccount?.address.toLowerCase() ===
    task.employerProfileId.toLowerCase();

  return (
    <div className="space-y-6">
      {/* Task Info */}
      <div>
        <h1 className="font-bold text-2xl">{task.title}</h1>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Task Details (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 font-bold text-lg">Task Details</h2>
              {/* Your task details */}
            </div>
          </div>
        </div>

        {/* Right: Escrow Sidebar (1/3 width) */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Escrow</h2>

          {/* Escrow Status */}
          <EscrowStatus taskId={task.id.toString()} />

          {/* Employer Actions */}
          {isEmployer && task.status === "open" && (
            <EscrowDeposit
              taskId={task.id.toString()}
              freelancerAddress={task.freelancerProfileId}
              defaultAmount={task.rewardPoints.toString()}
            />
          )}

          {/* Cancel/Release Actions */}
          {isEmployer && (
            <div className="space-y-2">
              <EscrowCancel
                taskId={task.id.toString()}
                isEmployer={isEmployer}
              />
            </div>
          )}

          {/* Anyone can release after deadline */}
          <EscrowRelease taskExternalId={task.id.toString()} />
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Steps:
 *
 * 1. Add escrow tab to your existing task detail tabs
 * 2. Import EscrowManager component
 * 3. Pass task data and user addresses
 * 4. That's it! The manager handles everything.
 *
 * Customization:
 * - Use individual components (EscrowDeposit, EscrowCancel, etc.) for custom layouts
 * - Use useWallet and useEscrow hooks for custom logic
 * - Subscribe to backend events for real-time updates
 *
 * Backend Requirements:
 * - Implement event listeners for Deposited, Released, Cancelled
 * - Create escrow_tasks table
 * - Implement GET /escrow/task/:taskId endpoint
 */
