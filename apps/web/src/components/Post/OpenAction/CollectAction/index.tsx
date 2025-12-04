import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import type { PostFragment } from "@slice/indexer";
import { AnimateNumber } from "motion-plus-react";
import plur from "plur";
import { useState } from "react";
import { Modal, Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import humanize from "@/helpers/humanize";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import CollectActionBody from "./CollectActionBody";

interface CollectActionProps {
  post: PostFragment;
}

const CollectAction = ({ post }: CollectActionProps) => {
  const { currentAccount } = useAccountStore();
  const [showCollectModal, setShowCollectModal] = useState(false);
  const { collects } = post.stats;

  // Disable collect nếu là bài đăng của chính user
  const isOwnPost = currentAccount?.address === post?.author?.address;

  return (
    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-200">
      <button
        aria-label="Collect"
        className={cn(
          "rounded-full p-1.5 outline-offset-2",
          isOwnPost
            ? "cursor-not-allowed opacity-50"
            : "hover:bg-gray-300/20"
        )}
        disabled={isOwnPost}
        onClick={() => setShowCollectModal(true)}
        type="button"
      >
        <Tooltip
          content={
            isOwnPost
              ? "Cannot collect your own post"
              : `${humanize(collects)} ${plur("Collect", collects)}`
          }
          placement="top"
          withDelay
        >
          <ShoppingBagIcon className="w-[15px] sm:w-[18px]" />
        </Tooltip>
      </button>
      {collects > 0 ? (
        <AnimateNumber
          className="text-[11px] sm:text-xs"
          format={{ notation: "compact" }}
          key={`collect-count-${post.id}`}
          transition={{ type: "tween" }}
        >
          {collects}
        </AnimateNumber>
      ) : null}
      <Modal
        onClose={() => setShowCollectModal(false)}
        show={showCollectModal}
        title="Collect"
      >
        <CollectActionBody
          post={post}
          setShowCollectModal={setShowCollectModal}
        />
      </Modal>
    </div>
  );
};

export default CollectAction;
