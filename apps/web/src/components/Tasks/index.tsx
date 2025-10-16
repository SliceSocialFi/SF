import { MapPinIcon, UserIcon, PhoneIcon, EnvelopeIcon, CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Card, H5, Modal, Button } from "@/components/Shared/UI";
import NewTask from "./NewTask";
import PageLayout from "../Shared/PageLayout";


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
  objective?: string;
  deliverables?: string;
  acceptanceCriteria?: string;
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
    rewardTokens: 50,
    objective: "Đảm bảo chất lượng phần mềm thông qua việc kiểm thử toàn diện",
    deliverables: "Báo cáo test cases, Bug reports, Test documentation",
    acceptanceCriteria: "Tất cả test cases đã pass, không còn critical bugs"
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
    rewardTokens: 100,
    objective: "Xây dựng giao diện người dùng hiện đại và responsive",
    deliverables: "Source code React/TypeScript, UI components, Documentation",
    acceptanceCriteria: "UI responsive trên tất cả thiết bị, code quality tốt"
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
    rewardTokens: 75,
    objective: "Phát triển mô hình AI tiên tiến cho ứng dụng thực tế",
    deliverables: "Trained model, API endpoints, Model documentation",
    acceptanceCriteria: "Model accuracy > 90%, API response time < 200ms"
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
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);

  if (!task) return null;

  const handleAcceptTask = () => {
    if (!isAgreementAccepted) {
      return;
    }
    // Handle accept task logic here
    console.log("Accepting task:", task.id);
    onClose();
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" title="Chi tiết công việc">
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

        {/* Task Agreement Section */}
        {(task.objective || task.deliverables || task.acceptanceCriteria) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <H5 className="text-gray-900 dark:text-white mb-4">Thỏa thuận Công việc</H5>
            <div className="space-y-4">
              {task.objective && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mục tiêu chính
                  </h6>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {task.objective}
                  </p>
                </div>
              )}
              
              {task.deliverables && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sản phẩm cần bàn giao
                  </h6>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {task.deliverables}
                  </p>
                </div>
              )}
              
              {task.acceptanceCriteria && (
                <div>
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiêu chí nghiệm thu
                  </h6>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {task.acceptanceCriteria}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Agreement Checkbox */}
        {(task.objective || task.deliverables || task.acceptanceCriteria) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAgreementAccepted}
                onChange={(e) => setIsAgreementAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-brand-600 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Tôi đã đọc và đồng ý với các điều khoản trong Thỏa thuận Công việc.
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1"
            onClick={handleAcceptTask}
            disabled={!isAgreementAccepted && !!(task.objective || task.deliverables || task.acceptanceCriteria)}
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

const Tasks = () => {
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <H5 className="text-gray-900 dark:text-white">Danh sách công việc</H5>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Khám phá các cơ hội việc làm phù hợp với kỹ năng của bạn
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {mockTasks.length} công việc
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NewTask />
          {mockTasks.map((task) => (
            <div key={task.id} onClick={() => handleTaskClick(task)}>
              <TaskCard task={task} />
            </div>
          ))}
        </div>

        <div className="text-center pt-4">
          <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            Xem thêm công việc
          </button>
        </div>
      </div>

      <TaskDetailModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Tasks;
