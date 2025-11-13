import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import type { PostFragment } from "@slice/indexer";
import { AnimateNumber } from "motion-plus-react";
import { memo } from "react";
import { useNavigate } from "react-router";
import { Tooltip } from "@/components/Shared/UI";
import humanize from "@/helpers/humanize";
import cn from "@/helpers/cn";

interface CommentProps {
  post: PostFragment;
  showCount: boolean;
}

const Comment = ({ post, showCount }: CommentProps) => {
  const navigate = useNavigate();
  const count = post.stats.comments;

  const iconClassName = showCount
    ? "w-[17px] sm:w-[20px]"
    : "w-[15px] sm:w-[18px]";

  const hasVisibleCount = count > 0 && !showCount;

  // 👉 COMMENT ACTIVE KHI CÓ ÍT NHẤT 1 COMMENT
  const isActive = count > 0;

  return (
    <div
      className={cn(
        "post-action post-action-comment flex items-center space-x-1",
        isActive ? "post-action--active" : "text-gray-500 dark:text-gray-200"
      )}
      style={isActive ? { color: "var(--primary)" } : undefined}
    >
      <button
        aria-label="Comment"
        className="rounded-full p-1.5 outline-offset-2 hover:bg-gray-300/20 dark:hover:bg-gray-700/40"
        onClick={() => navigate(`/posts/${post.slug}`)}
        type="button"
      >
        <Tooltip
          content={count > 0 ? `${humanize(count)} Comments` : "Comment"}
          placement="top"
          withDelay
        >
          <ChatBubbleLeftIcon className={iconClassName} />
        </Tooltip>
      </button>

      {/* GIỮ SLOT CHO COUNT */}
      <span className="post-action-count text-gray-500 dark:text-gray-200">
        {hasVisibleCount ? (
          <AnimateNumber
            format={{ notation: "compact" }}
            key={`comment-count-${post.id}`}
            transition={{ type: "tween" }}
          >
            {count}
          </AnimateNumber>
        ) : (
          <span className="opacity-0">0</span>
        )}
      </span>
    </div>
  );
};

export default memo(Comment);
