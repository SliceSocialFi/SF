import type { ReactNode } from "react";
import { memo } from "react";
import { WindowVirtualizer } from "virtua";
import PostsShimmer from "@/components/Shared/Shimmer/PostsShimmer";
import { Card, EmptyState, ErrorMessage } from "@/components/Shared/UI";
import useLoadMoreOnIntersect from "@/hooks/useLoadMoreOnIntersect";

interface PostFeedProps<T extends { id: string }> {
  items: T[];
  loading?: boolean;
  error?: { message?: string };
  hasMore?: boolean;
  handleEndReached: () => Promise<void>;
  emptyIcon: ReactNode;
  emptyMessage: ReactNode;
  errorTitle: string;
  renderItem: (item: T) => ReactNode;
  feedKey?: string;
}

const PostFeed = <T extends { id: string }>({
  items,
  loading = false,
  error,
  hasMore,
  handleEndReached,
  emptyIcon,
  emptyMessage,
  errorTitle,
  renderItem,
  feedKey = "default",
}: PostFeedProps<T>) => {
  const loadMoreRef = useLoadMoreOnIntersect(handleEndReached);

  // console.log('🔵 PostFeed render:', feedKey, 'items count:', items?.length);

  if (loading) {
    return <PostsShimmer />;
  }

  if (!items?.length) {
    return (
      <div className="px-3">
        <EmptyState icon={emptyIcon} message={emptyMessage} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3">
        <ErrorMessage error={error} title={errorTitle} />
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3" key={feedKey}>
      {items.map((item) => (
        <Card key={item.id} className="mb-3">
          {renderItem(item)}
        </Card>
      ))}
      {hasMore && <span ref={loadMoreRef} />}
    </div>
  );
};

export default memo(PostFeed) as typeof PostFeed;
