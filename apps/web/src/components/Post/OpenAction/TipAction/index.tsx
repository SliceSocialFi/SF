import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import type { PostFragment } from "@slice/indexer";
import { AnimateNumber } from "motion-plus-react";
import { TipIcon } from "@/components/Shared/Icons/TipIcon";
import MenuTransition from "@/components/Shared/MenuTransition";
import TipMenu from "@/components/Shared/TipMenu";
import { Tooltip } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import stopEventPropagation from "@/helpers/stopEventPropagation";

interface TipActionProps {
  post: PostFragment;
  showCount: boolean;
}

const TipAction = ({ post, showCount }: TipActionProps) => {
  const hasTipped = post.operations?.hasTipped;
  const { tips = 0 } = post.stats;

  const iconClassName = showCount
    ? "w-[17px] sm:w-[20px]"
    : "w-[15px] sm:w-[18px]";

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
          className="rounded-full p-1.5 outline-offset-2 hover:bg-gray-300/20 dark:hover:bg-gray-700/40"
          onClick={stopEventPropagation}
        >
          <Tooltip content="Tip" placement="top" withDelay>
            <TipIcon
              className={cn("post-action-icon", iconClassName)}
            />
          </Tooltip>
        </MenuButton>

        <MenuTransition>
          <MenuItems
            anchor="bottom start"
            className="z-[5] mt-2 w-max origin-top-left rounded-xl border border-gray-200 bg-white shadow-xs focus:outline-hidden dark:border-gray-700 dark:bg-gray-900"
            static
          >
            <MenuItem>
              {({ close }) => <TipMenu closePopover={close} post={post} />}
            </MenuItem>
          </MenuItems>
        </MenuTransition>
      </Menu>

      {tips > 0 && !showCount && (
        <AnimateNumber
          className={cn(
            "post-action-count w-3 text-[11px] sm:text-xs text-gray-500 dark:text-gray-200"
          )}
          format={{ notation: "compact" }}
          key={`tip-count-${post.id}`}
          transition={{ type: "tween" }}
        >
          {tips}
        </AnimateNumber>
      )}
    </div>
  );
};


export default TipAction;
