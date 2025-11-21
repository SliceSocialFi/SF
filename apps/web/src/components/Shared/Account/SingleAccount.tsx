import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import getAccount from "@slice/helpers/getAccount";
import getAvatar from "@slice/helpers/getAvatar";
import type { AccountFragment } from "@slice/indexer";
import { memo } from "react";
import Markup from "@/components/Shared/Markup";
import Slug from "@/components/Shared/Slug";
import { Image } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import getMentions from "@/helpers/getMentions";
import AccountLink from "./AccountLink";
import AccountPreview from "./AccountPreview";
import FollowUnfollowButton from "./FollowUnfollowButton";

interface SingleAccountProps {
  hideFollowButton?: boolean;
  hideUnfollowButton?: boolean;
  isBig?: boolean;
  isVerified?: boolean;
  linkToAccount?: boolean;
  account: AccountFragment;
  showBio?: boolean;
  showUserPreview?: boolean;
}

const SingleAccount = ({
  hideFollowButton = false,
  hideUnfollowButton = false,
  isBig = false,
  isVerified = false,
  linkToAccount = true,
  account,
  showBio = false,
  showUserPreview = true
}: SingleAccountProps) => {
  const UserAvatar = () => (
    <Image
      alt={account.address}
      className={cn(
        isBig ? "size-14" : "size-11",
        "rounded-full border border-gray-200 bg-gray-200 dark:border-gray-700"
      )}
      height={isBig ? 56 : 44}
      loading="lazy"
      src={(account as any)?.metadata?.picture || "/default-avatar.png"}
      width={isBig ? 56 : 44}
    />
  );

  const UserName = () => (
    <div className="min-w-0">
      <div
        className={cn(
          "flex items-center gap-x-1.5 min-w-0",
          isBig && "font-bold"
        )}
      >
        <div className="truncate font-semibold">
          {getAccount(account).name}
        </div>
        {(isVerified || account.hasSubscribed) && (
          <CheckBadgeIcon className="size-4 text-brand-500" />
        )}
      </div>
      <Slug
        className="text-sm truncate"
        slug={getAccount(account).usernameWithPrefix}
      />
    </div>
  );

  const AccountInfo = () => (
    <AccountPreview
      address={account.address}
      showUserPreview={showUserPreview}
      username={account.username?.localName}
    >
      <div className="flex min-w-0 items-center gap-x-3">
        <UserAvatar />
        <UserName />
      </div>
    </AccountPreview>
  );

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-x-3">
        <div className="flex-1 min-w-0 truncate">
          {linkToAccount && account.address ? (
            <AccountLink account={account}>
              <AccountInfo />
            </AccountLink>
          ) : (
            <AccountInfo />
          )}
        </div>

        <div className="flex-shrink-0">
          <FollowUnfollowButton
            account={account}
            hideFollowButton={hideFollowButton}
            hideUnfollowButton={hideUnfollowButton}
            small
          />
        </div>
      </div>

      {showBio && account?.metadata?.bio && (
        <div
          className={cn(
            isBig ? "text-base" : "text-sm",
            "mt-2",
            "linkify leading-6"
          )}
          style={{ wordBreak: "break-word" }}
        >
          <Markup mentions={getMentions(account.metadata.bio)}>
            {account?.metadata.bio}
          </Markup>
        </div>
      )}
    </div>
  );
};

export default memo(SingleAccount);
