import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Card, H5, H6, Modal, Tabs } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import { useThemeModalStore } from "@/store/non-persisted/modal/useThemeModalStore";
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
import StickyFeedBar from "../Home/StickyFeedbar";

let mockTasks: TaskItem[] = [];

import { useAccountQuery } from "@slice/indexer";
import { userInfo } from "os";
import ProfileCard from "@/components/Profile/ProfileCard";
import MobileHeader from "@/components/Shared/MobileHeader";

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>(mockTasks);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskFeedType>(TaskFeedType.All);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const { currentAccount } = useAccountStore();
  const { show: showMobileDrawer } = useMobileDrawerModalStore();
  const { show: showThemeModal } = useThemeModalStore();
  interface User {
    profileId: string;
    username?: string;
    professionalRoles?: string[];
    reputationScore: number;
    rewardPoints: number;
    level: number;
    isWarned?: boolean;
    isBanned?: boolean;
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
    
    return {
      name: data?.data?.account?.metadata?.name,
      avatar: data?.data?.account?.metadata?.picture || "",
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
        console.log("Mapped task:", t)
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
          isWarned: data?.isWarned || false,
          isBanned: data?.isBanned || false,
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

  const handleTaskUpdated = useCallback((updatedTask: TaskItem) => {
    // Update the selectedTask with fresh data from backend
    setSelectedTask(updatedTask);
    // Also update it in the tasks list
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
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
      showProfileCard={false}
      sidebar={
        <div className="space-y-5 pt-1">
          {/* Search Bar - Desktop Only */}
          <div className="hidden md:block relative search-wrap">
            <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
            <input
              className="relative z-10 w-full bg-transparent py-3 pr-3 pl-10 text-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white border-none outline-none focus:ring-0"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              type="text"
              value={searchQuery}
            />
          </div>
          {/* ProfileCard */}
          <ProfileCard variant="tasks" />
          {/* New Task Button */}
          <div className="pt-4">
            <NewTask onSubmit={fetchTasks} />
          </div>

          {/* Footer */}
          <div className="pt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            © 2025 Slice GitHub
          </div>
        </div>
      }
    >
      {/* Tabs navigation */}
      {!showMobileDrawer && (
        <StickyFeedBar
          header={<MobileHeader searchPlaceholder="Search tasks..." />}
          tabs={
            <div className="px-5 md:px-0">
              <Tabs
                active={activeTab}
                className="mb-0"
                layoutId="task_tabs"
                setActive={(type) => setActiveTab(type as TaskFeedType)}
                tabs={[
                  { name: "Tasks List", type: TaskFeedType.All },
                  { name: "My Tasks", type: TaskFeedType.MyTasks },
                  { name: "Posted Tasks", type: TaskFeedType.PostedTasks },
                ]}
              />
            </div>
          }
        />
      )}

      <div className="space-y-6">
        {/* Banned Warning Banner */}
        {user?.isBanned && (
          <div className="mx-3 rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <NoSymbolIcon className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-300">
                  Tài khoản đã bị khóa
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  Điểm uy tín của bạn đã giảm xuống dưới 30. Bạn không thể tạo
                  task mới hoặc ứng tuyển vào các task. Vui lòng liên hệ hỗ trợ
                  để được giải quyết.
                </p>
                <p className="mt-2 text-xs text-red-600 dark:text-red-500">
                  Điểm uy tín hiện tại: {user.reputationScore}/100
                </p>
              </div>
            </div>
          </div>
        )}

         {/* Warning Banner (only show if not banned) */}
        {user?.isWarned && !user?.isBanned && (
          <div className="mx-3 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Điểm uy tín thấp
                </h4>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                  Điểm uy tín của bạn đang ở mức thấp (dưới 70). Nếu tiếp tục
                  giảm xuống dưới 30, tài khoản sẽ bị khóa và không thể sử dụng
                  các tính năng task.
                </p>
                <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
                  Điểm uy tín hiện tại: {user.reputationScore}/100
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 px-3">
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
              className="flex items-center gap-1 rounded-lg border border-transparent hover:border-[var(--primary)] px-4 py-2 font-medium text-sm disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              <ChevronLeftIcon className="size-5" />
              Previous
            </button>

            <span className="text-gray-50 text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
              disabled={currentPage >= totalPages - 1}
              className="flex items-center gap-1 rounded-lg border border-transparent hover:border-[var(--primary)] px-4 py-2 font-medium text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Floating Action Button for Mobile */}
      {!showMobileDrawer && !showThemeModal && (
        <button
          className="fixed right-5 bottom-20 z-50 flex size-14 items-center justify-center rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-lg transition-all hover:scale-110 active:scale-95 md:hidden"
          onClick={() => setIsNewTaskModalOpen(true)}
          type="button"
          aria-label="Create new task"
        >
          <PlusIcon className="size-6 text-white stroke-[2.5]" />
        </button>
      )}

      {/* Modal for creating new task (controlled by FAB on mobile) */}
      {isNewTaskModalOpen && (
        <NewTask
          onSubmit={fetchTasks}
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
        />
      )}
    </PageLayout>
  );
};

export default Tasks;
