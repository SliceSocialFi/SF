import type { MainContentFocus } from "@slice/indexer";
import { useState } from "react";
import Footer from "@/components/Shared/Footer";
import PageLayout from "@/components/Shared/PageLayout";
import MobileHeader from "@/components/Shared/MobileHeader";
import ContentFeedType from "@/components/Shared/Post/ContentFeedType";
import WhoToFollow from "@/components/Shared/Sidebar/WhoToFollow";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { useMobileDrawerModalStore } from "@/store/non-persisted/modal/useMobileDrawerModalStore";
import ExploreFeed from "./ExploreFeed";
import StickyFeedBar from "../Home/StickyFeedbar";

const Explore = () => {
  const { currentAccount } = useAccountStore();
  const { show: showMobileDrawer } = useMobileDrawerModalStore();
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
      <div className="space-y-3">
        {!showMobileDrawer && (
          <StickyFeedBar
            header={<MobileHeader searchPlaceholder="Search users..." />}
            tabs={
              <ContentFeedType
                focus={focus}
                layoutId="explore_tab"
                setFocus={setFocus}
              />
            }
          />
        )}
        <ExploreFeed focus={focus} />
      </div>
    </PageLayout>
  );
};

export default Explore;
