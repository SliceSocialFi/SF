import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import cn from "@/helpers/cn";

interface TasksProps {
  className?: string;
}

const Tasks = ({ className = "" }: TasksProps) => {
  return (
    <button
      className={cn(
        "flex w-full items-center space-x-1.5 px-2 py-1.5 text-left text-gray-700 text-sm dark:text-gray-200",
        className
      )}
      type="button"
    >
      <ClipboardDocumentListIcon className="size-4" />
      <span>Tasks</span>
    </button>
  );
};

export default Tasks;
