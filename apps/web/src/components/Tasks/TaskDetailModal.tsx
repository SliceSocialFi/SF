import {
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Button, H5, Modal, Tabs } from "@/components/Shared/UI";
import { toast } from "sonner";
import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { TaskItem } from "./TaskCard";
import ApplicationList from "./Applications/ApplicationList";
import ApplyModal from "./Applications/ApplyModal";
import SubmitOutcomeModal from "./Applications/SubmitOutcomeModal";
import PostRateModal from "./Applications/PostRateModal";
import { EscrowManager } from "@/components/Escrow";

const TaskDetailModal = ({
  task,
  isOpen,
  onClose,
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<
    "details" | "applications" | "submit work" | "escrow"
  >("details");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentAccount } = useAccountStore();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [ratingAppId, setRatingAppId] = useState<string | null>(null);

  if (!task) return null;

  const isOwner =
    task.employerProfileId?.toLowerCase() ===
    currentAccount?.address?.toLowerCase();
  // console.log("task applicants", task.employerProfileId);
  // console.log("current account", currentAccount?.address);
  const hasApplied = task.applicants.some(
    (applicant) =>
      applicant.applicantProfileId === currentAccount?.address.toLowerCase()
  );
  const myApplication = task.applicants.find(
    (applicant) =>
      applicant.applicantProfileId === currentAccount?.address.toLowerCase()
  );
  // console.log("my application", myApplication);
  // console.log("showActions", isOwner || hasApplied);
  const canSubmitOutcome =
    myApplication &&
    ((myApplication as any).status === "accepted" ||
      (myApplication as any).status === "needs_revision");

  // Check if user is freelancer (assigned to task)
  const isFreelancer =
    task.freelancerProfileId &&
    currentAccount?.address?.toLowerCase() ===
      task.freelancerProfileId.toLowerCase();

  // Show escrow tab for employer or assigned freelancer
  // const showEscrowTab = isOwner || isFreelancer;

  const handleApplicationUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    onClose(); // Close modal after successful action
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "in_review":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "completed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const handleCancelTask = async () => {
    if (!confirm("Are you sure you want to cancel this task?")) return;
    setIsCancelling(true);
    try {
      await apiClient.deleteTask(task.id);
      toast.success("Task cancelled");
      onClose();
    } catch (err: any) {
      console.error("Failed to cancel task", err);
      toast.error(err?.body?.message || "Failed to cancel task");
    } finally {
      setIsCancelling(false);
    }
  };
  const tabList = [
    { name: "Details", type: "details" },
    {
      name: `Applications (${task.applicants.length})`,
      type: "applications",
    },
  ];
  if (canSubmitOutcome) {
    tabList.push({ name: "Submit Work", type: "submit work" });
  }
  // Add Escrow tab for employer or assigned freelancer
  // if (showEscrowTab) {
  //   tabList.push({ name: "Escrow", type: "escrow" });
  // }

  return (
    <>
      <Modal onClose={onClose} show={isOpen} size="lg" title="Task Details">
        <div className="space-y-4 p-6">
          {/* Header with status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {task.employerAvatar ? (
                <img
                  src={task.employerAvatar}
                  alt={task.employerName}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-lg text-white">
                  {task.employerName?.charAt(0) || "T"}
                </div>
              )}
              <div>
                <H5 className="text-gray-900 dark:text-white">{task.title}</H5>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  {task.employerName || task.employerProfileId?.slice(0, 8)}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {canSubmitOutcome && task.status === "in_progress"
                ? "IN PROGRESS"
                : task.status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
          {/* Meta info */}
          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            {task.createdAt && (
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>Posted {formatDate(task.createdAt)}</span>
              </div>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Due {formatDate(task.deadline)}</span>
              </div>
            )}
          </div>
          {/* Tabs */}
          <Tabs
            active={activeTab}
            layoutId="task_detail_tabs"
            setActive={(type) =>
              setActiveTab(
                type as "details" | "applications" | "submit work" //| "escrow"
              )
            }
            tabs={tabList}
          />
          {/* Tab Content */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Reward */}
              <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-brand-500" />
                  <div>
                    <p className="font-medium text-brand-600 text-sm dark:text-brand-400">
                      Completion Reward
                    </p>
                    <p className="font-bold text-2xl text-brand-600 dark:text-brand-400">
                      {task.rewardPoints} points
                    </p>
                  </div>
                </div>
              </div>

              {/* Objective */}
              {task.objective && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Main Objective
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.objective}
                  </p>
                </div>
              )}

              {/* Deliverables */}
              {task.deliverables && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Deliverables
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.deliverables}
                  </p>
                </div>
              )}

              {/* Acceptance Criteria */}
              {task.acceptanceCriteria && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Acceptance Criteria
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.acceptanceCriteria}
                  </p>
                </div>
              )}
            </div>
          )}
          {/* Always mount ApplicationList to keep hook order stable; hide when not active */}
          <div
            style={{ display: activeTab === "applications" ? "block" : "none" }}
          >
            <ApplicationList
              key={refreshKey}
              taskId={task.id}
              taskStatus={task.status}
              isEmployer={isOwner}
              onApplicationUpdate={handleApplicationUpdate}
              rewardPoints={task.rewardPoints}
              onOpenRate={(id: string) => setRatingAppId(id)}
              // taskExternalId={task.id}
              // taskRewardAmount={task.rewardPoints?.toString() || "100"}
            />
          </div>
          {/* Submit Work Tab */}
          {activeTab === "submit work" && (
            <div className="space-y-4">
              <div>
                {/* <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                  Submit Work
                </h6> */}
                <div className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use the submission dialog to attach your outcome (text or
                    file URL). Click the button below to open the submission
                    form.
                  </p>

                  <div className="flex gap-3 border-t pt-4 mt-4">
                    <Button
                      className="ml-auto disabled:opacity-30 disabled:text-gray-400"
                      onClick={() => {
                        if (canSubmitOutcome) setShowSubmitModal(true);
                      }}
                      disabled={!canSubmitOutcome}
                      title={
                        !canSubmitOutcome
                          ? "You have already submitted for this task"
                          : undefined
                      }
                    >
                      Open Submit Form
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Escrow Tab */}
          {/* {activeTab === "escrow" && showEscrowTab && (
            <div className="mt-4">
              <EscrowManager
                taskId={task.id}
                freelancerAddress={task.freelancerProfileId || undefined}
                employerAddress={task.employerProfileId}
                currentUserAddress={currentAccount?.address}
                defaultAmount={task.rewardPoints?.toString() || "100"}
                defaultDeadlineDays={7}
              />
            </div>
          )} */}
          {/* Action Buttons */}
          <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
            {isOwner ? (
              <>
                {task.status === "open" && (
                  <div className="cursor-not-allowed text-gray-400">
                    <Button
                      className="flex-1"
                      onClick={handleCancelTask}
                      loading={isCancelling}
                      disabled={isCancelling}
                      style={{}}
                    >
                      Cancel Task
                    </Button>
                  </div>
                )}
                <Button className="w-32" onClick={onClose} outline>
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1 disabled:opacity-30 disabled:text-gray-400"
                  onClick={() => {
                    // Only open apply modal for users who haven't applied and when task is open
                    if (!hasApplied && task.status === "open")
                      setShowApplyModal(true);
                  }}
                  disabled={hasApplied || task.status !== "open"}
                  title={
                    hasApplied
                      ? "You have already applied for this task"
                      : undefined
                  }
                >
                  {hasApplied ? "Application Submitted" : "Apply for Task"}
                </Button>

                {/* {canSubmitOutcome && (
                  <Button
                    className="flex-1"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Work
                  </Button>
                )} */}

                <Button className="flex-1" onClick={onClose} outline>
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onSuccess={handleApplicationUpdate}
      />

      {/* Submit Outcome Modal - mounted and controlled by showSubmitModal */}
      <SubmitOutcomeModal
        isOpen={Boolean(myApplication) && showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        applicationId={myApplication?.id || ""}
        onSuccess={handleApplicationUpdate}
        isResubmit={Boolean(
          myApplication && (myApplication as any).status === "needs_revision"
        )}
        // profileId={currentAccount?.address || ""}
        // rewardPoints={task.rewardPoints}
        // reputationScore={1}
      />
      {/* Post Rate Modal - mounted and controlled by ratingAppId */}
      <PostRateModal
        isOpen={!!ratingAppId}
        onClose={() => setRatingAppId(null)}
        applicationId={ratingAppId ?? ""}
        onSuccess={() => {
          setRatingAppId(null);
          handleApplicationUpdate(); // reload danh sách
        }}
      />
    </>
  );
};

export default TaskDetailModal;
