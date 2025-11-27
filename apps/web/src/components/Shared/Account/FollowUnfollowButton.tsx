import type { AccountFragment } from "@slice/indexer";
import stopEventPropagation from "@/helpers/stopEventPropagation";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import FollowWithRulesCheck from "./FollowWithRulesCheck";
import Unfollow from "./Unfollow";

interface FollowUnfollowButtonProps {
  buttonClassName?: string;
  hideFollowButton?: boolean;
  hideUnfollowButton?: boolean;
  account: AccountFragment;
  small?: boolean;
  unfollowTitle?: string;
}

const FollowUnfollowButton = ({
  buttonClassName = "",
  hideFollowButton = false,
  hideUnfollowButton = false,
  account,
  small = false,
  unfollowTitle = "Following"
}: FollowUnfollowButtonProps) => {
  const { currentAccount } = useAccountStore();

  if (currentAccount?.address === account.address) {
    return null;
  }

  // Thêm class hiệu ứng viền cho tất cả nút (Follow / Following)
  const animatedButtonClass = `button-animated ${buttonClassName}`.trim();

  return (
    <div className="contents" onClick={stopEventPropagation}>
      {!hideFollowButton &&
        (account.operations?.isFollowedByMe ? null : (
          <FollowWithRulesCheck
            account={account}
            buttonClassName={animatedButtonClass}
            small={small}
          />
        ))}

      {!hideUnfollowButton &&
        (account.operations?.isFollowedByMe ? (
          <Unfollow
            account={account}
            buttonClassName={animatedButtonClass}
            small={small}
            title={unfollowTitle}
          />
        ) : null)}
    </div>
  );
};

export default FollowUnfollowButton;
