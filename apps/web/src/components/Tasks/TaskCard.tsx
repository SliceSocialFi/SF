import { TrashIcon, MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Card, H5 } from "@/components/Shared/UI";
import { formatRelativeTime, formatFullDateTime } from "@/utils/dateFormatter";

interface TaskOwner {
  id: string;
  name: string;
  avatar?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface TaskApplicant {
  walletAddress?: string;
  username?: string;
  avatar?: string;
  level?: number;
  appliedAt?: string;
  id?: string;
  applicant?: string;
  applicantProfileId?: string;
}

export interface TaskItem {
  id: string;
  companyLogo: string;
  companyName: string;
  jobTitle: string;
  description: string;
  skills: string[];
  location: string;
  salary: string;
  postedDays: number;
  owner: TaskOwner;
  rewardTokens: number;
  employerName?: any;
  employerProfileId?: string;
  employerAvatar?: string;
  freelancerProfileId?: string | null;
  title: string;
  rewardPoints?: number;
  createdAt?: string;
  deadline?: string;
  objective?: string;
  deliverables?: string;
  acceptanceCriteria?: string;
  status: "open" | "in_review" | "in_progress" | "completed" | "cancelled";
  assigneeId?: string;
  applicants: TaskApplicant[];
}

interface TaskCardProps {
  task: TaskItem;
  showDelete?: boolean;
  onDelete?: (taskId: string, event: React.MouseEvent) => void;
}

const TaskCard = ({ task, showDelete = false, onDelete }: TaskCardProps) => {
  return (
    <Card className="cursor-pointer gap-4 p-4 transition-shadow hover:shadow-md">
      {/* Main content */}
      <div className="space-y-3">
        {/* Top row: Avatar + Name + Time + Delete Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-sm text-white">
              {task.employerAvatar && (
                <img
                  src={task.employerAvatar}
                  alt={task.employerName}
                  className="h-10 w-10 rounded-full"
                />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm dark:text-white">
                {task.employerName || "Unknown"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
              <ClockIcon className="h-4 w-4" />
              <span
                title={
                  task.createdAt
                    ? formatFullDateTime(task.createdAt)
                    : undefined
                }
              >
                {task.createdAt
                  ? formatRelativeTime(task.createdAt)
                  : task.postedDays +
                    (task.postedDays > 1 ? " days ago" : " day ago")}
              </span>
            </div>
            {showDelete && task.status === "open" && onDelete && (
              <button
                onClick={(e) => onDelete(task.id, e)}
                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                title="Delete task"
                type="button"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <H5 className="text-gray-900 dark:text-white">
          {task.title || task.jobTitle}
        </H5>

        {/* Status Badge */}
        {task.status && (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                task.status === "open"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : task.status === "in_progress"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : task.status === "completed"
                  ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  : task.status === "in_review"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              }`}
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
        )}

        {/* Objective (if available) */}
        {task.objective && (
          <div className="text-gray-600 text-sm leading-relaxed dark:text-gray-300">
            {task.objective && task.objective.length > 200
              ? `${task.objective.slice(0, 200)}...`
              : task.objective}
          </div>
        )}

        {/* Description (fallback if no objective) */}
        {!task.objective && task.description && (
          <div className="text-gray-600 text-sm leading-relaxed dark:text-gray-300">
            {task.description}
          </div>
        )}

        {/* Skills */}
        {task.skills && task.skills.length > 0 && (
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
        )}

        {/* Location and Salary */}
        {(task.location || task.salary) && (
          <div className="flex items-center gap-4 pt-2">
            {task.location && (
              <div className="flex items-center gap-1 text-gray-600 text-sm dark:text-gray-400">
                <MapPinIcon className="h-4 w-4" />
                <span>{task.location}</span>
              </div>
            )}
            {task.salary && (
              <div className="font-medium text-gray-900 text-sm dark:text-white">
                {task.salary}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
