import type { TaskItem } from "./TaskCard";

export enum TaskFeedType {
  All = "all",
  MyTasks = "my-tasks",
  PostedTasks = "posted-tasks"
}

export const filterTasksByTab = (
  tasks: TaskItem[],
  activeTab: TaskFeedType,
  currentUserAddress?: string
): TaskItem[] => {
  if (!currentUserAddress) {
    return activeTab === TaskFeedType.All ? tasks : [];
  }

  switch (activeTab) {
    case TaskFeedType.PostedTasks:
      // Show tasks created by current user
      return tasks.filter(
        (task) => task.employerProfileId === currentUserAddress
      );

    case TaskFeedType.MyTasks:
      // Show tasks where user has applied or is assigned
      return tasks.filter(
        (task) =>
          task.applicants.some(
            (applicant) => applicant.walletAddress === currentUserAddress
          ) || task.assigneeId === currentUserAddress
      );

    case TaskFeedType.All:
    default:
      // Show all tasks
      return tasks;
  }
};

export const getEmptyStateMessage = (activeTab: TaskFeedType): string => {
  switch (activeTab) {
    case TaskFeedType.PostedTasks:
      return "You haven't posted any tasks yet.";
    case TaskFeedType.MyTasks:
      return "You haven't applied to any tasks yet.";
    case TaskFeedType.All:
    default:
      return "Create the first task agreement to get started.";
  }
};
