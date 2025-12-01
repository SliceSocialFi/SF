import { QueueListIcon } from "@heroicons/react/24/outline";
import { isRepost } from "@slice/helpers/postHelpers";
import type { AnyPostFragment } from "@slice/indexer";
import dayjs from "dayjs";
import PostWarning from "@/components/Shared/Post/PostWarning";
import { Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import {
  getBlockedByMeMessage,
  getBlockedMeMessage
} from "@/helpers/getBlockedMessage";
import { useHiddenCommentFeedStore } from ".";
import PostActions from "./Actions";
import HiddenPost from "./HiddenPost";
import PostAvatar from "./PostAvatar";
import PostBody from "./PostBody";
import PostHeader from "./PostHeader";
import PostStats from "./PostStats";
import PostType from "./Type";

interface FullPostProps {
  hasHiddenComments: boolean;
  post: AnyPostFragment;
}

const FullPost = ({ hasHiddenComments, post }: FullPostProps) => {
  const { setShowHiddenComments, showHiddenComments } =
    useHiddenCommentFeedStore();

  const targetPost = isRepost(post) ? post?.repostOf : post;
  const { timestamp } = targetPost;

  const isBlockedByMe = post.author.operations?.isBlockedByMe;
  const hasBlockedMe = post.author.operations?.hasBlockedMe;

  if (hasBlockedMe) {
    return <PostWarning message={getBlockedMeMessage(post.author)} />;
  }

  if (isBlockedByMe) {
    return <PostWarning message={getBlockedByMeMessage(post.author)} />;
  }

  return (
    <article className="px-5 pt-4 pb-3">
      <PostType post={post} showType />
      <div className="flex items-start gap-x-3">
        <PostAvatar post={post} />
        <div className="flex-1 min-w-0">
          <PostHeader post={targetPost} />
          {targetPost.isDeleted ? (
            <>
              <div className="mt-2 mb-3">This post has been deleted.</div>
              <div className="my-3 flex items-center text-gray-500 text-sm dark:text-gray-200">
                {dayjs(timestamp).format("h:mm A · MMM D, YYYY")}
              </div>
            </>
          ) : (
            <>
              <PostBody
                contentClassName="full-page-post-markup"
                post={targetPost}
              />
              <div className="my-3 flex items-center text-gray-500 text-sm dark:text-gray-200">
                {dayjs(timestamp).format("h:mm A · MMM D, YYYY")}
                {targetPost.isEdited ? " · Edited" : null}
                {targetPost.app?.metadata?.name
                  ? ` · ${targetPost.app?.metadata?.name}`
                  : null}
              </div>
            </>
          )}
          <PostStats post={targetPost} />
          <div className="divider mb-5" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <PostActions post={targetPost} showCount />
        {hasHiddenComments ? (
          <div className="mt-2">
            <button
              aria-label="Like"
              className={cn(
                showHiddenComments
                  ? "text-black hover:bg-gray-500/20"
                  : "text-gray-500 hover:bg-gray-300/20 dark:text-gray-200",
                "rounded-full p-1.5 outline-offset-2"
              )}
              onClick={() => setShowHiddenComments(!showHiddenComments)}
              type="button"
            >
              <Tooltip
                content={
                  showHiddenComments
                    ? "Hide hidden comments"
                    : "Show hidden comments"
                }
                placement="top"
                withDelay
              >
                <QueueListIcon className="size-5" />
              </Tooltip>
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default FullPost;
