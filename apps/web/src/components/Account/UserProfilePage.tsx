import {
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { Button, Card, H5, H6, Modal } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";

interface UserProfile {
  walletAddress: string;
  username?: string;
  avatar?: string;
  reputationScore: number;
  rewardPoints: number;
  expertise: Array<{
    name: string;
    level: number;
  }>;
  completedTasks: Array<{
    id: string;
    title: string;
    completedAt: string;
    reward: number;
  }>;
}

interface UserProfilePageProps {
  walletAddress: string;
  isOwnProfile?: boolean;
}

const WelcomeModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal onClose={onClose} show={isOpen} size="md" title="Welcome!">
      <div className="space-y-4 p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/20">
            <StarIcon className="h-8 w-8 text-brand-500" />
          </div>
          <H5 className="mb-2 text-gray-900 dark:text-white">
            Welcome to the Task System!
          </H5>
          <p className="text-gray-600 text-sm dark:text-gray-400">
            Your reputation score starts at 100. Complete tasks well to maintain
            your score and receive more opportunities.
          </p>
        </div>

        <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
          <h6 className="mb-2 font-medium text-brand-600 text-sm dark:text-brand-400">
            How the Reputation System Works:
          </h6>
          <ul className="space-y-1 text-gray-600 text-sm dark:text-gray-400">
            <li>• Start with 100 reputation points</li>
            <li>• Complete tasks successfully to maintain your score</li>
            <li>• High reputation = more task opportunities</li>
            <li>• Poor performance may decrease your score</li>
          </ul>
        </div>

        <Button className="w-full" onClick={onClose}>
          Got it!
        </Button>
      </div>
    </Modal>
  );
};

const UserProfilePage = ({
  walletAddress,
  isOwnProfile = false
}: UserProfilePageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const { currentAccount } = useAccountStore();

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const res = await apiClient.getUser(walletAddress);
        const mapped: UserProfile = {
          walletAddress: res.walletAddress || res.address || walletAddress,
          username: res.username || res.name || (walletAddress === currentAccount?.address ? 'You' : undefined),
          avatar: res.avatar || res.displayName || undefined,
          reputationScore: res.reputationScore ?? res.reputation ?? 100,
          rewardPoints: res.rewardPoints ?? res.points ?? 0,
          expertise: res.expertise || [],
          completedTasks: res.completedTasks || []
        } as UserProfile;

        setProfile(mapped);

        if (isOwnProfile && walletAddress === currentAccount?.address) {
          const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
          if (!hasSeenWelcome) {
            setShowWelcomeModal(true);
            localStorage.setItem("hasSeenWelcome", "true");
          }
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [walletAddress, isOwnProfile, currentAccount?.address]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Card className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            User profile not found
          </p>
        </Card>
      </div>
    );
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 4)
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (level >= 3)
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    if (level >= 2)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Core Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-2xl text-white">
            {profile.avatar || <UserIcon className="h-10 w-10" />}
          </div>
          <div className="flex-1">
            <H5 className="text-gray-900 dark:text-white">
              {profile.username || "Anonymous User"}
            </H5>
            <p className="font-mono text-gray-500 text-sm dark:text-gray-400">
              {formatWalletAddress(profile.walletAddress)}
            </p>
          </div>
        </div>
      </Card>

      {/* Reputation and Reward Points */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <StarIcon className="h-6 w-6 text-brand-500" />
            <H6 className="text-gray-900 dark:text-white">Reputation Score</H6>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Score</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {profile.reputationScore}/100
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${profile.reputationScore}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
            <H6 className="text-gray-900 dark:text-white">Reward Points</H6>
          </div>
          <div className="font-bold text-3xl text-gray-900 dark:text-white">
            {profile.rewardPoints.toLocaleString()}
          </div>
          <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
            Total earned rewards
          </p>
        </Card>
      </div>

      {/* Expertise & Levels */}
      <Card className="p-6">
        <H6 className="mb-4 text-gray-900 dark:text-white">
          Expertise & Level
        </H6>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {profile.expertise.map((skill, i) => (
            <div
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              key={i}
            >
              <span className="font-medium text-gray-900 text-sm dark:text-white">
                {skill.name}
              </span>
              <span
                className={`rounded-full px-3 py-1 font-medium text-xs ${getLevelBadgeColor(skill.level)}`}
              >
                Level {skill.level}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Task History */}
      <Card className="p-6">
        <H6 className="mb-4 text-gray-900 dark:text-white">Task History</H6>
        <div className="space-y-3">
          {profile.completedTasks.map((task) => (
            <div
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
              key={task.id}
            >
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 text-sm dark:text-white">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-1 text-gray-500 text-xs dark:text-gray-400">
                    <ClockIcon className="h-3 w-3" />
                    <span>Completed {task.completedAt}</span>
                  </div>
                </div>
              </div>
              <div className="font-medium text-green-600 text-sm dark:text-green-400">
                +{task.reward} pts
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  );
};

export default UserProfilePage;
