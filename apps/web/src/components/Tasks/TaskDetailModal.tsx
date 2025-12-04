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
import DeadlineInput from "./DeadlineInput";
import { ERC20_TOKEN_SYMBOL } from "@slice/data/constants";

const TaskDetailModal = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: TaskItem) => void;
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
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [isExtending, setIsExtending] = useState(false);

  if (!task) return null;

  // Check if deadline has passed
  const isDeadlinePassed = task.deadline
    ? new Date() > new Date(task.deadline)
    : false;

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

  // Check if escrow is already settled (task completed or cancelled)
  const isEscrowSettled =
    task.status === "completed" || task.status === "cancelled";

  // Logic to determine who can release funds after deadline
  const getDeadlineActionState = () => {
    // If escrow already settled, no action needed
    if (isEscrowSettled) {
      return {
        canClaim: false,
        message: null,
        actionType: "SETTLED",
        recipientAddress: null,
        shouldAutoCancel: false,
      };
    }

    if (!isDeadlinePassed)
      return {
        canClaim: false,
        message: null,
        actionType: null,
        recipientAddress: null,
        shouldAutoCancel: false,
      };

    const isEmployer =
      currentAccount?.address?.toLowerCase() ===
      task.employerProfileId?.toLowerCase();
    const isFreelancer =
      task.freelancerProfileId &&
      currentAccount?.address?.toLowerCase() ===
        task.freelancerProfileId.toLowerCase();

    // Check if anyone was assigned (accepted)
    const hasAcceptedFreelancer = task.applicants.some(
      (app) =>
        (app as any).status === "accepted" ||
        (app as any).status === "in_progress" ||
        (app as any).status === "in_review" ||
        (app as any).status === "completed" ||
        (app as any).status === "needs_revision"
    );

    // CASE 0: No one was assigned before deadline
    // -> Task should be auto-cancelled (no escrow deposit made)
    if (!hasAcceptedFreelancer && !task.freelancerProfileId) {
      return {
        canClaim: false,
        actionType: "AUTO_CANCEL",
        recipientAddress: null,
        message:
          "Task deadline has passed with no freelancer assigned. This task will be automatically cancelled.",
        shouldAutoCancel: true,
      };
    }

    // Check if Freelancer has pending submission (in_review or submitted)
    const hasPendingSubmission = task.applicants.some(
      (app) =>
        (app as any).status === "in_review" ||
        ((app as any).status === "accepted" && (app as any).outcome)
    );

    // CASE A: Freelancer didn't submit (Deadline passed & No submission)
    // -> Employer can claim refund
    if (isEmployer && !hasPendingSubmission) {
      return {
        canClaim: true,
        actionType: "REFUND",
        recipientAddress: task.employerProfileId,
        message:
          "Freelancer did not submit work before deadline. You can claim refund.",
        shouldAutoCancel: false,
      };
    }

    // CASE B: Employer didn't respond (Deadline passed & Work submitted & Not approved)
    // -> Freelancer can claim payment
    if (isFreelancer && hasPendingSubmission) {
      return {
        canClaim: true,
        actionType: "CLAIM",
        recipientAddress: task.freelancerProfileId,
        message:
          "You submitted work but employer did not respond before deadline. You can claim payment.",
        shouldAutoCancel: false,
      };
    }

    // CASE C: User has no authority (Read-only view)
    return {
      canClaim: false,
      actionType: null,
      recipientAddress: null,
      message:
        "Task has passed deadline. Waiting for the other party to process fund release/refund.",
      shouldAutoCancel: false,
    };
  };

  const deadlineAction = getDeadlineActionState();

  // Auto-cancel task if deadline passed with no assigned freelancer
  const handleAutoCancel = async () => {
    if (!deadlineAction.shouldAutoCancel) return;

    try {
      await apiClient.updateTask(task.id, { status: "cancelled" });
      toast.info(
        "Task has been automatically cancelled (deadline passed, no freelancer assigned)"
      );
      onClose();
    } catch (err: any) {
      console.error("Failed to auto-cancel task", err);
      toast.error(err?.body?.message || "Failed to cancel task");
    }
  };

  // Extend deadline for task with no assigned freelancer
  const handleExtendDeadline = async () => {
    if (!newDeadline) {
      toast.error("Please select a new deadline");
      return;
    }

    setIsExtending(true);
    try {
      // 1. Update deadline on backend
      await apiClient.updateTask(task.id, {
        deadline: newDeadline,
      });

      // 2. Fetch fresh task data to ensure all state is current
      const freshTask = await apiClient.getTask(task.id);

      // 3. Parse fresh task data (same logic as TaskDetailPage)
      const updatedTaskData: TaskItem = {
        id: freshTask.id,
        title: freshTask.title,
        description: freshTask.description,
        objective: freshTask.objective,
        deliverables: freshTask.deliverables,
        acceptanceCriteria: freshTask.acceptanceCriteria,
        skills: freshTask.skills || [],
        location: freshTask.location || "",
        salary: freshTask.salary || "",
        status: freshTask.status,
        rewardPoints: freshTask.rewardPoints,
        rewardTokens: freshTask.rewardPoints || 0,
        employerProfileId: freshTask.employerProfileId,
        freelancerProfileId: freshTask.freelancerProfileId,
        createdAt: freshTask.createdAt,
        deadline: freshTask.deadline,
        applicants: freshTask.applications || [],
        companyLogo: "",
        companyName: "",
        jobTitle: freshTask.title,
        postedDays: 0,
        employerName: freshTask.employerName || "",
        employerAvatar: freshTask.employerAvatar || "",
        owner: {
          id: freshTask.employerProfileId,
          name: freshTask.employerName || "",
        },
      };

      // 4. Notify parent component to update selectedTask
      onTaskUpdated?.(updatedTaskData);

      toast.success("Task deadline extended successfully!");
      setShowExtendModal(false);
      setNewDeadline("");
      handleApplicationUpdate(); // Close modal after successful action
    } catch (err: any) {
      console.error("Failed to extend deadline", err);
      toast.error(err?.body?.message || "Failed to extend deadline");
    } finally {
      setIsExtending(false);
    }
  };

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
  // Hide Submit Work tab when deadline has passed
  if (canSubmitOutcome && !isDeadlinePassed) {
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
                      {task.rewardPoints} {ERC20_TOKEN_SYMBOL}
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

              {/* Deadline Passed Warning & Release Fund Action */}
              {isDeadlinePassed && !isEscrowSettled && (
                <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
                  <h6 className="mb-2 font-semibold text-orange-800 dark:text-orange-300">
                    ⚠️ Task Deadline Has Passed
                  </h6>
                  {deadlineAction.shouldAutoCancel ? (
                    <div className="space-y-3">
                      <p className="text-orange-700 text-sm dark:text-orange-200">
                        {deadlineAction.message}
                      </p>
                      {isOwner && task.status !== "cancelled" && (
                        <div className="rounded-lg border border-orange-300 bg-white p-3 dark:border-orange-700 dark:bg-gray-800">
                          <p className="mb-3 text-gray-600 text-sm dark:text-gray-400">
                            No escrow deposit was made since no freelancer was
                            assigned. You can extend the deadline to give more
                            time for applications.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              onClick={() => setShowExtendModal(true)}
                            >
                              Extend Deadline
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={handleAutoCancel}
                              loading={isCancelling}
                              outline
                            >
                              Cancel Task
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : deadlineAction.canClaim ? (
                    <div className="space-y-3">
                      <p className="text-orange-700 text-sm dark:text-orange-200">
                        {deadlineAction.message}
                      </p>
                      <div className="rounded-lg border border-orange-300 bg-white p-3 dark:border-orange-700 dark:bg-gray-800">
                        <p className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                          Action Type:{" "}
                          <span className="text-orange-600 dark:text-orange-400">
                            {deadlineAction.actionType}
                          </span>
                        </p>
                        <p className="mb-3 text-gray-600 text-xs dark:text-gray-400">
                          Funds will be released to:{" "}
                          {deadlineAction.recipientAddress?.slice(0, 10)}...
                          {deadlineAction.recipientAddress?.slice(-8)}
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => setActiveTab("applications")}
                        >
                          Go to Release Funds
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-orange-700 text-sm dark:text-orange-200">
                      {deadlineAction.message}
                    </p>
                  )}
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
              taskExternalId={task.id}
              taskRewardAmount={task.rewardPoints?.toString() || "100"}
              taskDeadline={task.deadline}
              employerAddress={task.employerProfileId}
              freelancerAddress={task.freelancerProfileId || undefined}
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

      {/* Extend Deadline Modal */}
      <Modal
        show={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setNewDeadline("");
        }}
        title="Extend Task Deadline"
        size="md"
      >
        <div className="p-6">
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-blue-800 text-sm dark:text-blue-200">
              <strong>Current Deadline:</strong>{" "}
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>

          <div className="mb-6">
            <DeadlineInput
              value={newDeadline}
              onChange={setNewDeadline}
              label="New Deadline"
              helper="Select a new deadline for this task"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => {
                setShowExtendModal(false);
                setNewDeadline("");
              }}
              outline
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendDeadline}
              loading={isExtending}
              disabled={isExtending || !newDeadline}
              type="button"
            >
              {isExtending ? "Extending..." : "Extend Deadline"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TaskDetailModal;
