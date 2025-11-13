import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { isRepost } from "@slice/helpers/postHelpers";
import type { AnyPostFragment } from "@slice/indexer";
import { AnimateNumber } from "motion-plus-react";
import { useState } from "react";
import MenuTransition from "@/components/Shared/MenuTransition";
import { Spinner, Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import humanize from "@/helpers/humanize";
import stopEventPropagation from "@/helpers/stopEventPropagation";
import Quote from "./Quote";
import Repost from "./Repost";
import UndoRepost from "./UndoRepost";

interface ShareMenuProps {
  post: AnyPostFragment;
  showCount: boolean;
}

const ShareMenu = ({ post, showCount }: ShareMenuProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetPost = isRepost(post) ? post.repostOf : post;

  const hasReposted =
    targetPost.operations?.hasReposted.optimistic ||
    targetPost.operations?.hasReposted.onChain;

  const hasQuoted =
    targetPost.operations?.hasQuoted.optimistic ||
    targetPost.operations?.hasQuoted.onChain;

  const hasShared = hasReposted || hasQuoted;
  const shares = targetPost.stats.reposts + targetPost.stats.quotes;

  const canRepost =
    targetPost.operations?.canRepost.__typename ===
    "PostOperationValidationPassed";

  const canQuote =
    targetPost.operations?.canQuote.__typename ===
    "PostOperationValidationPassed";

  const iconClassName = "w-[15px] sm:w-[18px]";

  if (!canRepost && !canQuote) {
    return null;
  }

  const hasVisibleCount = shares > 0 && !showCount;

  return (
    <div
      className={cn(
        "post-action post-action-repost flex items-center space-x-1",
        hasShared ? "post-action--active" : "text-gray-500 dark:text-gray-200"
      )}
    >
      <Menu as="div" className="relative">
        <MenuButton
          aria-label="Repost"
          onClick={stopEventPropagation}
          className="rounded-full p-1.5 outline-offset-2 hover:bg-gray-300/20 dark:hover:bg-gray-700/40"
        >
          {isSubmitting ? (
            <Spinner className="mr-0.5" size="xs" />
          ) : (
            <Tooltip
              content={
                shares > 0
                  ? `${humanize(shares)} Reposts & Quotes`
                  : "Repost or Quote"
              }
              placement="top"
              withDelay
            >
              <ArrowsRightLeftIcon className={iconClassName} />
            </Tooltip>
          )}
        </MenuButton>

        <MenuTransition>
          <MenuItems
            anchor="bottom start"
            className="z-[5] mt-2 w-max origin-top-left rounded-xl border border-gray-200 bg-white shadow-xs focus:outline-hidden dark:border-gray-700 dark:bg-gray-900"
            static
          >
            {canRepost && (
              <Repost
                isSubmitting={isSubmitting}
                post={targetPost}
                setIsSubmitting={setIsSubmitting}
              />
            )}

            {canQuote && <Quote post={targetPost} />}

            {/* Chỉ hiển thị nút Undo khi bài gốc khác bài repost */}
            {hasReposted && targetPost.id !== post.id && (
              <UndoRepost
                isSubmitting={isSubmitting}
                post={post}
                setIsSubmitting={setIsSubmitting}
              />
            )}
          </MenuItems>
        </MenuTransition>
      </Menu>

      {/* COUNT — luôn cố định vị trí */}
      <span className="post-action-count w-3 text-[11px] sm:text-xs text-gray-500 dark:text-gray-200">
        {hasVisibleCount ? (
          <AnimateNumber
            key={`share-count-${post.id}`}
            transition={{ type: "tween" }}
            format={{ notation: "compact" }}
          >
            {shares}
          </AnimateNumber>
        ) : (
          <span className="opacity-0">0</span>
        )}
      </span>
    </div>
  );
};

export default ShareMenu;
