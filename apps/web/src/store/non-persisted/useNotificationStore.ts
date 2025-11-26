import { create } from "zustand";
import type { Notification } from "@/types/task-api";

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isDropdownOpen: boolean;
  loading: boolean;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  decrementCount: () => void;
  toggleDropdown: () => void;
  closeDropdown: () => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Initial State
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
  loading: false,
  
  // Set notifications list (with deduplication)
  setNotifications: (notifications) => {
    // Deduplicate notifications by id
    const seen = new Set<string>();
    const uniqueNotifications = notifications.filter((n) => {
      if (seen.has(n.id)) {
        return false;
      }
      seen.add(n.id);
      return true;
    });
    set({ notifications: uniqueNotifications });
  },
  
  // Set unread count (from API)
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  // Decrement count immediately (Optimistic Update)
  decrementCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),
  
  // Toggle dropdown open/close
  toggleDropdown: () =>
    set((state) => ({
      isDropdownOpen: !state.isDropdownOpen
    })),
  
  // Close dropdown (used when clicking outside)
  closeDropdown: () => set({ isDropdownOpen: false }),
  
  // Set loading state
  setLoading: (loading) => set({ loading }),
  
  // Add new notification (with deduplication)
  addNotification: (notification) => 
    set((state) => {
      // Check if notification already exists
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) {
        return state; // No change if already exists
      }
      return {
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      };
    }),
  
  // Mark single notification as read
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),
  
  // Mark all notifications as read
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0
    })),
  
  // Remove notification
  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    })
}));
