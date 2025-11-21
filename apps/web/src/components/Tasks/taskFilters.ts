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
        (task) => task.employerProfileId === currentUserAddress.toLowerCase()
      );

    case TaskFeedType.MyTasks:
      // Show tasks where user has applied or is assigned
      // console.log("currentUserAddress", currentUserAddress.toLowerCase());
      // console.log("tasks", tasks);
      // let taskData = tasks.filter(
      //   (task) => {
      //     task.applicants.some(
      //       (applicant) => {
      //         return applicant.applicantProfileId === currentUserAddress.toLowerCase();
      //       }
      //     )
      //   }
      // );

      let taskData: TaskItem[] = [];
      tasks.forEach((task) => {
        task.applicants.forEach((applicant) => {
          // console.log("applicant", applicant.applicantProfileId === currentUserAddress?.toLowerCase());
          if (applicant.applicantProfileId === currentUserAddress?.toLowerCase()) {
            taskData.push(task);
            return;
          }
        });
      });

      // console.log("taskData", taskData);
      return taskData;
          // task.applicants.some(
          //   (applicant) => applicant.walletAddress === currentUserAddress.toLowerCase()
          //  ) //|| task.assigneeId === currentUserAddress.toLowerCase()

    case TaskFeedType.All:
      return tasks.filter(
        (task) => task.status === "open"
      )
    default:
      // Show all tasks
      return tasks.filter(
        (task) => task.status === "open"
      );
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
