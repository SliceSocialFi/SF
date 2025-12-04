import { memo } from "react";
import PageLayout from "@/components/Shared/PageLayout";
import PostsShimmer from "./PostsShimmer";
import Skeleton from "@/components/Shared/Skeleton";

const PageShimmer = () => {
  return (
    <PageLayout>
      {/* Skeleton cho tabs */}
      <div className="flex justify-center px-3">
        <div className="h-10 w-64 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 px-4">
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
      </div>
      
      {/* Skeleton cho NewPost composer */}
      <div className="px-3">
        <div className="h-[68px] w-full rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-700 px-5 pt-4 pb-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-lg" />
          </div>
        </div>
      </div>
      
      <PostsShimmer />
    </PageLayout>
  );
};

export default memo(PageShimmer);
