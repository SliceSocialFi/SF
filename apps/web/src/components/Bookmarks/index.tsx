import type { MainContentFocus } from "@slice/indexer";
import { useState } from "react";
import NotLoggedIn from "@/components/Shared/NotLoggedIn";
import PageLayout from "@/components/Shared/PageLayout";
import ContentFeedType from "@/components/Shared/Post/ContentFeedType";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import BookmarksFeed from "./BookmarksFeed";
import StickyFeedBar from "../Home/StickyFeedbar";

const Bookmarks = () => {
  const { currentAccount } = useAccountStore();
  const [focus, setFocus] = useState<MainContentFocus>();

  if (!currentAccount) {
    return <NotLoggedIn />;
  }

  return (
    <PageLayout title="Bookmarks">
      <StickyFeedBar>
        <ContentFeedType
        focus={focus}
        layoutId="bookmarks_tab"
        setFocus={setFocus}
      />
      </StickyFeedBar>
      <BookmarksFeed focus={focus} />
    </PageLayout>
  );
};

export default Bookmarks;
