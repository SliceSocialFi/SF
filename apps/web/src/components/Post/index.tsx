import getAccount from "@slice/helpers/getAccount";
import getAvatar from "@slice/helpers/getAvatar";
import { isRepost } from "@slice/helpers/postHelpers";
import {
  PageSize,
  PostReferenceType,
  PostVisibilityFilter,
  useHiddenCommentsQuery,
  usePostQuery,
} from "@slice/indexer";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router";
import { createTrackedSelector } from "react-tracked";
import { create } from "zustand";
import CommentFeed from "@/components/Comment/CommentFeed";
import NoneRelevantFeed from "@/components/Comment/NoneRelevantFeed";
import ComposerPanel from "@/components/Composer/ComposerPanel";
import NewPublication from "@/components/Composer/NewPublication";
import Custom404 from "@/components/Shared/404";
import Custom500 from "@/components/Shared/500";
import SingleAccount from "@/components/Shared/Account/SingleAccount";
import BackButton from "@/components/Shared/BackButton";
import Footer from "@/components/Shared/Footer";
import PageLayout from "@/components/Shared/PageLayout";
import {
  Card,
  CardHeader,
  Image,
  WarningMessage,
} from "@/components/Shared/UI";
import { usePostLinkStore } from "@/store/non-persisted/navigation/usePostLinkStore";
import { usePostStore } from "@/store/non-persisted/post/usePostStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import FullPost from "./FullPost";
import Quotes from "./Quotes";
import RelevantPeople from "./RelevantPeople";
import PostPageShimmer from "./Shimmer";

interface HiddenCommentFeedState {
  setShowHiddenComments: (show: boolean) => void;
  showHiddenComments: boolean;
}

const store = create<HiddenCommentFeedState>((set) => ({
  setShowHiddenComments: (show) => set({ showHiddenComments: show }),
  showHiddenComments: false,
}));

export const useHiddenCommentFeedStore = createTrackedSelector(store);

const ViewPost = () => {
  const { pathname } = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const { currentAccount } = useAccountStore();
  const { cachedPost, setCachedPost } = usePostLinkStore();
  const { postContent } = usePostStore();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const showQuotes = pathname === `/posts/${slug}/quotes`;

  const handleOpen = () => {
    if (!mounted) {
      setMounted(true);
      setTimeout(() => setOpen(true), 0);
    } else {
      setOpen(true);
    }
  };

  const handleExited = () => {
    setMounted(false);
  };

  const handleDismiss = () => {
    setOpen(false);
  };

  const { data, error, loading } = usePostQuery({
    onCompleted: (data) => {
      if (data?.post) {
        setCachedPost(null);
      }
    },
    skip: !slug,
    variables: { request: { post: slug } },
  });

  const { data: comments } = useHiddenCommentsQuery({
    skip: !slug,
    variables: {
      request: {
        pageSize: PageSize.Ten,
        referencedPost: slug,
        referenceTypes: [PostReferenceType.CommentOn],
        visibilityFilter: PostVisibilityFilter.Hidden,
      },
    },
  });

  const post = data?.post ?? cachedPost;
  const hasHiddenComments = (comments?.postReferences.items.length || 0) > 0;

  if (!slug || (loading && !cachedPost)) {
    return <PostPageShimmer isQuotes={showQuotes} />;
  }

  if (!post) {
    return <Custom404 />;
  }

  if (error) {
    return <Custom500 />;
  }

  const targetPost = isRepost(post) ? post.repostOf : post;
  const canComment =
    targetPost.operations?.canComment.__typename ===
    "PostOperationValidationPassed";
  
  // Check if the comment's root post is deleted
  const isCommentOnDeletedPost = post.commentOn?.isDeleted || post.root?.isDeleted;
  
  // Allow comments on reposts even if original post is deleted
  // But disable comments on original deleted posts
  // Also disable comments if this is a comment on a deleted post
  const allowComment = isRepost(post) 
    ? true 
    : !post.isDeleted && !isCommentOnDeletedPost;

  return (
    <PageLayout
      sidebar={
        <div className="space-y-5">
          <Card as="aside" className="p-5">
            <SingleAccount
              account={targetPost.author}
              hideFollowButton={
                currentAccount?.address === targetPost.author.address
              }
              hideUnfollowButton={
                currentAccount?.address === targetPost.author.address
              }
              showBio
            />
          </Card>
          <RelevantPeople mentions={targetPost.mentions} />
          <Footer />
        </div>
      }
      title={`${targetPost.__typename} by ${
        getAccount(targetPost.author).usernameWithPrefix
      } • Slice`}
      zeroTopMargin
    >
      {showQuotes ? (
        <Quotes post={targetPost} />
      ) : (
        <>
          <div className="px-3 pt-3">
            <Card>
              <CardHeader icon={<BackButton />} title="Post" />
              <FullPost
                hasHiddenComments={hasHiddenComments}
                key={post?.id}
                post={post}
              />
            </Card>
          </div>
          {currentAccount && !canComment && (
            <div className="px-3">
              <WarningMessage
                message="You don't have permission to comment on this post."
                title="You cannot comment on this post"
              />
            </div>
          )}
          {currentAccount && allowComment && canComment ? (
            <div className="px-3">
              {mounted ? (
                <ComposerPanel
                  isOpen={open}
                  onDismiss={handleDismiss}
                  onExited={handleExited}
                  disableDismiss={Boolean(
                    postContent && postContent.trim().length > 0
                  )}
                >
                  <NewPublication
                    post={targetPost}
                    panelProps={{
                      isOpen: open,
                      onDismiss: handleDismiss,
                      onExited: handleExited,
                      disableDismiss: Boolean(
                        postContent && postContent.trim().length > 0
                      ),
                    }}
                  />
                </ComposerPanel>
              ) : (
                <Card
                  className="cursor-pointer border-gray-200 !border-b px-3 pb-3 pt-2 dark:border-gray-700"
                  onClick={handleOpen}
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      alt={currentAccount?.address}
                      className="size-9 cursor-pointer rounded-full border bg-gray-200 dark:border-gray-700"
                      height={36}
                      onError={({ currentTarget }) => {
                        currentTarget.src = getAvatar(currentAccount);
                      }}
                      src={getAvatar(currentAccount)}
                      width={36}
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {postContent || "What's new?!"}
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : null}
          <CommentFeed postId={targetPost.id} />
          <NoneRelevantFeed postId={targetPost.id} />
        </>
      )}
    </PageLayout>
  );
};

export default ViewPost;
