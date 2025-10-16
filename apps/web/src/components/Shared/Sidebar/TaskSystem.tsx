import { MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Card, H5, Modal, Button } from "@/components/Shared/UI";

interface TaskOwner {
  id: string;
  name: string;
  avatar?: string;
  contact: {
    email: string;
    phone: string;
  };
}

interface TaskItem {
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
}

const mockTasks: TaskItem[] = [
  {
    id: "1",
    companyLogo: "WCE",
    companyName: "Hồng Ngọc",
    jobTitle: "QA Engineer",
    description: "Làm 996",
    skills: ["Postman", "DevTools", "Developer / Programmer"],
    location: "Remote",
    salary: "100.000/h",
    postedDays: 1,
    owner: {
      id: "user1",
      name: "Nguyễn Văn A",
      avatar: "NV",
      contact: {
        email: "nguyenvana@email.com",
        phone: "+84 123 456 789"
      }
    },
    rewardTokens: 50
  },
  {
    id: "2", 
    companyLogo: "TECH",
    companyName: "Tech Solutions Inc",
    jobTitle: "Frontend Developer",
    description: "Looking for React expert with TypeScript experience and modern web development skills",
    skills: ["React", "TypeScript", "Frontend"],
    location: "Hybrid",
    salary: "200.000/h",
    postedDays: 2,
    owner: {
      id: "user2",
      name: "Trần Thị B",
      avatar: "TB",
      contact: {
        email: "tranthib@email.com",
        phone: "+84 987 654 321"
      }
    },
    rewardTokens: 100
  },
  {
    id: "3",
    companyLogo: "AI",
    companyName: "AI Innovations",
    jobTitle: "Machine Learning Engineer", 
    description: "Join our team to build cutting-edge AI solutions with Python, TensorFlow and PyTorch",
    skills: ["Python", "TensorFlow", "ML Engineer"],
    location: "On-site",
    salary: "100.000/h",
    postedDays: 5,
    owner: {
      id: "user3",
      name: "Lê Văn C",
      avatar: "LC",
      contact: {
        email: "levanc@email.com",
        phone: "+84 555 123 456"
      }
    },
    rewardTokens: 75
  }
];

const TaskCard = ({ task }: { task: TaskItem }) => {
  return (
    <Card className="p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {task.companyLogo}
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900 dark:text-white">
              {task.companyName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
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
      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        {task.description}
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2">
        {task.skills.map((skill, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <MapPinIcon className="w-4 h-4" />
          <span>{task.location}</span>
        </div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {task.salary}
        </div>
      </div>
    </Card>
  );
};

const TaskDetailModal = ({ task, isOpen, onClose }: { task: TaskItem | null; isOpen: boolean; onClose: () => void }) => {
  if (!task) return null;

  const handleAcceptTask = () => {
    // Handle accept task logic here
    console.log("Accepting task:", task.id);
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md" title="Chi tiết công việc">
      <div className="p-6 space-y-6">
        {/* Task Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {task.companyLogo}
            </div>
            <div>
              <H5 className="text-gray-900 dark:text-white">{task.jobTitle}</H5>
              <p className="text-sm text-gray-600 dark:text-gray-400">{task.companyName}</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {task.description}
          </div>

          <div className="flex flex-wrap gap-2">
            {task.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="w-4 h-4" />
              <span>{task.location}</span>
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {task.salary}
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {task.owner.avatar}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{task.owner.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Người đăng task</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{task.owner.contact.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{task.owner.contact.phone}</span>
            </div>
          </div>
        </div>

        {/* Reward Info */}
        <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-6 h-6 text-brand-500" />
            <div>
              <p className="font-medium text-brand-600 dark:text-brand-400">
                Phần thưởng khi hoàn thành
              </p>
              <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {task.rewardTokens} tokens
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1"
            onClick={handleAcceptTask}
          >
            Nhận task
          </Button>
          <Button
            outline
            className="flex-1"
            onClick={onClose}
          >
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
        <div className="text-sm text-gray-500 dark:text-gray-400">
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

      <div className="text-center pt-2">
        <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
          View All Tasks
        </button>
      </div>

      <TaskDetailModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default TaskSystem;
