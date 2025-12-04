import type { AnyPostFragment, TimelineItemFragment } from "@slice/indexer";
import { memo } from "react";
import ActionType from "@/components/Home/Timeline/EventType";
import PostWrapper from "@/components/Shared/Post/PostWrapper";
import PostActions from "./Actions";
import HiddenPost from "./HiddenPost";
import PostAvatar from "./PostAvatar";
import PostBody from "./PostBody";
import PostHeader from "./PostHeader";
import PostType from "./Type";

interface SinglePostProps {
  timelineItem?: TimelineItemFragment;
  post: AnyPostFragment;
  showMore?: boolean;
  showType?: boolean;
}

const SinglePost = ({
  timelineItem,
  post,
  showMore = true,
  showType = true
}: SinglePostProps) => {
  const rootPost = timelineItem ? timelineItem?.primary : post;
  const isDeleted = rootPost.isDeleted;

  return (
    <PostWrapper className="cursor-pointer px-5 pt-4 pb-3" post={rootPost}>
      {timelineItem ? (
        <ActionType timelineItem={timelineItem} />
      ) : (
        <PostType post={post} showType={showType} />
      )}
      <div className="flex items-start gap-x-3">
        <PostAvatar post={rootPost} timelineItem={timelineItem} />
        <div className="flex-1 min-w-0">
          <PostHeader post={rootPost} timelineItem={timelineItem} />
          {isDeleted ? (
            <div className="mt-2">This post has been deleted.</div>
          ) : (
            <PostBody post={rootPost} showMore={showMore} />
          )}
        </div>
      </div>
      <div className="sm:flex sm:items-start sm:gap-x-3">
        <div className="hidden sm:block sm:w-[40px]" />
        <div className="flex-1 min-w-0">
          <PostActions post={rootPost} />
        </div>
      </div>
    </PostWrapper>
  );
};

export default memo(SinglePost);
