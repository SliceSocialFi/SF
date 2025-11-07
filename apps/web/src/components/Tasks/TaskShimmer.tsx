import { memo } from "react";
import Skeleton from "@/components/Shared/Skeleton";
import { Card } from "@/components/Shared/UI";

const TaskShimmer = () => {
  return (
    <Card className="gap-4 p-4">
      <div className="space-y-3">
        {/* Avatar + Name + Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-3 w-20 rounded-lg" />
        </div>

        {/* Title */}
        <Skeleton className="h-6 w-3/4 rounded-lg" />

        {/* Status Badge */}
        <Skeleton className="h-6 w-20 rounded-full" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>

        {/* Skills */}
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Location and Salary */}
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-lg" />
        </div>
      </div>
    </Card>
  );
};

export default memo(TaskShimmer);
