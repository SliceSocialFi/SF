import { BellIcon } from "@heroicons/react/24/outline";
import { NotificationFeedType } from "@slice/data/enums";
import {
  type NotificationRequest,
  NotificationType,
  useNotificationsQuery,
} from "@slice/indexer";
import { memo, useCallback, useEffect } from "react";
import { WindowVirtualizer } from "virtua";
import AccountActionExecutedNotification from "@/components/Notification/Type/AccountActionExecutedNotification";
import CommentNotification from "@/components/Notification/Type/CommentNotification";
import FollowNotification from "@/components/Notification/Type/FollowNotification";
import MentionNotification from "@/components/Notification/Type/MentionNotification";
import PostActionExecutedNotification from "@/components/Notification/Type/PostActionExecutedNotification";
import QuoteNotification from "@/components/Notification/Type/QuoteNotification";
import ReactionNotification from "@/components/Notification/Type/ReactionNotification";
import RepostNotification from "@/components/Notification/Type/RepostNotification";
import { Card, EmptyState, ErrorMessage } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import useLoadMoreOnIntersect from "@/hooks/useLoadMoreOnIntersect";
import { useNotificationStore } from "@/store/persisted/useNotificationStore";
import NotificationShimmer from "./Shimmer";
import TokenDistributedNotification from "./Type/TokenDistributedNotification";

const notificationComponentMap = {
  AccountActionExecutedNotification,
  CommentNotification,
  FollowNotification,
  MentionNotification,
  PostActionExecutedNotification,
  QuoteNotification,
  ReactionNotification,
  RepostNotification,
  TokenDistributedNotification,
} as const;

interface ListProps {
  feedType: string;
}

const List = ({ feedType }: ListProps) => {
  const { setLastSeenNotificationId } = useNotificationStore();

  const getNotificationType = useCallback(() => {
    switch (feedType) {
      case NotificationFeedType.All:
        return;
      case NotificationFeedType.Mentions:
        return [NotificationType.Mentioned];
      case NotificationFeedType.Comments:
        return [NotificationType.Commented];
      case NotificationFeedType.Likes:
        return [NotificationType.Reacted];
      case NotificationFeedType.PostActions:
        return [NotificationType.ExecutedPostAction];
      case NotificationFeedType.Rewards:
        return [NotificationType.TokenDistributed];
      default:
        return;
    }
  }, [feedType]);

  const request: NotificationRequest = {
    filter: {
      includeLowScore: false,
      notificationTypes: getNotificationType(),
    },
  };

  const { data, error, fetchMore, loading } = useNotificationsQuery({
    variables: { request },
  });

  const notifications = data?.notifications?.items;
  const pageInfo = data?.notifications?.pageInfo;
  const hasMore = !!pageInfo?.next;

  useEffect(() => {
    const firstNotification = notifications?.[0];
    if (
      !firstNotification ||
      typeof firstNotification !== "object" ||
      !("id" in firstNotification)
    ) {
      return;
    }
    const firstId = firstNotification.id;
    if (firstId) {
      setLastSeenNotificationId(firstId);
    }
  }, [notifications, setLastSeenNotificationId]);

  const handleEndReached = useCallback(async () => {
    if (hasMore) {
      await fetchMore({
        variables: { request: { ...request, cursor: pageInfo?.next } },
      });
    }
  }, [fetchMore, hasMore, pageInfo?.next, request]);

  const loadMoreRef = useLoadMoreOnIntersect(handleEndReached);

  if (loading) {
    return (
      <div className="px-3">
        <Card className="divide-y divide-gray-200 dark:divide-gray-700">
          <NotificationShimmer />
          <NotificationShimmer />
          <NotificationShimmer />
          <NotificationShimmer />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3">
        <ErrorMessage error={error} title="Failed to load notifications" />
      </div>
    );
  }

  if (!notifications?.length) {
    return (
      <EmptyState
        icon={<BellIcon className="size-8" />}
        message={
          <div className="space-y-4 text-center">
            <p className="font-semibold text-gray-900 text-lg dark:text-white">
              No social notifications yet
            </p>
            <p className="mt-2 text-gray-600 text-sm dark:text-gray-400">
              You'll receive notifications when others interact with your posts
            </p>
          </div>
        }
      />
    );
  }
  return (
    <div className="px-3">
      <WindowVirtualizer>
        {notifications.map((notification) => {
          if (!("id" in notification)) {
            return null;
          }

          const Component =
            notificationComponentMap[
              notification.__typename as keyof typeof notificationComponentMap
            ];

          return (
            <Card
              className={cn("mb-3", {
                "p-5": notification.__typename !== "FollowNotification",
              })}
              key={notification.id}
            >
              {Component && <Component notification={notification as never} />}
            </Card>
          );
        })}
        {hasMore && <span ref={loadMoreRef} />}
      </WindowVirtualizer>
    </div>
  );
};

export default memo(List);
