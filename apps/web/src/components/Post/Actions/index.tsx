import { isRepost } from "@slice/helpers/postHelpers";
import type { AnyPostFragment } from "@slice/indexer";
import { memo } from "react";

import CollectAction from "@/components/Post/OpenAction/CollectAction";
import SmallCollectButton from "@/components/Post/OpenAction/CollectAction/SmallCollectButton";
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
      className="mt-3 flex w-full items-center justify-center gap-x-4 sm:justify-between sm:gap-x-6 -ml-14 pl-14" 
      onClick={stopEventPropagation}
    >
      {/* Nhóm 4 action chính – luôn canh GIỮA trên mobile */}
      <div className="flex items-center gap-x-4 sm:gap-x-6">
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

        {canAct && !showCount ? (
          <span className="post-action post-action-collect">
            <CollectAction post={targetPost} />
          </span>
        ) : null}
      </div>

      {canAct ? (
        <span className="post-action post-action-collect hidden sm:inline-flex ml-auto shrink-0">
          <SmallCollectButton post={targetPost} />
        </span>
      ) : null}
    </div>
  );
};

export default memo(PostActions);
