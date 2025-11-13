import { BellIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Link } from "react-router";
import { apiClient } from "@/lib/apiClient";
import { useNotificationStore } from "@/store/non-persisted/useNotificationStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const NotificationBell = () => {
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const { currentAccount } = useAccountStore();

  useEffect(() => {
    if (!currentAccount) return;

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

    loadUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [currentAccount]);

  return (
    <Link
      to="/notifications"
      className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      title="Notifications"
    >
      <BellIcon className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
