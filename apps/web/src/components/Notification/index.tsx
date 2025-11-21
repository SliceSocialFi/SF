import { NotificationFeedType } from "@slice/data/enums";
import { useState } from "react";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import FeedType from "./FeedType";
import List from "./List";
import StickyFeedBar from "../Home/StickyFeedbar";

const Notification = () => {
  const { currentAccount } = useAccountStore();
  const [feedType, setFeedType] = useState<NotificationFeedType>(
    NotificationFeedType.All
  );

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Notifications">
      <StickyFeedBar>
        <FeedType feedType={feedType} setFeedType={setFeedType} />
      </StickyFeedBar>
      <List feedType={feedType} />
    </PageLayout>
  );
};

export default Notification;
