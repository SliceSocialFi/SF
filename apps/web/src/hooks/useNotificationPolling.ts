import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import { useNotificationStore } from "@/store/non-persisted/useNotificationStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";

// Notification sound URL
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

/**
 * Custom hook for polling notification unread count
 * Uses React Query with lightweight polling strategy:
 * - Polls every 10 seconds
 * - Refetches on window focus
 * - Syncs data to Zustand store using getState()
 * - Plays sound when new notifications arrive
 */
export const useNotificationPolling = () => {
  const { currentAccount } = useAccountStore();
  const previousCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5; // Set volume to 50%
  }, []);

  const { data, isError, error } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: async () => {
      const result = await apiClient.getUnreadCount();
      return result;
    },
    enabled: !!currentAccount, // Only poll when user is logged in (has token)
    refetchInterval: 10000, // Poll every 10 seconds
    refetchOnWindowFocus: true, // Poll when user returns to tab
    staleTime: 0, // Always consider data stale
    retry: 1, // Retry once on failure
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
  });

  // Handle count updates and sound effect
  useEffect(() => {
    if (data) {
      const newCount = data.count;
      const currentCount = previousCountRef.current;

      // Update store
      useNotificationStore.getState().setUnreadCount(newCount);

      // Play sound if count increased (new notification arrived)
      // Only play if currentCount > 0 to avoid playing on initial load
      if (newCount > currentCount && currentCount > 0) {
        audioRef.current?.play().catch((err) => {
          console.warn("[useNotificationPolling] Failed to play notification sound:", err);
        });
      }

      // Update ref for next comparison
      previousCountRef.current = newCount;
    }
  }, [data]);

  // Log errors (but don't throw) - silent failure for better UX
  useEffect(() => {
    if (isError && error) {
      // Only log non-auth errors
      if ((error as any)?.status !== 401) {
        console.error("[useNotificationPolling] Failed to fetch unread count:", error);
      }
    }
  }, [isError, error]);

  return {
    unreadCount: data?.count ?? 0,
    isError,
  };
};
