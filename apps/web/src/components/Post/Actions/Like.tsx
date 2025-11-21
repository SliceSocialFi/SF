import type { ApolloCache, NormalizedCacheObject } from "@apollo/client";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { ERRORS } from "@slice/data/errors";
import {
  type PostFragment,
  PostReactionType,
  useAddReactionMutation,
  useUndoReactionMutation
} from "@slice/indexer";
import type { ApolloClientError } from "@slice/types/errors";
import { useCounter, useToggle } from "@uidotdev/usehooks";
import { AnimateNumber } from "motion-plus-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import errorToast from "@/helpers/errorToast";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface LikeProps {
  post: PostFragment;
  showCount: boolean;
}

const Like = ({ post, showCount }: LikeProps) => {
  const { currentAccount } = useAccountStore();

  const [hasReacted, toggleReact] = useToggle(post.operations?.hasReacted);
  const [reactions, { decrement, increment }] = useCounter(
    post.stats.reactions
  );

  const updateCache = (cache: ApolloCache<NormalizedCacheObject>) => {
    if (!post.operations) {
      return;
    }

    cache.modify({
      fields: { hasReacted: () => !hasReacted },
      id: cache.identify(post.operations)
    });

    cache.modify({
      fields: {
        stats: (existingData) => ({
          ...existingData,
          reactions: hasReacted ? reactions - 1 : reactions + 1
        })
      },
      id: cache.identify(post)
    });
  };

  const onError = useCallback((error: ApolloClientError) => {
    errorToast(error);
  }, []);

  const [addReaction] = useAddReactionMutation({
    onError: (error) => {
      toggleReact();
      decrement();
      onError(error);
    },
    update: updateCache
  });

  const [undoReaction] = useUndoReactionMutation({
    onError: (error) => {
      toggleReact();
      increment();
      onError(error);
    },
    update: updateCache
  });

  const handleCreateLike = async () => {
    if (!currentAccount) {
      return toast.error(ERRORS.SignWallet);
    }

    toggleReact();

    if (hasReacted) {
      decrement();
      return await undoReaction({
        variables: {
          request: { post: post.id, reaction: PostReactionType.Upvote }
        }
      });
    }

    increment();
    return await addReaction({
      variables: {
        request: { post: post.id, reaction: PostReactionType.Upvote }
      }
    });
  };

  const iconClassName = showCount
    ? "w-[17px] sm:w-[20px]"
    : "w-[15px] sm:w-[18px]";

  const hasVisibleCount = reactions > 0 && !showCount;

  return (
    <div
      className={cn(
        "post-action post-action-like flex items-center space-x-1",
        hasReacted
          ? "post-action--active text-[var(--primary)]"
          : "text-gray-500 dark:text-gray-200"
      )}
    >
      <button
        aria-label="Like"
        className={cn(
          "rounded-full p-1.5 outline-offset-2 transition-colors",
          hasReacted ? "hover:bg-brand-300/20" : "hover:bg-gray-300/20"
        )}
        onClick={handleCreateLike}
        type="button"
      >
        <Tooltip
          content={hasReacted ? "Unlike" : "Like"}
          placement="top"
          withDelay
        >
          {hasReacted ? (
            <HeartIconSolid className={iconClassName} />
          ) : (
            <HeartIcon className={iconClassName} />
          )}
        </Tooltip>
      </button>

      <span className="post-action-count text-gray-500 dark:text-gray-200">
        {hasVisibleCount ? (
          <AnimateNumber
            format={{ notation: "compact" }}
            key={`like-count-${post.id}`}
            transition={{ type: "tween" }}
          >
            {reactions}
          </AnimateNumber>
        ) : (
          <span className="opacity-0">0</span>
        )}
      </span>
    </div>
  );
};

export default Like;
