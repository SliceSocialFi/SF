import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import type { PostFragment } from "@slice/indexer";
import { AnimateNumber } from "motion-plus-react";
import { TipIcon } from "@/components/Shared/Icons/TipIcon";
import MenuTransition from "@/components/Shared/MenuTransition";
import TipMenu from "@/components/Shared/TipMenu";
import { Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import stopEventPropagation from "@/helpers/stopEventPropagation";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface TipActionProps {
  post: PostFragment;
  showCount: boolean;
}

const TipAction = ({ post, showCount }: TipActionProps) => {
  const { currentAccount } = useAccountStore();
  const hasTipped = post.operations?.hasTipped;
  const tips = post.stats.tips || 0;

  const iconClassName = showCount
    ? "w-[17px] sm:w-[20px]"
    : "w-[15px] sm:w-[18px]";

  const hasVisibleCount = tips > 0 && !showCount;

  // Disable tip nếu là bài đăng của chính user
  const isOwnPost = currentAccount?.address === post?.author?.address;

  return (
    <div
      className={cn(
        "flex items-center space-x-1 text-gray-500 dark:text-gray-200",
        hasTipped && "post-action--active"
      )}
    >
      <Menu as="div" className="relative">
        <MenuButton
          aria-label="Tip"
          className={cn(
            "rounded-full p-1.5 outline-offset-2",
            isOwnPost 
              ? "cursor-not-allowed opacity-50" 
              : "hover:bg-gray-300/20 dark:hover:bg-gray-700/40"
          )}
          disabled={isOwnPost}
          onClick={stopEventPropagation}
        >
          <Tooltip content={isOwnPost ? "Cannot tip your own post" : "Tip"} placement="top" withDelay>
            <TipIcon className={cn("post-action-icon", iconClassName)} />
          </Tooltip>
        </MenuButton>
        {!isOwnPost && (
          <MenuTransition>
            <MenuItems
              anchor="bottom start"
              className="z-[5] mt-2 w-max origin-top-left rounded-xl border border-gray-200 bg-white shadow-xs focus:outline-hidden dark:border-gray-700 dark:bg-[#121212]"
              static
            >
              <MenuItem>
                {({ close }) => <TipMenu closePopover={close} post={post} />}
              </MenuItem>
            </MenuItems>
          </MenuTransition>
        )}
      </Menu>

      <span className="post-action-count text-gray-500 dark:text-gray-200">
        {hasVisibleCount ? (
          <AnimateNumber
            format={{ notation: "compact" }}
            key={`tip-count-${post.id}`}
            transition={{ type: "tween" }}
          >
            {tips}
          </AnimateNumber>
        ) : (
          <span className="opacity-0">0</span>
        )}
      </span>
    </div>
  );
};


export default TipAction;
