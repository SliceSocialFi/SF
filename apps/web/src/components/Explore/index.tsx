import type { MainContentFocus } from "@slice/indexer";
import { useState } from "react";
import Footer from "@/components/Shared/Footer";
import PageLayout from "@/components/Shared/PageLayout";
import ContentFeedType from "@/components/Shared/Post/ContentFeedType";
import WhoToFollow from "@/components/Shared/Sidebar/WhoToFollow";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import ExploreFeed from "./ExploreFeed";
import StickyFeedBar from "../Home/StickyFeedbar";

const Explore = () => {
  const { currentAccount } = useAccountStore();
  const [focus, setFocus] = useState<MainContentFocus>();

  return (
    <PageLayout
      sidebar={
        <>
          {currentAccount ? <WhoToFollow /> : null}
          <Footer />
        </>
      }
      title="Explore"
    >
      
      <div className="sm:px-0 space-y-3">
        
        <StickyFeedBar>
          <ContentFeedType
            focus={focus}
            layoutId="explore_tab"
            setFocus={setFocus}
          />
        </StickyFeedBar>
        <ExploreFeed focus={focus} />
      </div>
    </PageLayout>
  );
};

export default Explore;
