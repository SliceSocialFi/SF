import {
  CurrencyDollarIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon
} from "@heroicons/react/24/outline";
import { useCallback, useState } from "react";
import { Button, Card, H5, Modal } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import PageLayout from "../Shared/PageLayout";
import NewTask from "./NewTask";

interface TaskOwner {
  id: string;
  name: string;
  avatar?: string;
  contact: {
    email: string;
    phone: string;
  };
}

interface TaskApplicant {
  walletAddress: string;
  username?: string;
  avatar?: string;
  level: number;
  appliedAt: string;
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
  status: "open" | "in_progress" | "completed" | "cancelled";
  assigneeId?: string;
  applicants: TaskApplicant[];
}

const mockTasks: TaskItem[] = [
  {
    acceptanceCriteria: "Tất cả test cases đã pass, không còn critical bugs",
    applicants: [
      {
        appliedAt: "2024-01-20",
        avatar: "JD",
        level: 3,
        username: "John Doe",
        walletAddress: "0x1234567890abcdef1234567890abcdef12345678"
      },
      {
        appliedAt: "2024-01-19",
        avatar: "JS",
        level: 4,
        username: "Jane Smith",
        walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12"
      }
    ],
    companyLogo: "WCE",
    companyName: "Hồng Ngọc",
    deliverables: "Báo cáo test cases, Bug reports, Test documentation",
    description: "Làm 996",
    id: "1",
    jobTitle: "QA Engineer",
    location: "Remote",
    objective: "Đảm bảo chất lượng phần mềm thông qua việc kiểm thử toàn diện",
    owner: {
      avatar: "NV",
      contact: {
        email: "nguyenvana@email.com",
        phone: "+84 123 456 789"
      },
      id: "user1",
      name: "Nguyễn Văn A"
    },
    postedDays: 1,
    rewardTokens: 50,
    salary: "100.000/h",
    skills: ["Postman", "DevTools", "Developer / Programmer"],
    status: "open"
  },
  {
    acceptanceCriteria: "UI responsive trên tất cả thiết bị, code quality tốt",
    applicants: [],
    assigneeId: "0x9876543210fedcba9876543210fedcba98765432",
    companyLogo: "TECH",
    companyName: "Tech Solutions Inc",
    deliverables: "Source code React/TypeScript, UI components, Documentation",
    description:
      "Looking for React expert with TypeScript experience and modern web development skills",
    id: "2",
    jobTitle: "Frontend Developer",
    location: "Hybrid",
    objective: "Xây dựng giao diện người dùng hiện đại và responsive",
    owner: {
      avatar: "TB",
      contact: {
        email: "tranthib@email.com",
        phone: "+84 987 654 321"
      },
      id: "user2",
      name: "Trần Thị B"
    },
    postedDays: 2,
    rewardTokens: 100,
    salary: "200.000/h",
    skills: ["React", "TypeScript", "Frontend"],
    status: "in_progress"
  },
  {
    acceptanceCriteria: "Model accuracy > 90%, API response time < 200ms",
    applicants: [],
    companyLogo: "AI",
    companyName: "AI Innovations",
    deliverables: "Trained model, API endpoints, Model documentation",
    description:
      "Join our team to build cutting-edge AI solutions with Python, TensorFlow and PyTorch",
    id: "3",
    jobTitle: "Machine Learning Engineer",
    location: "On-site",
    objective: "Phát triển mô hình AI tiên tiến cho ứng dụng thực tế",
    owner: {
      avatar: "LC",
      contact: {
        email: "levanc@email.com",
        phone: "+84 555 123 456"
      },
      id: "user3",
      name: "Lê Văn C"
    },
    postedDays: 5,
    rewardTokens: 75,
    salary: "100.000/h",
    skills: ["Python", "TensorFlow", "ML Engineer"],
    status: "open"
  }
];

