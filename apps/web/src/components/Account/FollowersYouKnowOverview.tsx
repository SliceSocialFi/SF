import { TRANSFORMS } from "@slice/data/constants";
import getAccount from "@slice/helpers/getAccount";
import getAvatar from "@slice/helpers/getAvatar";
import { useFollowersYouKnowQuery } from "@slice/indexer";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import FollowersYouKnow from "@/components/Shared/Modal/FollowersYouKnow";
import FollowersYouKnowShimmer from "@/components/Shared/Shimmer/FollowersYouKnowShimmer";
import { Modal, StackedAvatars } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface FollowersYouKnowOverviewProps {
  username: string;
  address: string;
}

const Wrapper = ({
  children,
  accounts,
  address,
  username,
  onClick
}: {
  children: ReactNode;
  accounts: any[];
  address: string;
  username: string;
  onClick: () => void;
}) => (
  <button
    className="flex cursor-pointer items-center gap-x-2 text-sm text-gray-500 dark:text-gray-200"
    onClick={onClick}
    type="button"
  >
    <StackedAvatars
      avatars={accounts.map((account) =>
        getAvatar(account.follower, TRANSFORMS.AVATAR_TINY)
      )}
      limit={3}
    />
    <div className="text-left">
      <span>Followed by </span>
      {children}
    </div>
  </button>
);

const FollowersYouKnowOverview = ({
  username,
  address
}: FollowersYouKnowOverviewProps) => {
  const _location = useLocation();
  const { currentAccount } = useAccountStore();
  const [showMutualFollowersModal, setShowMutualFollowersModal] =
    useState(false);

  useEffect(() => {
    setShowMutualFollowersModal(false);
  }, []);

  const { data, error, loading } = useFollowersYouKnowQuery({
    skip: !address || !currentAccount?.address,
    variables: {
      request: { observer: currentAccount?.address, target: address }
    }
  });

  const accounts = data?.followersYouKnow?.items.slice(0, 4) ?? [];

  const accountNames = useMemo(() => {
    const names = accounts.map((account) => getAccount(account.follower).name);
    const count = names.length - 3;

    if (!names.length) return null;
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    if (names.length === 3)
      return `${names[0]}, ${names[1]}${count === 0 ? " and " : ", "}${names[2]}${count ? ` and ${count} other${count === 1 ? "" : "s"}` : ""}`;

    return `${names[0]}, ${names[1]}, ${names[2]} and others`;
  }, [accounts]);

  if (loading) {
    return <FollowersYouKnowShimmer />;
  }

  if (!accounts.length || error) {
    return null;
  }

  return (
    <>
      <Wrapper
        accounts={accounts}
        address={address}
        username={username}
        onClick={() => setShowMutualFollowersModal(true)}
      >
        {accountNames}
      </Wrapper>
      <Modal
        onClose={() => setShowMutualFollowersModal(false)}
        show={showMutualFollowersModal}
        title="Mutual Followers"
      >
        <FollowersYouKnow address={address} username={username} />
      </Modal>
    </>
  );
};

export default FollowersYouKnowOverview;
