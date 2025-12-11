import { memo } from "react";
import type { PostFragment } from "@slice/indexer";
import { Card } from "@/components/Shared/UI";

interface HiddenPostProps {
  post?: PostFragment;
  type?: string;
}

const HiddenPost = ({ type = "Post" }: HiddenPostProps) => {
  return (
    <Card className="!bg-gray-100 dark:!bg-gray-800 mt-2" forceRounded>
      <div className="px-4 py-3 text-sm">This post has been deleted.</div>
    </Card>
  );
};

export default memo(HiddenPost);
