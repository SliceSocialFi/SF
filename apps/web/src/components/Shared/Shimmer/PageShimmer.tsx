import { memo } from "react";
import PageLayout from "@/components/Shared/PageLayout";
import PostsShimmer from "./PostsShimmer";
import Skeleton from "@/components/Shared/Skeleton";

const PageShimmer = () => {
  return (
    <PageLayout>
      {/* Skeleton cho tabs */}
      <div className="flex justify-center px-3">
        <Skeleton className="h-10 w-64 rounded-full" />
      </div>
      
      {/* Skeleton cho NewPost composer */}
      <div className="px-3">
        <Skeleton className="h-[68px] w-full rounded-xl" />
      </div>
      
      <PostsShimmer />
    </PageLayout>
  );
};

export default memo(PageShimmer);
