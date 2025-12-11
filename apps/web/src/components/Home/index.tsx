import { HomeFeedType } from "@slice/data/enums";
import NewPost from "@/components/Composer/NewPost";
import ExploreFeed from "@/components/Explore/ExploreFeed";
import PageLayout from "@/components/Shared/PageLayout";
import MobileHeader from "@/components/Shared/MobileHeader";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import FeedType from "./FeedType";
import ForYou from "./ForYou";
import Hero from "./Hero";
import Highlights from "./Highlights";
import Timeline from "./Timeline";
import StickyFeedBar from "./StickyFeedbar";

const Home = () => {
  const { currentAccount } = useAccountStore();
  const { feedType } = useHomeTabStore();
  const { show: showMobileDrawer } = useMobileDrawerModalStore();
  const loggedInWithAccount = Boolean(currentAccount);

  console.log('🔴 Home render, feedType:', feedType);

  return (
    <PageLayout>
      {loggedInWithAccount ? (
        <div className="w-full max-w-full space-y-3">
          {!showMobileDrawer && (
            <StickyFeedBar
              header={<MobileHeader searchPlaceholder="Search users..." />}
              tabs={<FeedType />}
            />
          )}
          <NewPost />
          <div className="pb-20 md:pb-0">
            {feedType === HomeFeedType.FOLLOWING ? (
              <Timeline key="following-feed" />
            ) : feedType === HomeFeedType.HIGHLIGHTS ? (
              <Highlights key="highlights-feed" />
            ) : feedType === HomeFeedType.FORYOU ? (
              <ForYou key="foryou-feed" />
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <Hero />
          <ExploreFeed />
        </>
      )}
    </PageLayout>
  );
};

export default Home;
