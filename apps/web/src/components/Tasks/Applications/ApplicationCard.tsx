import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Card, Badge } from "@/components/Shared/UI";
import type { Application } from "@/types/task-api";

interface ApplicationCardProps {
  application: Application;
  showActions?: boolean;
  onAccept?: (id: string) => void;
  onApprove?: (id: string) => void;
  onRating?: (id: string) => void;
  onReject?: (id: string) => void;
  onRequestRevision?: (id: string) => void;
  onViewProfile?: (profileId: string) => void;
  onClick?: () => void;
}

const ApplicationCard = ({
  application,
  showActions = false,
  onAccept,
  onApprove,
  onRating,
  onReject,
  onRequestRevision,
  onViewProfile,
  onClick,
}: ApplicationCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "needs_revision":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "completed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (dateInput?: string | number | Date) => {
    if (!dateInput) return "N/A";

    let date: Date;

    try {
      if (dateInput instanceof Date) {
        date = dateInput;
      }
      // Handle Unix Timestamp (number or numeric string)
      else if (
        typeof dateInput === "number" ||
        (typeof dateInput === "string" && /^\d+$/.test(dateInput))
      ) {
        const timestamp = Number(dateInput);
        if (timestamp < 100000000000) {
          date = new Date(timestamp * 1000);
        } else {
          date = new Date(timestamp);
        }
      }
      // Handle date strings (ISO, SQL format...)
      else {
        let dateString = String(dateInput).trim();

        // 🔥 FIX 1: SQL Format "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
        if (dateString.includes(" ") && !dateString.includes("T")) {
          dateString = dateString.replace(" ", "T");
        }

        // 🔥 FIX 2 (Quan trọng): Cắt bỏ Microseconds (.221199 -> .221)
        // JS Date chỉ hỗ trợ 3 chữ số ms, nhiều hơn sẽ gây Invalid Date ở một số môi trường
        if (dateString.includes(".")) {
          const parts = dateString.split(".");
          // Nếu phần thập phân dài hơn 3 chữ số, cắt bớt đi
          if (parts[1] && parts[1].length > 3) {
            // Giữ lại phần ngày giờ + 3 số đầu của ms + (Z nếu có)
            const msPart = parts[1].substring(0, 3);
            const timezonePart = parts[1].endsWith("Z")
              ? "Z"
              : parts[1].includes("+")
              ? parts[1].substring(parts[1].indexOf("+"))
              : "";
            dateString = `${parts[0]}.${msPart}${timezonePart}`;
          }
        }

        // 🔥 FIX 3: Thêm Z nếu thiếu timezone (giả định UTC từ DB)
        if (!dateString.endsWith("Z") && !dateString.includes("+")) {
          dateString += "Z";
        }

        date = new Date(dateString);
      }

      // Final validation
      if (Number.isNaN(date.getTime())) {
        console.error("Invalid Date parsed from:", dateInput);
        return "N/A";
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return formatDate(String(dateInput));
    } catch (error) {
      console.error("Date error:", error);
      return "N/A";
    }
  };

  return (
    <Card
      className={`p-4 transition-shadow ${
        onClick ? "cursor-pointer hover:shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 font-bold text-sm text-white">
              <img
                src={application?.applicantAvatar}
                alt={application?.applicantName}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback nếu ảnh lỗi
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm dark:text-white">
                {application?.applicantName || "Unknown"}
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-xs dark:text-gray-400">
                <ClockIcon className="h-3 w-3" />
                <span title={String(application.appliedAt)}>
                  Applied {formatRelativeTime(application.appliedAt)}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
              application.status
            )}`}
          >
            {application.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Cover Letter */}
        {application.coverLetter && (
          <div className="text-gray-600 text-sm dark:text-gray-300">
            {application.coverLetter}
          </div>
        )}

        {/* Outcome Section */}
        {application.outcome && (
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            <div className="mb-1 font-medium text-gray-900 text-xs dark:text-white">
              Submitted Work:
            </div>
            <div className="text-gray-700 text-sm dark:text-gray-300">
              {application.outcomeType === "file" ? (
                <a
                  href={application.outcome}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 hover:underline"
                >
                  View File
                </a>
              ) : (
                application.outcome
              )}
            </div>
          </div>
        )}

        {/* Feedback Section */}
        {application.feedback && (
          <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-3 dark:bg-yellow-900/10">
            <div className="mb-1 font-medium text-xs text-yellow-900 dark:text-yellow-400">
              Feedback:
            </div>
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              {application.feedback}
            </div>
          </div>
        )}

        {/* Rating Section */}
        {application.rating && (
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/10">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium text-blue-900 text-xs dark:text-blue-400">
                Rating:
              </span>
              <span className="text-sm text-yellow-600">
                {"⭐".repeat(application.rating)}
              </span>
            </div>
            {application.comment && (
              <div className="text-blue-800 text-sm dark:text-blue-300">
                {application.comment}
              </div>
            )}
          </div>
        )}

        {/* Actions Buttons */}
        {showActions && (
          <div className="flex gap-2 border-gray-200 border-t pt-3 dark:border-gray-700">
            {onViewProfile && (
              <button
                onClick={() => onViewProfile(application.applicantName || "")}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                type="button"
              >
                View Profile
              </button>
            )}

            {onAccept &&
              application.status === "submitted" &&
              !application.outcome && (
                <button
                  onClick={() => onAccept(application.id || "")}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  type="button"
                >
                  Accept Application
                </button>
              )}

            {application.outcome && (
              <>
                {onApprove && application.status !== "completed" && (
                  <button
                    onClick={() => onApprove(application.id || "")}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-green-800"
                    type="button"
                  >
                    Approve
                  </button>
                )}
                {onRating &&
                  application.status === "completed" &&
                  ![1, 2, 3, 4, 5].includes(application.rating ?? 0) && (
                    <button
                      onClick={() => onRating(application.id || "")}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-blue-800"
                      type="button"
                    >
                      Rate Application
                    </button>
                  )}
                {onRequestRevision && application.status !== "completed" && (
                  <button
                    onClick={() => onRequestRevision(application.id || "")}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-red-800"
                    type="button"
                  >
                    Needs revision
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ApplicationCard;
