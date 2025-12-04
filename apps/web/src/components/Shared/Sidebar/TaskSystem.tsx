import {
  CurrencyDollarIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Button, Card, H5, Modal } from "@/components/Shared/UI";

interface TaskOwner {
  id: string;
  name: string;
  avatar?: string;
  contact: {
    email: string;
    phone: string;
  };
}

export interface TaskItem {
  id: string;
  companyLogo: string;
  companyName: string;
  jobTitle: string;
  description: string;
  skills: string[];
  location: string;
  salary: string;
  postedDays: number;
  owner: TaskOwner;
  rewardTokens: number;
  createdAt?: string;
}

const mockTasks: TaskItem[] = [
  {
    companyLogo: "WCE",
    companyName: "Hồng Ngọc",
    description: "Làm 996",
    id: "1",
    jobTitle: "QA Engineer",
    location: "Remote",
    owner: {
      avatar: "NV",
      contact: {
        email: "nguyenvana@email.com",
        phone: "+84 123 456 789",
      },
      id: "user1",
      name: "Nguyễn Văn A",
    },
    postedDays: 1,
    rewardTokens: 50,
    salary: "100.000/h",
    skills: ["Postman", "DevTools", "Developer / Programmer"],
  },
  {
    companyLogo: "TECH",
    companyName: "Tech Solutions Inc",
    description:
      "Looking for React expert with TypeScript experience and modern web development skills",
    id: "2",
    jobTitle: "Frontend Developer",
    location: "Hybrid",
    owner: {
      avatar: "TB",
      contact: {
        email: "tranthib@email.com",
        phone: "+84 987 654 321",
      },
      id: "user2",
      name: "Trần Thị B",
    },
    postedDays: 2,
    rewardTokens: 100,
    salary: "200.000/h",
    skills: ["React", "TypeScript", "Frontend"],
  },
  {
    companyLogo: "AI",
    companyName: "AI Innovations",
    description:
      "Join our team to build cutting-edge AI solutions with Python, TensorFlow and PyTorch",
    id: "3",
    jobTitle: "Machine Learning Engineer",
    location: "On-site",
    owner: {
      avatar: "LC",
      contact: {
        email: "levanc@email.com",
        phone: "+84 555 123 456",
      },
      id: "user3",
      name: "Lê Văn C",
    },
    postedDays: 5,
    rewardTokens: 75,
    salary: "100.000/h",
    skills: ["Python", "TensorFlow", "ML Engineer"],
  },
];

const TaskCard = ({ task }: { task: TaskItem }) => {
  // console.log("Rendering TaskCard for task:", task);
  return (
    <Card className="cursor-pointer space-y-3 p-4 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-sm text-white">
            {task.companyLogo}
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm dark:text-white">
              {task.companyName}
            </div>
            <div className="text-gray-500 text-xs dark:text-gray-400">
              {task.postedDays} days ago
            </div>
          </div>
        </div>
      </div>

      {/* Job Title */}
      <div>
        <H5 className="text-gray-900 dark:text-white">{task.jobTitle}</H5>
      </div>

      {/* Description */}
      <div className="text-gray-600 text-sm leading-relaxed dark:text-gray-300">
        {task.description}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2">
        {task.skills.map((skill, index) => (
          <span
            className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300"
            key={index}
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-gray-200 border-t pt-2 dark:border-gray-700">
        <div className="flex items-center gap-1 text-gray-600 text-sm dark:text-gray-400">
          <MapPinIcon className="h-4 w-4" />
          <span>{task.location}</span>
        </div>
        <div className="font-medium text-gray-900 text-sm dark:text-white">
          {task.salary}
        </div>
      </div>
    </Card>
  );
};

const TaskDetailModal = ({
  task,
  isOpen,
  onClose,
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!task) return null;

  const handleAcceptTask = () => {
    // Handle accept task logic here
    // console.log("Accepting task:", task.id);
    onClose();
  };

  return (
    <Modal onClose={onClose} show={isOpen} size="md" title="Chi tiết công việc">
      <div className="space-y-6 p-6">
        {/* Task Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-lg text-white">
              {task.companyLogo}
            </div>
            <div>
              <H5 className="text-gray-900 dark:text-white">{task.jobTitle}</H5>
              <p className="text-gray-600 text-sm dark:text-gray-400">
                {task.companyName}
              </p>
            </div>
          </div>

          <div className="text-gray-600 text-sm leading-relaxed dark:text-gray-300">
            {task.description}
          </div>

          <div className="flex flex-wrap gap-2">
            {task.skills.map((skill, index) => (
              <span
                className="rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-xs dark:bg-gray-800 dark:text-gray-300"
                key={index}
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-gray-600 text-sm dark:text-gray-400">
              <MapPinIcon className="h-4 w-4" />
              <span>{task.location}</span>
            </div>
            <div className="font-medium text-gray-900 text-sm dark:text-white">
              {task.salary}
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-sm text-white">
              {task.owner.avatar}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {task.owner.name}
              </p>
              <p className="text-gray-500 text-sm dark:text-gray-400">
                Người đăng task
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 text-sm dark:text-gray-300">
                {task.owner.contact.email}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 text-sm dark:text-gray-300">
                {task.owner.contact.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Reward Info */}
        <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-6 w-6 text-brand-500" />
            <div>
              <p className="font-medium text-brand-600 dark:text-brand-400">
                Phần thưởng khi hoàn thành
              </p>
              <p className="font-bold text-2xl text-brand-600 dark:text-brand-400">
                {task.rewardTokens} tokens
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button className="flex-1" onClick={handleAcceptTask}>
            Nhận task
          </Button>
          <Button className="flex-1" onClick={onClose} outline>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const TaskSystem = () => {
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = useCallback((task: TaskItem) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <H5 className="text-gray-900 dark:text-white">Available Tasks</H5>
        <div className="text-gray-500 text-sm dark:text-gray-400">
          {mockTasks.length} tasks
        </div>
      </div>

      <div className="space-y-3">
        {mockTasks.map((task) => (
          <div key={task.id} onClick={() => handleTaskClick(task)}>
            <TaskCard task={task} />
          </div>
        ))}
      </div>

      <div className="pt-2 text-center">
        <button
          className="font-medium text-brand-500 text-sm hover:text-brand-600"
          type="button"
        >
          View All Tasks
        </button>
      </div>

      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />
    </div>
  );
};

export default TaskSystem;