const TaskCard = ({ task }: { task: TaskItem }) => {
  return (
    <Card className="cursor-pointer gap-4 p-4 transition-shadow hover:shadow-md md:flex md:items-center md:justify-between md:p-5">
      {/* Left: Company + details */}
      <div className="flex-1 space-y-2">
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

        <H5 className="text-gray-900 dark:text-white">{task.jobTitle}</H5>

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
      </div>

      {/* Right: Location + Salary */}
      <div className="mt-3 flex shrink-0 items-center justify-between gap-6 md:mt-0 md:border-gray-200 md:border-l md:pl-4 md:dark:border-gray-700">
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
  onClose
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isAgreementAccepted, setIsAgreementAccepted] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isAcceptingApplicant, setIsAcceptingApplicant] = useState<
    string | null
  >(null);
  const { currentAccount } = useAccountStore();

  if (!task) return null;

  const isOwner = task.owner.id === currentAccount?.address;
  const hasApplied = task.applicants.some(
    (applicant) => applicant.walletAddress === currentAccount?.address
  );

  const handleApplyForTask = async () => {
    if (!isAgreementAccepted || !currentAccount) {
      return;
    }

    setIsApplying(true);
    try {
      // Simulate API call to apply for task
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(
        "Applying for task:",
        task.id,
        "with wallet:",
        currentAccount.address
      );
      // Here you would call your API to add the user to applicants list
    } catch (error) {
      console.error("Failed to apply for task:", error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleAcceptApplicant = async (applicantWalletAddress: string) => {
    setIsAcceptingApplicant(applicantWalletAddress);
    try {
      // Simulate API call to accept applicant
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(
        "Accepting applicant:",
        applicantWalletAddress,
        "for task:",
        task.id
      );
      // Here you would call your API to:
      // 1. Set assigneeId
      // 2. Update status to 'in_progress'
      // 3. Send notification to applicant
    } catch (error) {
      console.error("Failed to accept applicant:", error);
    } finally {
      setIsAcceptingApplicant(null);
    }
  };

  const handleViewProfile = (walletAddress: string) => {
    // Navigate to user profile page
    console.log("Navigate to profile:", walletAddress);
    // You would use your routing logic here
  };

  return (
    <Modal onClose={onClose} show={isOpen} size="lg" title="Task Details">
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

        {/* Task Agreement Section */}
        {(task.objective || task.deliverables || task.acceptanceCriteria) && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <H5 className="mb-4 text-gray-900 dark:text-white">
              Work Agreement
            </H5>
            <div className="space-y-4">
              {task.objective && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Main Objective
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.objective}
                  </p>
                </div>
              )}

              {task.deliverables && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Deliverables
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.deliverables}
                  </p>
                </div>
              )}

              {task.acceptanceCriteria && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Acceptance Criteria
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.acceptanceCriteria}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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
                Task Owner
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
                Completion Reward
              </p>
              <p className="font-bold text-2xl text-brand-600 dark:text-brand-400">
                {task.rewardTokens} tokens
              </p>
            </div>
          </div>
        </div>

        {/* Agreement Checkbox */}
        {(task.objective || task.deliverables || task.acceptanceCriteria) && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                checked={isAgreementAccepted}
                className="mt-1 h-4 w-4 rounded border-gray-300 bg-gray-100 text-brand-600 focus:ring-2 focus:ring-brand-500"
                onChange={(e) => setIsAgreementAccepted(e.target.checked)}
                type="checkbox"
              />
              <span className="text-gray-700 text-sm dark:text-gray-300">
                I have read and agree to the terms of the Work Agreement.
              </span>
            </label>
          </div>
        )}

        {/* Applicant List (for task owners) */}
        {isOwner && task.applicants.length > 0 && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <H5 className="mb-4 text-gray-900 dark:text-white">Applicants</H5>
            <div className="space-y-3">
              {task.applicants.map((applicant) => (
                <div
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                  key={applicant.walletAddress}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-sm text-white">
                      {applicant.avatar || "U"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm dark:text-white">
                        {applicant.username || "Anonymous"}
                      </p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">
                        Level {applicant.level} • Applied {applicant.appliedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewProfile(applicant.walletAddress)}
                      outline
                      size="sm"
                    >
                      View Profile
                    </Button>
                    <Button
                      disabled={!!isAcceptingApplicant}
                      loading={isAcceptingApplicant === applicant.walletAddress}
                      onClick={() =>
                        handleAcceptApplicant(applicant.walletAddress)
                      }
                      size="sm"
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Status Info */}
        {task.status === "in_progress" && task.assigneeId && (
          <div className="border-gray-200 border-t pt-4 dark:border-gray-700">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-sm text-white">
                  ✓
                </div>
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    Task Assigned
                  </p>
                  <p className="text-blue-500 text-sm dark:text-blue-300">
                    This task is currently in progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isOwner && (
          <div className="flex gap-3 pt-4">
            {hasApplied ? (
              <Button className="flex-1" disabled>
                Application Submitted
              </Button>
            ) : (
              <Button
                className="flex-1"
                disabled={
                  !isAgreementAccepted &&
                  !!(
                    task.objective ||
                    task.deliverables ||
                    task.acceptanceCriteria
                  )
                }
                loading={isApplying}
                onClick={handleApplyForTask}
              >
                Apply for Task
              </Button>
            )}
            <Button className="flex-1" onClick={onClose} outline>
              Close
            </Button>
          </div>
        )}

        {/* Owner Actions */}
        {isOwner && (
          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={onClose} outline>
              Close
            </Button>
          </div>
        )}
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
    <PageLayout hideSearch sidebar={<NewTask />}>
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <H5 className="text-gray-900 dark:text-white">Task Listings</H5>
              <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
                Discover job opportunities that match your skills
              </p>
            </div>
            <div className="text-gray-500 text-sm dark:text-gray-400">
              {mockTasks.length} tasks
            </div>
          </div>

          <div className="space-y-4">
            {mockTasks.map((task) => (
              <div key={task.id} onClick={() => handleTaskClick(task)}>
                <TaskCard task={task} />
              </div>
            ))}
          </div>

          <div className="pt-4 text-center">
            <button
              className="font-medium text-brand-500 text-sm hover:text-brand-600"
              type="button"
            >
              Load More Tasks
            </button>
          </div>
        </div>

        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          task={selectedTask}
        />
      </div>
    </PageLayout>
  );
};

export default Tasks;
