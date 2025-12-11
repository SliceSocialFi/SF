import { LightBulbIcon } from "@heroicons/react/24/outline";
import {
  PageSize,
  type PostFragment,
  type PostsForYouRequest,
  usePostsForYouQuery,
} from "@slice/indexer";
import { useCallback, useEffect, useMemo } from "react";
import SinglePost from "@/components/Post/SinglePost";
import PostFeed from "@/components/Shared/Post/PostFeed";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const ForYou = () => {
  const { currentAccount } = useAccountStore();

  // console.log('🟡 ForYou component render');

  const request: PostsForYouRequest = {
    account: currentAccount?.address,
    pageSize: PageSize.Fifty,
    shuffle: true,
  };

  const { data, error, fetchMore, loading, refetch, client } =
    usePostsForYouQuery({
      variables: { request },
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    });

  // Reset cache when component mounts
  useEffect(() => {
    // console.log('🟡 ForYou mounted - evicting cache');
    client.cache.evict({ fieldName: "mlPostsForYou" });
    client.cache.gc();
    refetch();
  }, []);

  const posts = data?.mlPostsForYou.items;
  const pageInfo = data?.mlPostsForYou.pageInfo;
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
      posts
        ?.map((item) => item.post)
        .filter(
          (post) =>
            !post.author.operations?.hasBlockedMe &&
            !post.author.operations?.isBlockedByMe &&
            !post.operations?.hasReported
        ),
    [posts]
  );

  // console.log('🟡 ForYou filteredPosts:', filteredPosts?.length, 'IDs:', filteredPosts?.map(p => p.id).slice(0, 3));

  return (
    <PostFeed
      feedKey="foryou-feed"
      emptyIcon={<LightBulbIcon className="size-8" />}
      emptyMessage="No posts yet!"
      error={error}
      errorTitle="Failed to load for you"
      handleEndReached={handleEndReached}
      hasMore={hasMore}
      items={filteredPosts as PostFragment[]}
      loading={loading}
      renderItem={(post) => <SinglePost key={post.id} post={post} />}
    />
  );
};

export default ForYou;
