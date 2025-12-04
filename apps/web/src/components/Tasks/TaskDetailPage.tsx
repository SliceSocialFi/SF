import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Card, H3, H5, Spinner } from "@/components/Shared/UI";
import PageLayout from "@/components/Shared/PageLayout";
import { apiClient } from "@/lib/apiClient";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { toast } from "sonner";
import ApplicationList from "./Applications/ApplicationList";
import ApplyModal from "./Applications/ApplyModal";
import SubmitOutcomeModal from "./Applications/SubmitOutcomeModal";
import PostRateModal from "./Applications/PostRateModal";
import type { TaskItem } from "./TaskCard";

/**
 * TaskDetailPage - Full page view for task details
 * Accessed via /tasks/:taskId route
 * Fetches task data from GET /tasks/:id API
 */
const TaskDetailPage = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentAccount } = useAccountStore();
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [ratingAppId, setRatingAppId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch task details
  const {
    data: taskData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["task", taskId, refreshKey],
    queryFn: async () => {
      if (!taskId) throw new Error("Task ID is required");
      return await apiClient.getTask(taskId);
    },
    enabled: !!taskId,
    staleTime: 30000,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load task details");
      console.error("Task fetch error:", error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <PageLayout title="Loading Task...">
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      </PageLayout>
    );
  }

  if (!taskData) {
    return (
      <PageLayout title="Task Not Found">
        <Card className="p-8 text-center">
          <H3 className="mb-4 text-gray-900 dark:text-white">Task Not Found</H3>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            The task you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/tasks")}
            className="rounded-lg bg-brand-600 px-6 py-2 font-medium text-white transition-colors hover:bg-brand-700"
            type="button"
          >
            Back to Tasks
          </button>
        </Card>
      </PageLayout>
    );
  }

  // Parse task data (backend returns task + applications)
  const task: TaskItem = {
    id: taskData.id,
    title: taskData.title,
    description: taskData.description,
    objective: taskData.objective,
    deliverables: taskData.deliverables,
    acceptanceCriteria: taskData.acceptanceCriteria,
    skills: taskData.skills || [],
    location: taskData.location || "",
    salary: taskData.salary || "",
    status: taskData.status,
    rewardPoints: taskData.rewardPoints,
    rewardTokens: taskData.rewardPoints || 0,
    employerProfileId: taskData.employerProfileId,
    freelancerProfileId: taskData.freelancerProfileId,
    createdAt: taskData.createdAt,
    deadline: taskData.deadline,
    applicants: taskData.applications || [],
    // Legacy fields for compatibility
    companyLogo: "",
    companyName: "",
    jobTitle: taskData.title,
    postedDays: 0,
    employerName: taskData.employerName || "",
    employerAvatar: taskData.employerAvatar || "",
    owner: {
      id: taskData.employerProfileId,
      name: taskData.employerName || "",
    },
  };

  // Check if deadline has passed
  const isDeadlinePassed = task.deadline
    ? new Date() > new Date(task.deadline)
    : false;

  const isOwner =
    task.employerProfileId?.toLowerCase() ===
    currentAccount?.address?.toLowerCase();

  const hasApplied = task.applicants.some(
    (applicant) =>
      applicant.applicantProfileId === currentAccount?.address.toLowerCase()
  );

  const myApplication = task.applicants.find(
    (applicant) =>
      applicant.applicantProfileId === currentAccount?.address.toLowerCase()
  );

  const canSubmitOutcome =
    myApplication &&
    ((myApplication as any).status === "accepted" ||
      (myApplication as any).status === "needs_revision");

  const handleApplicationUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeRemaining = (deadlineInput: string | number | Date) => {
    // Debug: Uncomment to see exact input data
    // console.log("DeadlineInput:", deadlineInput, typeof deadlineInput);

    try {
      let deadline: Date;

      if (deadlineInput instanceof Date) {
        deadline = deadlineInput;
      }
      // Handle Unix Timestamp (number or numeric string)
      // Use regex /^\d+$/ to ensure it only contains digits
      else if (
        typeof deadlineInput === "number" ||
        (typeof deadlineInput === "string" && /^\d+$/.test(deadlineInput))
      ) {
        const timestamp = Number(deadlineInput);
        // Check seconds vs milliseconds
        if (timestamp < 100000000000) {
          deadline = new Date(timestamp * 1000);
        } else {
          deadline = new Date(timestamp);
        }
      }
      // Handle date strings (ISO, SQL format...)
      else {
        let dateString = String(deadlineInput);

        // 🔥 CRITICAL FIX: Handle SQL format "YYYY-MM-DD HH:mm:ss"
        // Replace space with 'T' so new Date() can parse it correctly
        if (dateString.includes(" ") && !dateString.includes("T")) {
          dateString = dateString.replace(" ", "T");
          // If timezone is missing (no Z or +), may need to add 'Z' to treat as UTC
          // dateString += "Z";
        }

        deadline = new Date(dateString);
      }

      // Validate date
      if (Number.isNaN(deadline.getTime())) {
        console.error("Invalid deadline parsed from:", deadlineInput);
        return "invalid date";
      }

      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs <= 0) return "expired";

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
      return "invalid date";
    }
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

  return (
    <PageLayout title={task.title}>
      <div className="space-y-4 px-3">
        {/* Back Button */}
        <button
          onClick={() => navigate("/tasks")}
          className="group flex items-center gap-2 text-gray-600 text-sm transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Tasks
        </button>

        {/* Task Header Card */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              {/* Title */}
              <H3 className="text-gray-900 dark:text-white">{task.title}</H3>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                {task.createdAt && (
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Posted {formatDate(task.createdAt)}</span>
                  </div>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>
                      Deadline {formatDate(task.deadline)}
                      {!isDeadlinePassed && (
                        <span className="ml-2 text-blue-600 dark:text-blue-400">
                          ({formatTimeRemaining(task.deadline)})
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {task.location && (
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{task.location}</span>
                  </div>
                )}
              </div>

              {/* Skills */}
              {task.skills && task.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {task.skills.map((skill, index) => (
                    <span
                      className="rounded-full bg-brand-100 px-3 py-1 text-brand-700 text-xs font-medium dark:bg-brand-900/30 dark:text-brand-300"
                      key={index}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {task.status === "open"
                ? "Open"
                : task.status === "in_progress"
                ? "In Progress"
                : task.status === "completed"
                ? "Completed"
                : task.status === "in_review"
                ? "In Review"
                : "Cancelled"}
            </span>
          </div>
        </Card>

        {/* Task Details Card */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Description */}
            {task.description && (
              <div>
                <H5 className="mb-2 text-gray-900 dark:text-white">
                  Description
                </H5>
                <p className="whitespace-pre-wrap text-gray-600 text-sm leading-relaxed dark:text-gray-300">
                  {task.description}
                </p>
              </div>
            )}

            {/* Objective */}
            {task.objective && (
              <div>
                <H5 className="mb-2 text-gray-900 dark:text-white">
                  Objective
                </H5>
                <p className="whitespace-pre-wrap text-gray-600 text-sm leading-relaxed dark:text-gray-300">
                  {task.objective}
                </p>
              </div>
            )}

            {/* Deliverables */}
            {task.deliverables && (
              <div>
                <H5 className="mb-2 text-gray-900 dark:text-white">
                  Deliverables
                </H5>
                <p className="whitespace-pre-wrap text-gray-600 text-sm leading-relaxed dark:text-gray-300">
                  {task.deliverables}
                </p>
              </div>
            )}

            {/* Acceptance Criteria */}
            {task.acceptanceCriteria && (
              <div>
                <H5 className="mb-2 text-gray-900 dark:text-white">
                  Acceptance Criteria
                </H5>
                <p className="whitespace-pre-wrap text-gray-600 text-sm leading-relaxed dark:text-gray-300">
                  {task.acceptanceCriteria}
                </p>
              </div>
            )}

            {/* Deadline Warning */}
            {isDeadlinePassed && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="font-medium text-red-700 text-sm dark:text-red-400">
                  ⚠️ This task's deadline has passed
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Applications Section */}
        <Card className="p-6">
          <H5 className="mb-4 text-gray-900 dark:text-white">
            Applications ({task.applicants.length})
          </H5>
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
        </Card>

        {/* Action Buttons */}
        {!isOwner && task.status === "open" && !isDeadlinePassed && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowApplyModal(true)}
              disabled={hasApplied}
              className="flex-1 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {hasApplied ? "Already Applied" : "Apply for Task"}
            </button>
          </div>
        )}

        {/* Submit Work Button */}
        {canSubmitOutcome && !isDeadlinePassed && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex-1 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
              type="button"
            >
              {(myApplication as any).status === "needs_revision"
                ? "Resubmit Work"
                : "Submit Work"}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onSuccess={handleApplicationUpdate}
      />

      <SubmitOutcomeModal
        isOpen={Boolean(myApplication) && showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        applicationId={myApplication?.id || ""}
        onSuccess={handleApplicationUpdate}
        isResubmit={Boolean(
          myApplication && (myApplication as any).status === "needs_revision"
        )}
      />

      <PostRateModal
        isOpen={!!ratingAppId}
        onClose={() => setRatingAppId(null)}
        applicationId={ratingAppId ?? ""}
        onSuccess={() => {
          setRatingAppId(null);
          handleApplicationUpdate();
        }}
      />
    </PageLayout>
  );
};

export default TaskDetailPage;
