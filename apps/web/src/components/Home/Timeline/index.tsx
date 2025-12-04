import { UserGroupIcon } from "@heroicons/react/24/outline";
import {
  TimelineEventItemType,
  type TimelineRequest,
  useTimelineQuery,
} from "@slice/indexer";
import { memo, useCallback, useEffect, useMemo } from "react";
import SinglePost from "@/components/Post/SinglePost";
import PostFeed from "@/components/Shared/Post/PostFeed";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const Timeline = () => {
  const { currentAccount } = useAccountStore();
  const request: TimelineRequest = {
    account: currentAccount?.address,
    filter: {
      eventType: [
        TimelineEventItemType.Post,
        TimelineEventItemType.Quote,
        TimelineEventItemType.Repost,
      ],
    },
  };

  // console.log('🟢 Timeline component render');

  const { data, error, fetchMore, loading, refetch, client } = useTimelineQuery(
    {
      variables: { request },
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    }
  );

  // Reset cache when component mounts
  useEffect(() => {
    // console.log('🟢 Timeline mounted - evicting cache');
    client.cache.evict({ fieldName: "timeline" });
    client.cache.gc();
    refetch();
  }, []);

  const feed = data?.timeline?.items;
  const pageInfo = data?.timeline?.pageInfo;
  const hasMore = pageInfo?.next;

  const handleEndReached = useCallback(async () => {
    if (hasMore) {
      await fetchMore({
        variables: { request: { ...request, cursor: pageInfo?.next } },
      });
    }
  }, [fetchMore, hasMore, pageInfo?.next, request]);

  const filteredPosts = useMemo(
    () =>
      (feed ?? []).filter(
        (timelineItem) =>
          !timelineItem.primary.author.operations?.hasBlockedMe &&
          !timelineItem.primary.author.operations?.isBlockedByMe &&
          !timelineItem.primary.operations?.hasReported
      ),
    [feed]
  );

  // console.log('🟢 Timeline filteredPosts:', filteredPosts?.length, 'IDs:', filteredPosts?.map(p => p.id).slice(0, 3));

  return (
    <PostFeed
      feedKey="timeline-feed"
      emptyIcon={<UserGroupIcon className="size-8" />}
      emptyMessage="No posts yet!"
      error={error}
      errorTitle="Failed to load timeline"
      handleEndReached={handleEndReached}
      hasMore={hasMore}
      items={filteredPosts}
      loading={loading}
      renderItem={(timelineItem) => (
        <SinglePost
          key={timelineItem.id}
          post={timelineItem.primary}
          timelineItem={timelineItem}
        />
      )}
    />
  );
};

export default memo(Timeline);
