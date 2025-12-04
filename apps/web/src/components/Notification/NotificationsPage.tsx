import {
  BellIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useNotificationStore } from "@/store/non-persisted/useNotificationStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import MobileHeader from "@/components/Shared/MobileHeader";
import StickyFeedBar from "@/components/Home/StickyFeedbar";
import { Card, EmptyState, Spinner, Badge, Tabs } from "@/components/Shared/UI";
import { formatRelativeTime } from "@/helpers/formatRelativeTime";
import getAvatar from "@slice/helpers/getAvatar";
import { DEFAULT_AVATAR } from "@slice/data/constants";
import type { Notification } from "@/types/task-api";
import { NotificationFeedType } from "@slice/data/enums";
import { useAccountQuery } from "@slice/indexer";
import FeedType from "./FeedType";
import List from "./List";

// Extended notification type with resolved sender info
interface NotificationWithSender extends Notification {
  resolvedSenderName?: string;
  resolvedSenderAvatar?: string;
}

const NOTIFICATIONS_PER_PAGE = 10;

// Regex to match Ethereum addresses (0x followed by 40 hex characters)
const ETH_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/g;

/**
 * Format notification message by removing wallet addresses
 * and cleaning up the text
 */
const formatNotificationMessage = (
  message: string,
  senderName?: string
): string => {
  if (!message) return "";

  // Replace wallet addresses with sender name or remove them
  let formatted = message.replace(ETH_ADDRESS_REGEX, senderName || "").trim();

  // Clean up extra spaces and fix grammar
  formatted = formatted
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/^\s*has\s+/i, "") // Remove leading "has" if message starts with it
    .trim();

  // Capitalize first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return formatted;
};

/**
 * NotificationItem Component - Refactored with professional UI
 * Uses Card component and follows TaskCard design patterns
 */
const NotificationItem = ({
  notification,
  onMarkAsRead,
  onClick,
}: {
  notification: NotificationWithSender;
  onMarkAsRead: (id: string) => void;
  onClick: (notification: NotificationWithSender) => void;
}) => {
  // Use resolved sender name/avatar (from Lens profile), fallback to API data, then "System"
  const avatarUrl =
    notification.resolvedSenderAvatar ||
    notification.sender?.avatar ||
    DEFAULT_AVATAR;
  const senderName =
    notification.resolvedSenderName ||
    notification.sender?.username ||
    "System";

  // Format message to remove wallet addresses
  const formattedMessage = formatNotificationMessage(
    notification.message,
    senderName
  );

  return (
    <Card
      onClick={() => onClick(notification)}
      className={`cursor-pointer gap-4 p-4 transition-shadow hover:shadow-md ${
        !notification.isRead
          ? "border-brand-200 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-900/5"
          : ""
      }`}
    >
      <div className="space-y-3">
        {/* Header: Avatar + Sender + Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with Unread Indicator */}
            <div className="relative flex-shrink-0">
              <img
                src={avatarUrl}
                alt={senderName}
                className="h-10 w-10 rounded-full border-2 border-gray-100 object-cover dark:border-gray-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              {!notification.isRead && (
                <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-brand-600 ring-2 ring-white dark:ring-gray-900" />
              )}
            </div>
            <div>
              <p
                className={`font-medium text-gray-900 text-sm dark:text-white ${
                  !notification.isRead ? "font-semibold" : ""
                }`}
              >
                {senderName}
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 text-gray-500 text-xs dark:text-gray-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`text-gray-900 text-sm leading-snug dark:text-white ${
            !notification.isRead ? "font-semibold" : "font-medium"
          }`}
        >
          {notification.title}
        </h3>

        {/* Message - only show if there's content after formatting */}
        {formattedMessage && (
          <p className="text-gray-600 text-sm leading-relaxed dark:text-gray-400">
            {formattedMessage}
          </p>
        )}

        {/* Type Badge & Mark as Read Button */}
        <div className="flex items-center justify-between">
          {notification.type && (
            <Badge
              variant="primary"
              className={`${
                notification.isRead
                  ? "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  : "border-brand-300 bg-brand-100 text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
              }`}
            >
              {notification.type
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          )}

          {/* Mark as Read Button */}
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="flex-shrink-0 rounded-lg p-2 text-brand-600 transition-colors hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-900/20"
              title="Mark as read"
              type="button"
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
};

