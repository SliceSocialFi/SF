import getAvatar from "@slice/helpers/getAvatar";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Card, Image } from "@/components/Shared/UI";
import { usePostStore } from "@/store/non-persisted/post/usePostStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import NewPublication from "./NewPublication";
import ComposerPanel from "./ComposerPanel";

interface NewPostProps { feed?: string; }

const NewPost = ({ feed }: NewPostProps) => {
  const [searchParams] = useSearchParams();
  const text = searchParams.get("text");
  const url = searchParams.get("url");
  const via = searchParams.get("via");

  const { currentAccount } = useAccountStore();
  const { setPostContent, postContent } = usePostStore(); // << lấy nội dung hiện có (đổi tên nếu khác)

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (!mounted) {
      setMounted(true);
      setTimeout(() => setOpen(true), 0);
    } else {
      setOpen(true);
    }
  };

  const handleExited = () => setMounted(false);
  const handleDismiss = () => setOpen(false);

  useEffect(() => {
    if (text) {
      const content = `${text}${url ? `\n\n${url}` : ""}${via ? `\n\nvia @${via}` : ""}`;
      if (!mounted) setMounted(true);
      requestAnimationFrame(() => setOpen(true));
      setPostContent(content);
    }
  }, [text, url, via, mounted, setPostContent]);

  const hasContent = Boolean(postContent && postContent.trim().length > 0);

  if (mounted) {
    return (
      <div className="px-3 py-3">
        <ComposerPanel
          isOpen={open}
          onDismiss={handleDismiss}
          onExited={handleExited}
          disableDismiss={hasContent}
        >
          <NewPublication 
            feed={feed}
            panelProps={{
              isOpen: open,
              onDismiss: handleDismiss,
              onExited: handleExited,
              disableDismiss: hasContent,
            }}
          />
        </ComposerPanel>
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <Card
        className="cursor-pointer px-5 pt-4 pb-3 transition-all duration-200 hover:shadow-sm"
        onClick={handleOpen}
      >
        <div className="flex items-center space-x-3">
          <Image
            alt={currentAccount?.address}
            className="size-11 cursor-pointer rounded-full border border-gray-200 bg-gray-200 dark:border-gray-700"
            height={44}
            src={(currentAccount as any)?.metadata?.picture || "/default-avatar.png"}
            width={44}
          />
          <span className="text-gray-500 dark:text-gray-200">What's new?!</span>
        </div>
      </Card>
    </div>
  );
};

export default NewPost;
