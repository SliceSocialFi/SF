import { memo } from "react";
import { Card } from "@/components/Shared/UI";
import cn from "@/helpers/cn";
import PostShimmer from "./PostShimmer";

interface PostsShimmerProps {
  hideCard?: boolean;
}

const PostsShimmer = ({ hideCard = false }: PostsShimmerProps) => {
  return (
    <div className="px-3">
      <Card
        className={cn(
          { "!border-0": hideCard },
          "divide-y divide-gray-200 dark:divide-gray-700"
        )}
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <PostShimmer key={index} />
        ))}
      </Card>
    </div>
  );
};

export default memo(PostsShimmer);
