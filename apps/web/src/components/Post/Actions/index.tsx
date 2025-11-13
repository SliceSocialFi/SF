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
    <span
      className="mt-3 flex w-full flex-wrap items-center justify-between gap-3"
      onClick={stopEventPropagation}
    >
      <span className="flex items-center gap-x-6">
        <span className="post-action post-action-comment">
          <Comment post={targetPost} showCount={showCount} />
        </span>

        <span className="post-action post-action-repost">
          <ShareMenu post={post} showCount={showCount} />
        </span>

        <span className="post-action post-action-like">
          <Like post={targetPost} showCount={showCount} />
        </span>

        {canAct && !showCount ? (
          <span className="post-action post-action-collect">
            <CollectAction post={targetPost} />
          </span>
        ) : null}

        <span className="post-action post-action-tip">
          <TipAction post={targetPost} showCount={showCount} />
        </span>
      </span>

      {canAct ? (
        <span className="post-action post-action-collect">
          <SmallCollectButton post={targetPost} />
        </span>
      ) : null}
    </span>
  );
};

export default memo(PostActions);
