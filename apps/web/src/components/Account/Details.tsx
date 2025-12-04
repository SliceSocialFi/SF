import { CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { STATIC_IMAGES_URL, TRANSFORMS } from "@slice/data/constants";
import getAccount from "@slice/helpers/getAccount";
import getAvatar from "@slice/helpers/getAvatar";
import type { AccountFragment } from "@slice/indexer";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import FollowUnfollowButton from "@/components/Shared/Account/FollowUnfollowButton";
import TipButton from "@/components/Shared/Account/TipButton";
import Markup from "@/components/Shared/Markup";
import Slug from "@/components/Shared/Slug";
import { Button, H3, Image, LightBox, Tooltip } from "@/components/Shared/UI";
import getAccountAttribute from "@/helpers/getAccountAttribute";
import getFavicon from "@/helpers/getFavicon";
import getMentions from "@/helpers/getMentions";
import { useTheme } from "@/hooks/useTheme";
import { useProModalStore } from "@/store/non-persisted/modal/useProModalStore";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { apiClient } from "@/lib/apiClient";
import Followerings from "./Followerings";
import FollowersYouKnowOverview from "./FollowersYouKnowOverview";
import AccountMenu from "./Menu";
import MetaDetails from "./MetaDetails";

interface DetailsProps {
  isBlockedByMe: boolean;
  hasBlockedMe: boolean;
  account: AccountFragment;
}

const Details = ({
  isBlockedByMe = false,
  hasBlockedMe = false,
  account
}: DetailsProps) => {
  const navigate = useNavigate();
  const { currentAccount } = useAccountStore();
  const { setShow: setShowProModal } = useProModalStore();
  const [showLightBox, setShowLightBox] = useState<boolean>(false);
  const { theme } = useTheme();
  const [reputation, setReputation] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);

  useEffect(() => {
    const loadUserReputation = async () => {
      try {
        if (!account?.address) return;
        const data = await apiClient.getUser(account.address);
        setReputation(typeof data?.reputationScore === "number" ? data.reputationScore : Number(data?.reputation) || 0);
        setLevel(Number(data?.level) || 1);
      } catch (err) {
        console.error("Failed to load user reputation", err);
      }
    };
    loadUserReputation();
  }, [account?.address]);

  const handleShowLightBox = useCallback(() => {
    setShowLightBox(true);
  }, []);

  const handleCloseLightBox = useCallback(() => {
    setShowLightBox(false);
  }, []);

  const renderAccountAttribute = (
    attribute: "location" | "website" | "x",
    icon: ReactNode
  ) => {
    if (isBlockedByMe || hasBlockedMe) return null;

    const value = getAccountAttribute(attribute, account?.metadata?.attributes);
    if (!value) return null;

    return (
      <MetaDetails icon={icon}>
        <Link
          rel="noreferrer noopener"
          target="_blank"
          to={
            attribute === "website"
              ? `https://${value.replace(/https?:\/\//, "")}`
              : `https://x.com/${value.replace("https://x.com/", "")}`
          }
        >
          {value.replace(/https?:\/\//, "")}
        </Link>
      </MetaDetails>
    );
  };

  const avatarUrl = getAvatar(account, TRANSFORMS.AVATAR_BIG);

  return (
    <div className="mb-4 space-y-3 px-5 md:px-0">
      <div className="flex items-start justify-between">
        <div className="-mt-14 sm:-mt-24 relative ml-5 size-20 sm:size-36">
          <img
            alt={account.address}
            className="!size-20 cursor-pointer rounded-full bg-gray-200 ring-4 ring-gray-50 sm:!size-36 dark:bg-gray-700 dark:ring-black object-cover"
            onClick={handleShowLightBox}
            src={avatarUrl}
          />
          <LightBox
            images={[getAvatar(account, TRANSFORMS.EXPANDED_AVATAR)]}
            onClose={handleCloseLightBox}
            show={showLightBox}
          />
        </div>
        <div className="flex items-center gap-x-2 pt-2">
          {currentAccount?.address === account.address ? (
            <Button onClick={() => navigate("/settings")} outline className="button-animated">
              Edit Account
            </Button>
          ) : isBlockedByMe || hasBlockedMe ? null : (
            <FollowUnfollowButton account={account} />
          )}
          {!isBlockedByMe && !hasBlockedMe && <TipButton account={account} />}
          <AccountMenu account={account} />
        </div>
      </div>
      <div className="space-y-1 py-2">
        <div className="flex items-center gap-1.5">
          <H3 className="truncate">{getAccount(account).name}</H3>
          {account.hasSubscribed ? (
            <Tooltip content="Verified" placement="right">
              <CheckBadgeIcon className="size-5 text-brand-500" />
            </Tooltip>
          ) : currentAccount?.address === account.address ? (
            <button
              className="ml-1 flex items-center gap-x-1 rounded-full border border-gray-200 px-2 py-0.5 font-semibold text-xs dark:border-gray-700"
              onClick={() => setShowProModal(true)}
              type="button"
            >
              <CheckBadgeIcon className="size-4 text-brand-500" />
              Get Verified
            </button>
          ) : null}
        </div>
        <div className="flex items-center space-x-3">
          <Slug
            className="text-sm sm:text-base"
            slug={getAccount(account).usernameWithPrefix}
          />
          {account.operations?.isFollowingMe ? (
            <div className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
              Follows you
            </div>
          ) : null}
        </div>
      </div>
      {!isBlockedByMe && !hasBlockedMe && account?.metadata?.bio ? (
        <div className="markup linkify">
          <Markup mentions={getMentions(account?.metadata.bio)}>
            {account?.metadata.bio}
          </Markup>
        </div>
      ) : null}
      <div className="space-y-5">
        <Followerings account={account} />
        {!isBlockedByMe &&
        !hasBlockedMe &&
        currentAccount?.address !== account.address ? (
          <FollowersYouKnowOverview
            address={account.address}
            username={getAccount(account).username}
          />
        ) : null}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {!isBlockedByMe &&
            !hasBlockedMe &&
            getAccountAttribute("location", account?.metadata?.attributes) && (
              <MetaDetails icon={<MapPinIcon className="size-4" />}>
                {getAccountAttribute("location", account?.metadata?.attributes)}
              </MetaDetails>
            )}
          {renderAccountAttribute(
            "website",
            <img
              alt="Website"
              className="size-4 rounded-full"
              height={16}
              src={getFavicon(
                getAccountAttribute("website", account?.metadata?.attributes)
              )}
              width={16}
            />
          )}
          {renderAccountAttribute(
            "x",
            <Image
              alt="X Logo"
              className="size-4"
              height={16}
              src={`${STATIC_IMAGES_URL}/brands/${theme === "dark" ? "x-dark.png" : "x-light.png"}`}
              width={16}
            />
          )}
          <MetaDetails icon={<CalendarIcon className="size-4" />}>
            Joined {dayjs(account.createdAt).format("MMM YYYY")}
          </MetaDetails>
        </div>
        
        {/* Reputation Progress Bar - chỉ hiển thị cho chính chủ account */}
        {currentAccount?.address === account.address && (
          <div className="space-y-2 pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Reputation progress
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {reputation}
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, reputation))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Level {level}</span>
              <span>Reach 100 to level up</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Details;
