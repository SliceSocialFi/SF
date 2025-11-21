import { isRepost } from "@slice/helpers/postHelpers";
import type { AnyPostFragment } from "@slice/indexer";
import { memo } from "react";

import CollectAction from "@/components/Post/OpenAction/CollectAction";
import TipAction from "@/components/Post/OpenAction/TipAction";
import stopEventPropagation from "@/helpers/stopEventPropagation";
import Comment from "./Comment";
import Like from "./Like";
import ShareMenu from "./Share";

interface PostActionsProps {
  post: AnyPostFragment;
  showCount?: boolean;
}

const PostActions = ({ post, showCount = false }: PostActionsProps) => {
  const targetPost = isRepost(post) ? post.repostOf : post;

  const hasPostAction = (targetPost.actions?.length || 0) > 0;
  const canAct =
    hasPostAction &&
    targetPost.actions.some(
      (action) => action.__typename === "SimpleCollectAction"
    );

  return (
    <div
      className="mt-3 flex w-full items-center gap-x-3 sm:gap-x-4 justify-start sm:-ml-14 sm:pl-14 sm:justify-between" 
      onClick={stopEventPropagation}
    >
      {/* Nhóm 4 action chính */}
      <div className="flex items-center gap-x-3 sm:gap-x-3">
        <span className="post-action post-action-comment">
          <Comment post={targetPost} showCount={showCount} />
        </span>

        <span className="post-action post-action-repost">
          <ShareMenu post={targetPost} showCount={showCount} />
        </span>

        <span className="post-action post-action-like">
          <Like post={targetPost} showCount={showCount} />
        </span>

        <span className="post-action post-action-tip">
          <TipAction post={targetPost} showCount={showCount} />
        </span>
      </div>

      {canAct && !showCount ? (
        <span className="post-action post-action-collect">
          <CollectAction post={targetPost} />
        </span>
      ) : null}
    </div>
  );
};

export default memo(PostActions);
