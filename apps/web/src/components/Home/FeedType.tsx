import { HomeFeedType } from "@slice/data/enums";
import New from "@/components/Shared/Badges/New";
import { Tabs } from "@/components/Shared/UI";
import { useHomeTabStore } from "@/store/persisted/useHomeTabStore";
import { memo } from "react";

const FeedType = () => {
  const { feedType, setFeedType } = useHomeTabStore();

  const tabs = [
    { name: "Following", type: HomeFeedType.FOLLOWING },
    // { name: "Highlights", type: HomeFeedType.HIGHLIGHTS }, // Ẩn Highlights tab
    { name: "For You", suffix: <New />, type: HomeFeedType.FORYOU }
  ];

  return (
    <Tabs
      active={feedType}
      className="flex justify-center gap-4"
      layoutId="home_tab"
      setActive={(type) => setFeedType(type as HomeFeedType)}
      tabs={tabs}
    />
  );
};

export default memo(FeedType);