/**
 * NotificationsPage - Professional notification management page
 * Follows design patterns from Tasks page
 */
const NotificationsPage = () => {
  const { currentAccount } = useAccountStore();
  const { show: showMobileDrawer } = useMobileDrawerModalStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    unreadCount,
    setUnreadCount,
    decrementCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread" | "social">("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [socialFeedType, setSocialFeedType] = useState<NotificationFeedType>(
    NotificationFeedType.All
  );

  // State for notifications with resolved sender info
  const [notificationsWithSender, setNotificationsWithSender] = useState<
    NotificationWithSender[]
  >([]);

  // Load hidden notification IDs from localStorage
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("hiddenNotifications");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  // Fetch all notifications first (paginate client-side like Tasks)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const notifications = await apiClient.getNotifications({ limit: 999 });
      return notifications;
    },
    enabled: !!currentAccount,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // useAccountQuery for fetching user metadata from Lens
  // Similar pattern to ApplicationList.tsx
  const { fetchMore } = useAccountQuery({
    skip: !data || data.length === 0,
    variables: {
      request: {
        address: data?.[0]?.senderProfileId || "",
      },
    },
  });

  // Function to get username by profileId from Lens
  const getUsernameByProfileId = async (profileId: string) => {
    if (!profileId) return null;
    try {
      const result = await fetchMore({
        variables: {
          request: {
            address: profileId,
          },
        },
      });
      return {
        name: result?.data?.account?.metadata?.name,
        avatar: result?.data?.account?.metadata?.picture,
      };
    } catch (error) {
      console.error("Error fetching account data for:", profileId, error);
      return null;
    }
  };

  // Resolve sender names when notifications data changes
  useEffect(() => {
    const resolveSenderNames = async () => {
      if (!data || data.length === 0) {
        setNotificationsWithSender([]);
        return;
      }

      const notificationsData = data.filter(
        (n: Notification) => !hiddenIds.has(n.id)
      );

      // Resolve sender info for each notification with senderProfileId
      const resolved = await Promise.all(
        notificationsData.map(async (notification: Notification) => {
          if (notification.senderProfileId) {
            const metadata = await getUsernameByProfileId(
              notification.senderProfileId
            );
            return {
              ...notification,
              resolvedSenderName:
                metadata?.name || notification.sender?.username || "System",
              resolvedSenderAvatar:
                metadata?.avatar || notification.sender?.avatar,
            };
          }
          return {
            ...notification,
            resolvedSenderName: notification.sender?.username || "System",
            resolvedSenderAvatar: notification.sender?.avatar,
          };
        })
      );

      setNotificationsWithSender(resolved);
    };

    resolveSenderNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, hiddenIds]);

  // Filter out hidden notifications (using resolved notifications)
  const allNotifications = notificationsWithSender;

  // Reset to page 0 when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistic update
      decrementCount();
      markAsRead(id);

      // Call API
      await apiClient.markNotificationAsRead(id);
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    try {
      // Optimistic update
      setUnreadCount(0);

      // Update all notifications in cache to read
      if (data) {
        queryClient.setQueryData(
          ["notifications", "list"],
          (oldData: Notification[] | undefined) =>
            oldData?.map((n: Notification) => ({
              ...n,
              isRead: true,
            })) ?? []
        );
      }

      // Call API
      await apiClient.markAllNotificationsAsRead();

      // Invalidate queries to refresh
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to mark all as read");
      // Rollback on error
      refetch();
    }
  };

  const handleClearAll = () => {
    // Hide all current notifications by saving their IDs to localStorage
    const idsToHide = allNotifications.map((n) => n.id);
    const newHiddenIds = new Set([...hiddenIds, ...idsToHide]);

    // Save to localStorage
    localStorage.setItem(
      "hiddenNotifications",
      JSON.stringify([...newHiddenIds])
    );

    // Update state
    setHiddenIds(newHiddenIds);
    setUnreadCount(0);
    setCurrentPage(0);

    toast.success(`${idsToHide.length} notifications hidden`);
  };

  const handleNotificationClick = async (
    notification: NotificationWithSender
  ) => {
    // 1. Mark as read if not already
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // 2. Navigate based on notification type
    const taskId = notification.metadata?.taskId;

    switch (notification.type) {
      case "application_received":
      case "task_submitted":
        // Employer notifications - navigate to task detail page
        if (taskId) {
          navigate(`/tasks/${taskId}`);
        } else {
          navigate("/tasks");
        }
        break;

      case "application_accepted":
      case "task_approved":
      case "task_rated":
      case "task_needs_revision":
      case "task_created":
        // Freelancer notifications - navigate to task detail page
        if (taskId) {
          navigate(`/tasks/${taskId}`);
        } else {
          navigate("/tasks");
        }
        break;

      case "application_rejected":
        // Navigate to tasks list (no specific task page needed)
        navigate("/tasks");
        break;

      default:
        // Default: navigate to task detail if taskId exists
        if (taskId) {
          navigate(`/tasks/${taskId}`);
        } else {
          navigate("/tasks");
        }
        break;
    }
  };

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    return filter === "unread"
      ? allNotifications.filter((n) => !n.isRead)
      : allNotifications;
  }, [filter, allNotifications]);

  // Pagination based on filtered results (like Tasks)
  const totalPages = Math.ceil(
    filteredNotifications.length / NOTIFICATIONS_PER_PAGE
  );
  const paginatedNotifications = filteredNotifications.slice(
    currentPage * NOTIFICATIONS_PER_PAGE,
    (currentPage + 1) * NOTIFICATIONS_PER_PAGE
  );

  const totalCount = allNotifications.length;
  const unreadCountFromList = allNotifications.filter((n) => !n.isRead).length;

  return (
    <PageLayout title="Task Notifications">
      {/* Tabs Navigation */}
      {!showMobileDrawer && (
        <StickyFeedBar
          header={<MobileHeader searchPlaceholder="Search notifications..." />}
          tabs={
            <div className="px-5 md:px-0">
          <Tabs
            active={filter}
            className="mb-0"
            layoutId="notification_tabs"
            setActive={(type) => setFilter(type as "all" | "unread" | "social")}
            tabs={[
              {
                name: "Tasks",
                type: "all",
                suffix: (
                  <Badge
                    variant="primary"
                    className="flex items-center space-x-1 border-blue-600 bg-blue-500"
                  >
                    {totalCount}
                  </Badge>
                ),
              },
              // {
              //   name: "Unread",
              //   type: "unread",
              //   suffix:
              //     unreadCount > 0 ? (
              //       <Badge
              //         variant="primary"
              //         className="ml-1 border-brand-300 bg-brand-100 text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
              //       >
              //         {unreadCount}
              //       </Badge>
              //     ) : null,
              // },
              {
                name: "Social",
                type: "social",
              },
            ]}
          />
            </div>
          }
        />
      )}

      {/* Actions bar - Show when there are notifications */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between border-gray-200 border-t px-5 pt-3 md:px-0 dark:border-gray-700">
          {unreadCountFromList > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 text-brand-600 text-sm font-medium transition-all hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/10 dark:hover:text-brand-300"
              type="button"
              title="Mark all notifications as read"
            >
              {/* Double check icon effect */}
              <div className="relative">
                <CheckIcon className="h-4 w-4" />
                <CheckIcon className="absolute -right-1 -top-0.5 h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
              </div>
              <span>Mark all as read</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-red-600 text-sm font-medium transition-all hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/10 dark:hover:text-red-300"
            type="button"
            title="Clear all notifications from view"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3 px-3">
        {filter === "social" ? (
          <div>
            <FeedType
              feedType={socialFeedType}
              setFeedType={setSocialFeedType}
            />
            <List feedType={socialFeedType} />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : paginatedNotifications.length === 0 ? (
          <EmptyState
            icon={<BellIcon className="h-12 w-12 text-gray-400" />}
            message={
              <div className="text-center">
                <p className="font-medium text-gray-900 text-lg dark:text-white">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "No notifications yet"}
                </p>
                <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                  {filter === "unread"
                    ? "All notifications have been read"
                    : "When you get notifications, they'll show up here"}
                </p>
              </div>
            }
          />
        ) : (
          <>
            <div className="space-y-3">
              {paginatedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {filteredNotifications.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6 pb-4">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentPage === 0}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  type="button"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                  Previous
                </button>

                <span className="text-gray-600 text-sm dark:text-gray-400">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                  }
                  disabled={currentPage >= totalPages - 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 font-medium text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  type="button"
                >
                  Next
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default NotificationsPage;
