import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, H5, H6, Modal, Tabs } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import PageLayout from "../Shared/PageLayout";
import NumberedStat from "../Shared/NumberedStat";
import NewTask from "./NewTask";
import TaskCard, { type TaskItem } from "./TaskCard";
import TasksShimmer from "./TasksShimmer";
import { TaskFeedType, filterTasksByTab, getEmptyStateMessage } from "./taskFilters";
import { apiClient } from "@/lib/apiClient";

let mockTasks: TaskItem[] = [];

const TaskDetailModal = ({
  task,
  isOpen,
  onClose
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isAcceptingApplicant, setIsAcceptingApplicant] = useState<
    string | null
  >(null);
  const { currentAccount } = useAccountStore();

  if (!task) return null;

  const isOwner = task.owner.id === currentAccount?.address;
  const hasApplied = task.applicants.some(
    (applicant) => applicant.walletAddress === currentAccount?.address
  );

  const handleApplyForTask = async () => {
    if (!isAgreementAccepted || !currentAccount) {
      return;
    }

    setIsApplying(true);
    try {
      // Ensure applicant user exists on backend (db has FK to users.profileId)
      const applicantProfileId = currentAccount.address;
      try {
        await apiClient.getUser(applicantProfileId);
      } catch (err: any) {
        // If user not found (404), create it silently so FK constraint won't fail
        if (err?.status === 404) {
          await apiClient.createUser({ profileId: applicantProfileId });
        } else {
          throw err;
        }
      }

      // Call backend to create application
      // Pass applicantProfileId (currentAccount.address) so backend receives
      // { taskId, applicantProfileId, coverLetter }
      await apiClient.applyForTask(task.id, undefined, applicantProfileId);
        toast.success("Application submitted");
        // Close modal after applying
        onClose();
    } catch (error) {
      console.error("Failed to apply for task:", error, (error as any)?.body);
      const msg = (error as any)?.body?.message || (error as any)?.body?.error || (error as any)?.message || "Failed to apply for task";
      toast.error(msg);
    } finally {
      setIsApplying(false);
    }
  };

  const handleAcceptApplicant = async (applicantWalletAddress: string) => {
    setIsAcceptingApplicant(applicantWalletAddress);
    try {
      // Backend likely requires application id. Try to find application id from applicants list
      const application = task.applicants.find((a: any) => a.walletAddress === applicantWalletAddress || a.applicant === applicantWalletAddress);
      if (!application || !application.id) {
        console.error('No application id found for applicant', applicantWalletAddress);
        toast.error('Unable to accept applicant: missing application id');
        return;
      }
      await apiClient.acceptApplication(application.id);
      toast.success('Applicant accepted');
        onClose();
    } catch (error) {
      console.error("Failed to accept applicant:", error);
      toast.error('Failed to accept applicant');
    } finally {
      setIsAcceptingApplicant(null);
    }
  };

  const handleViewProfile = (walletAddress: string) => {
    // Navigate to user profile page
    console.log("Navigate to profile:", walletAddress);
    // You would use your routing logic here
  };

  return (
    <Modal onClose={onClose} show={isOpen} size="lg" title="Task Details">
      <div className="space-y-6 p-6">
        {/* Task Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-lg text-white">
              {task.companyLogo}
            </div>
            <div>
              <H5 className="text-gray-900 dark:text-white">{task.title || task.jobTitle}</H5>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {task.companyName || task.employerProfileId || ""}
              </p>
              {(task.createdAt || task.deadline) && (
                <div className="mt-1 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                  {task.createdAt && (
                    <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                  )}
                  {task.deadline && (
                    <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-gray-600 text-sm leading-relaxed dark:text-gray-300">
            {task.description}
          </div>

          <div className="flex flex-wrap gap-2">
            {task.skills.map((skill, index) => (
              <span
                className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300"
                key={index}
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-600 text-sm dark:text-gray-400">
              <MapPinIcon className="h-4 w-4" />
              <span>{task.location}</span>
            </div>
            <div className="font-medium text-gray-900 text-sm dark:text-white">
              {task.salary}
            </div>
          </div>
        </div>

        {/* Task Agreement Section */}
        {(task.objective || task.deliverables || task.acceptanceCriteria) && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <H5 className="mb-4 text-gray-900 dark:text-white">
              Work Agreement
            </H5>
            <div className="space-y-4">
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
          </div>
        )}

        {/* Owner Info */}
        {/* <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-sm text-white">
              {task.owner.avatar}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {task.owner.name}
              </p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Task Owner
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 text-sm dark:text-gray-300">
                {task.owner.contact?.email || "—"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 text-sm dark:text-gray-300">
                {task.owner.contact?.phone || "—"}
              </span>
            </div>
          </div>
        </div> */}

        {/* Reward Info */}
        <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-6 w-6 text-brand-500" />
            <div>
              <p className="font-medium text-brand-600 dark:text-brand-400">
                Completion Reward
              </p>
              <p className="font-bold text-2xl text-brand-600 dark:text-brand-400">
                {(task.rewardPoints ?? task.rewardTokens) || 0} points
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Checkbox */}
        {(task.objective || task.deliverables || task.acceptanceCriteria) && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                checked={isAgreementAccepted}
                className="mt-1 h-4 w-4 rounded border-gray-300 bg-gray-100 text-brand-600 focus:ring-2 focus:ring-brand-500"
                onChange={(e) => setIsAgreementAccepted(e.target.checked)}
                type="checkbox"
              />
              <span className="text-gray-700 text-sm dark:text-gray-300">
                I have read and agree to the terms of the Work Agreement.
              </span>
            </label>
          </div>
        )}

        {/* Applicant List (for task owners) */}
        {isOwner && task.applicants.length > 0 && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <H5 className="mb-4 text-gray-900 dark:text-white">Applicants</H5>
            <div className="space-y-3">
              {task.applicants.map((applicant, applicantIndex) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  key={
                    applicant.walletAddress || applicant.id || applicant.applicant || applicantIndex
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-sm text-white">
                      {applicant.avatar || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm dark:text-white">
                        {applicant.username || "Anonymous"}
                      </p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">
                        Level {applicant.level} • Applied {applicant.appliedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewProfile(applicant.walletAddress)}
                      outline
                      size="sm"
                    >
                      View Profile
                    </Button>
                    <Button
                      disabled={!!isAcceptingApplicant}
                      loading={isAcceptingApplicant === applicant.walletAddress}
                      onClick={() =>
                        handleAcceptApplicant(applicant.walletAddress)
                      }
                      size="sm"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Status Info */}
        {task.status === "in_progress" && task.assigneeId && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-sm text-white">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    Task Assigned
                  </p>
                  <p className="text-blue-500 text-sm dark:text-blue-300">
                    This task is currently in progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isOwner && (
          <div className="flex gap-3 pt-4">
            {hasApplied ? (
              <Button className="flex-1" disabled>
                Application Submitted
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={
                  !isAgreementAccepted &&
                  !!(
                    task.objective ||
                    task.deliverables ||
                    task.acceptanceCriteria
                  )
                }
                loading={isApplying}
                onClick={handleApplyForTask}
              >
                Apply for Task
              </Button>
            )}
            <Button className="flex-1" onClick={onClose} outline>
              Close
            </Button>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={onClose} outline>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

import {
  useAccountQuery
} from "@slice/indexer";
import { request } from "https";

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(mockTasks);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskFeedType>(TaskFeedType.All);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const { currentAccount } = useAccountStore();

  const TASKS_PER_PAGE = 5;

  // Filter tasks based on active tab
  const filteredTasks = filterTasksByTab(tasks, activeTab, currentAccount?.address);

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    currentPage * TASKS_PER_PAGE,
    (currentPage + 1) * TASKS_PER_PAGE
  );

  const { data, error, fetchMore } =  useAccountQuery({
    skip: !tasks,
    variables: { 
      request: {
        address: tasks[0]?.employerProfileId
      }
    }
  });

  const getUsernameByProfileId = async (profileId: string) => {
    const data = await fetchMore({
      variables: {
        request: {
          address: profileId
        }
      }
    });
    if (error) {
      console.error("Error fetching account data:", error);
      return null;
    }
    console.log("data", data);
    return data?.data?.account?.metadata?.name;
  }

  const fetchTasks = async () => {
    try {
      const res = await apiClient.listTasks();
      // Attempt to map server task shape to local TaskItem
      const mapped = (res || []).map(async (t: any) => {
        // Calculate days since created
        let postedDays = 0;
        if (t.createdAt) {
          const createdDate = new Date(t.createdAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
          postedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        const employerName = await getUsernameByProfileId(t.employerProfileId);
        return {
          id: t.id || t.taskId,
          companyLogo: t.companyLogo || t.company?.logo || "",
          companyName: t.companyName || t.company?.name || t.ownerName || "",
          jobTitle: t.title || t.jobTitle,
          description: t.description || t.summary || "",
          skills: t.skills || [],
          location: t.location || "",
          salary: t.salary || "",
          postedDays,
          owner: t.owner || { id: t.ownerId || t.ownerProfileId, name: t.ownerName || "" },
          rewardTokens: t.rewardPoints || t.rewardTokens || 0,
          employerName: employerName || "",
          employerProfileId: t.employerProfileId || t.ownerProfileId || t.ownerId,
          freelancerProfileId: t.freelancerProfileId ?? null,
          title: t.title,
          rewardPoints: t.rewardPoints || t.rewardTokens || 0,
          createdAt: t.createdAt,
          deadline: t.deadline,
          objective: t.objective,
          deliverables: t.deliverables,
          acceptanceCriteria: t.acceptanceCriteria,
          status: t.status || "open",
          assigneeId: t.assigneeId,
          applicants: t.applications || t.applicants || []
        } as TaskItem;
      });

      // Sort by createdAt descending (newest first)
      const sorted = await Promise.all(mapped).then((resolved) =>
        resolved.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
      );

      setTasks(sorted);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };


  // Reset to page 0 when tab changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  useEffect(() => {
    const load = async () => {
      fetchTasks();
    };

    load();
  }, []);

  const handleTaskClick = useCallback((task: TaskItem) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleDeleteTask = async (taskId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening modal when clicking delete
    
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setDeletingTaskId(taskId);
    try {
      await apiClient.deleteTask(taskId);
      toast.success("Task deleted successfully");
      // Remove task from local state
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      const msg = error?.body?.message || error?.message || "Failed to delete task";
      toast.error(msg);
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <PageLayout
      hideSearch
      sidebar={
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-10 text-sm placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              type="text"
              value={searchQuery}
            />
          </div>

          {/* New Task Button */}
          <NewTask onSubmit={setTasks} />

          {/* Reputation Card */}
          <Card className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                    <span className="text-xl text-yellow-600 dark:text-yellow-400">
                      ⭐
                    </span>
                  </div>
                  <H6 className="text-gray-900 dark:text-white">
                    My Reputation
                  </H6>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    70 / 100
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                    style={{ width: "70%" }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Keep completing tasks to reach 100!
                </p>
              </div>
            </div>
          </Card>

          {/* Reward Points Card */}
          <Card className="p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <span className="text-xl text-green-600 dark:text-green-400">
                      💎
                    </span>
                  </div>
                  <H6 className="text-gray-900 dark:text-white">
                    Reward Points
                  </H6>
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  10,000
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Total points earned
                </p>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            © 2025 Slice GitHub
          </div>
        </div>
      }
    >
      {/* Tabs navigation */}
          <Tabs
            active={activeTab}
            className="mx-5 mb-5 md:mx-0"
            layoutId="task_tabs"
            setActive={(type) => setActiveTab(type as TaskFeedType)}
            tabs={[
              { name: "Tasks List", type: TaskFeedType.All },
              { name: "My Tasks", type: TaskFeedType.MyTasks },
              { name: "Posted Tasks", type: TaskFeedType.PostedTasks }
            ]}
          />
        <div className="space-y-6">
          <div className="space-y-4">
            {loading ? (
              <TasksShimmer count={5} />
            ) : (
              filteredTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <p className="mb-2 font-medium">No tasks found.</p>
                  <p className="text-sm">{getEmptyStateMessage(activeTab)}</p>
                </div>
              ) : (
                paginatedTasks.map((task) => (
                  <div key={task.id} onClick={() => handleTaskClick(task)}>
                    <TaskCard 
                      task={task}
                      showDelete={activeTab === TaskFeedType.PostedTasks}
                      onDelete={handleDeleteTask}
                    />
                  </div>
                ))
              )
            )}
          </div>

          {filteredTasks.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <ChevronLeftIcon className="size-5" />
                Previous
              </button>
              
              <span className="text-gray-600 text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                Next
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          )}
        </div>

        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
        />
    </PageLayout>
  );
};

export default Tasks;