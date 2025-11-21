import { HomeFeedType } from "@slice/data/enums";
import NewPost from "@/components/Composer/NewPost";
import ExploreFeed from "@/components/Explore/ExploreFeed";
import PageLayout from "@/components/Shared/PageLayout";
import MobileHeader from "@/components/Shared/MobileHeader";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";
import FeedType from "./FeedType";
import ForYou from "./ForYou";
import Hero from "./Hero";
import Highlights from "./Highlights";
import Timeline from "./Timeline";
import StickyFeedBar from "./StickyFeedbar";

const Home = () => {
  const { currentAccount } = useAccountStore();
  const { feedType } = useHomeTabStore();
  const loggedInWithAccount = Boolean(currentAccount);

  return (
    <PageLayout>
      {loggedInWithAccount ? (
        <>
          <StickyFeedBar>
            <MobileHeader searchPlaceholder="Search users..." />
            <FeedType />
          </StickyFeedBar>  
          <NewPost />
          {feedType === HomeFeedType.FOLLOWING ? (
            <Timeline />
          ) : feedType === HomeFeedType.HIGHLIGHTS ? (
            <Highlights />
          ) : feedType === HomeFeedType.FORYOU ? (
            <ForYou />
          ) : null}
        </>
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
