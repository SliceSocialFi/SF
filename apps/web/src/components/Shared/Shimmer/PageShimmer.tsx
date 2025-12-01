import { memo } from "react";
import PageLayout from "@/components/Shared/PageLayout";
import PostsShimmer from "./PostsShimmer";
import Skeleton from "@/components/Shared/Skeleton";

const PageShimmer = () => {
  return (
    <PageLayout>
      {/* Skeleton cho tabs */}
      <div className="flex justify-center px-3 py-1 bg-">
        <Skeleton className="h-10 w-64 rounded-full" />
      </div>
      
      {/* Skeleton cho NewPost composer */}
      <div className="px-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#000000]">
          <div className="flex items-center space-x-3">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-5 flex-1 rounded-full" />
          </div>
        </div>
      </div>
      
      <PostsShimmer />
    </PageLayout>
  );
};

export default memo(PageShimmer);
