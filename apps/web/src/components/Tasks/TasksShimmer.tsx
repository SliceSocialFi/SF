import { memo } from "react";
import TaskShimmer from "./TaskShimmer";

const TasksShimmer = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <TaskShimmer key={index} />
      ))}
    </div>
  );
};

export default memo(TasksShimmer);
