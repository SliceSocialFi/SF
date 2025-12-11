import { EyeIcon } from "@heroicons/react/24/outline";
import { getSrc } from "@livepeer/react/external";
import getPostData from "@slice/helpers/getPostData";
import getURLs from "@slice/helpers/getURLs";
import { isRepost } from "@slice/helpers/postHelpers";
import type { AnyPostFragment } from "@slice/indexer";
import { memo } from "react";
import Quote from "@/components/Shared/Embed/Quote";
import Markup from "@/components/Shared/Markup";
import Attachments from "@/components/Shared/Post/Attachments";
import Oembed from "@/components/Shared/Post/Oembed";
import PostLink from "@/components/Shared/Post/PostLink";
import Video from "@/components/Shared/Post/Video";
import { H6 } from "@/components/Shared/UI";
import cn from "@/helpers/cn";

interface PostBodyProps {
  contentClassName?: string;
  post: AnyPostFragment;
  quoted?: boolean;
  showMore?: boolean;
}

const PostBody = ({
  contentClassName = "",
  post,
  quoted = false,
  showMore = false
}: PostBodyProps) => {
  const targetPost = isRepost(post) ? post.repostOf : post;
  const { metadata } = targetPost;

  const filteredContent = getPostData(metadata)?.content || "";
  const filteredAttachments = getPostData(metadata)?.attachments || [];
  const filteredAsset = getPostData(metadata)?.asset;

  const canShowMore = filteredContent?.length > 450 && showMore;
  const urls = getURLs(filteredContent);
  const hasURLs = urls.length > 0;

  let content = filteredContent;

  if (canShowMore) {
    const lines = content?.split("\n");
    if (lines && lines.length > 0) {
      content = lines.slice(0, 5).join("\n");
    }
  }

  // Show live if it's there
  const showLive = metadata.__typename === "LivestreamMetadata";
  // Show attachments if they're there
  const showAttachments = filteredAttachments.length > 0 || filteredAsset;
  // Show sharing link
  const showSharingLink = metadata.__typename === "LinkMetadata";
  const showOembed =
    !showSharingLink &&
    hasURLs &&
    !showLive &&
    !showAttachments &&
    !quoted &&
    !targetPost.quoteOf;

  return (
    <div className="break-words w-full max-w-full">
      <Markup
        className={cn(
          { "line-clamp-5": canShowMore },
          "markup linkify break-words",
          contentClassName
        )}
        mentions={targetPost.mentions}
      >
        {content}
      </Markup>
      {canShowMore ? (
        <H6 className="mt-4 flex items-center space-x-1 text-gray-500 dark:text-gray-200">
          <EyeIcon className="size-4" />
          <PostLink post={post}>Show more</PostLink>
        </H6>
      ) : null}
      {/* Attachments and Quotes */}
      {showAttachments ? (
        <div className="mt-3 max-w-full overflow-hidden">
          <Attachments asset={filteredAsset} attachments={filteredAttachments} />
        </div>
      ) : null}
      {showLive ? (
        <div className="mt-3 max-w-full overflow-hidden">
          <Video src={getSrc(metadata.liveUrl || metadata.playbackUrl)} />
        </div>
      ) : null}
      {showOembed ? <Oembed url={urls[0]} /> : null}
      {showSharingLink ? <Oembed url={metadata.sharingLink} /> : null}
      {targetPost.quoteOf ? <Quote post={targetPost.quoteOf} /> : null}
    </div>
  );
};

export default memo(PostBody);
