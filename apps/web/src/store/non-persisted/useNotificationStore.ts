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
  
  // Set notifications list
  setNotifications: (notifications) => set({ notifications }),
  
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
  
  // Add new notification
  addNotification: (notification) => 
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    })),
  
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
