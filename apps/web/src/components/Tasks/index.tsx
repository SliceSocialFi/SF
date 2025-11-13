import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, H5, H6, Modal, Tabs } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import PageLayout from "../Shared/PageLayout";
import NewTask from "./NewTask";
import TaskCard, { type TaskItem } from "./TaskCard";
import TasksShimmer from "./TasksShimmer";
import {
  TaskFeedType,
  filterTasksByTab,
  getEmptyStateMessage,
} from "./taskFilters";
import { apiClient } from "@/lib/apiClient";
import TaskDetailModal from "./TaskDetailModal";

let mockTasks: TaskItem[] = [];

import { useAccountQuery } from "@slice/indexer";
import { userInfo } from "os";

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
  interface User {
    profileId: string;
    username?: string;
    professionalRoles?: string[];
    reputationScore: number;
    rewardPoints: number;
    level: number;
    createdAt: string;
  }
  const [user, setUser] = useState<User | null>(null);

  const TASKS_PER_PAGE = 5;

  // Filter tasks based on active tab
  const filteredTasks = filterTasksByTab(
    tasks,
    activeTab,
    currentAccount?.address
  );

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    currentPage * TASKS_PER_PAGE,
    (currentPage + 1) * TASKS_PER_PAGE
  );

  const { error, fetchMore } = useAccountQuery({
    skip: !tasks,
    variables: {
      request: {
        address: tasks[0]?.employerProfileId,
      },
    },
  });

  const getUsernameByProfileId = async (profileId: string) => {
    const data = await fetchMore({
      variables: {
        request: {
          address: profileId,
        },
      },
    });
    if (error) {
      console.error("Error fetching account data:", error);
      return null;
    }
    console.log("data", data);
    return {
      name: data?.data?.account?.metadata?.name,
      avatar: data?.data?.account?.metadata?.picture,
    };
  };

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

        const metadata = await getUsernameByProfileId(t.employerProfileId);
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
          owner: t.owner || {
            id: t.ownerId || t.ownerProfileId,
            name: t.ownerName || "",
          },
          rewardTokens: t.rewardPoints || t.rewardTokens || 0,
          employerName: metadata?.name || "",
          employerAvatar: metadata?.avatar || "",
          employerProfileId:
            t.employerProfileId || t.ownerProfileId || t.ownerId,
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
          applicants: t.applications || t.applicants || [],
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (!currentAccount?.address) return;
        const profileId = currentAccount.address;
        const data = await apiClient.getUser(profileId);
        // normalized response to match User interface loosely
        setUser({
          profileId: data?.profileId || profileId,
          username: data?.username || data?.handle || undefined,
          professionalRoles: data?.professionalRoles || [],
          reputationScore:
            typeof data?.reputationScore === "number"
              ? data.reputationScore
              : Number(data?.reputation) || 0,
          rewardPoints:
            typeof data?.rewardPoints === "number"
              ? data.rewardPoints
              : Number(data?.points) || 0,
          level: Number(data?.level) || 0,
          createdAt: data?.createdAt || new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to load user profile", err);
      }
    };
    loadUser();
  }, [currentAccount]);

  // Reset to page 0 when tab changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  const reputation = user?.reputationScore ?? 0;
  const rewardPoints = user?.rewardPoints ?? 0;
  const progressWidth = Math.min(100, Math.max(0, reputation));

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
      const msg =
        error?.body?.message || error?.message || "Failed to delete task";
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
                    {reputation}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                    style={{ width: `${progressWidth}%` }}
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
                  {rewardPoints.toLocaleString()}
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
          { name: "Posted Tasks", type: TaskFeedType.PostedTasks },
        ]}
      />
      <div className="space-y-6">
        <div className="space-y-4">
          {loading ? (
            <TasksShimmer count={5} />
          ) : filteredTasks.length === 0 ? (
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
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
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
