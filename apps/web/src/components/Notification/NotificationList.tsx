import { BellIcon, CheckIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useNotificationStore } from "@/store/non-persisted/useNotificationStore";
import { Card, Button, Spinner } from "@/components/Shared/UI";
import type { Notification } from "@/types/task-api";

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card
      className={`p-4 transition-all ${
        notification.isRead ? "bg-white dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/10"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            notification.isRead
              ? "bg-gray-100 dark:bg-gray-700"
              : "bg-blue-100 dark:bg-blue-900/30"
          }`}
        >
          <BellIcon
            className={`h-5 w-5 ${
              notification.isRead ? "text-gray-500" : "text-blue-600 dark:text-blue-400"
            }`}
          />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-gray-900 text-sm dark:text-white">
              {notification.title}
            </h4>
            <span className="text-nowrap text-gray-500 text-xs dark:text-gray-400">
              {formatDate(notification.createdAt)}
            </span>
          </div>

          <p className="text-gray-600 text-sm dark:text-gray-300">{notification.message}</p>

          {notification.type && (
            <span className="inline-block rounded bg-gray-100 px-2 py-1 text-gray-600 text-xs dark:bg-gray-700 dark:text-gray-300">
              {notification.type.replace(/_/g, " ")}
            </span>
          )}
        </div>

        <div className="flex flex-shrink-0 gap-1">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20"
              title="Mark as read"
              type="button"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
            title="Delete"
            type="button"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

const NotificationList = () => {
  const { notifications, unreadCount, loading, setNotifications, setUnreadCount, setLoading, markAsRead, markAllAsRead, removeNotification } = useNotificationStore();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNotifications();
      setNotifications(data);
    } catch (error: any) {
      if (error?.status !== 401) {
        console.error("Failed to load notifications:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { count } = await apiClient.getUnreadCount();
      setUnreadCount(count);
    } catch (error: any) {
      if (error?.status !== 401) {
        console.error("Failed to load unread count:", error);
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      markAsRead(id);
      toast.success("Marked as read");
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      removeNotification(id);
      toast.success("Notification deleted");
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to delete notification");
    }
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`font-medium text-sm transition-colors ${
              filter === "all"
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
            type="button"
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`font-medium text-sm transition-colors ${
              filter === "unread"
                ? "text-brand-600 dark:text-brand-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
            type="button"
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <Button size="sm" outline onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Spinner />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
          <BellIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList;
