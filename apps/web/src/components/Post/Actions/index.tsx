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
        {/* COMMENT */}
        <span className="post-action">
          <Comment post={targetPost} showCount={showCount} />
        </span>

        {/* SHARE */}
        <span className="post-action">
          <ShareMenu post={post} showCount={showCount} />
        </span>

        {/* LIKE */}
        <span className="post-action">
          <Like post={targetPost} showCount={showCount} />
        </span>

        {/* COLLECT */}
        {canAct && !showCount ? (
          <span className="post-action">
            <CollectAction post={targetPost} />
          </span>
        ) : null}

        {/* TIP */}
        <span className="post-action">
          <TipAction post={targetPost} showCount={showCount} />
        </span>
      </span>

      {/* SMALL COLLECT BUTTON */}
      {canAct ? (
        <span className="post-action">
          <SmallCollectButton post={targetPost} />
        </span>
      ) : null}
    </span>
  );
};

export default memo(PostActions);
