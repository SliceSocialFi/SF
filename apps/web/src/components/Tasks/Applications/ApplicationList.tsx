import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import type { Application } from "@/types/task-api";
import ApplicationCard from "./ApplicationCard";
import { Spinner } from "@/components/Shared/UI";
import { useAccountQuery } from "@slice/indexer";
import { EscrowDeposit } from "@/components/Escrow";
import Modal from "@/components/Shared/UI/Modal";
import { useEscrow } from "@/hooks/useEscrow";
import { useWallet } from "@/hooks/useWallet";

interface ApplicationListProps {
  taskId: string;
  isEmployer?: boolean;
  taskStatus?: string;
  onApplicationUpdate?: () => void;
  onOpenRate?: (applicationId: string) => void;
  rewardPoints?: number;
  // Escrow props (required for new flow)
  taskExternalId?: string; // UUID of task for escrow
  taskRewardAmount?: string; // Reward amount in token units (e.g., "100")
}

const ApplicationList = ({
  taskId,
  taskStatus,
  isEmployer = false,
  onApplicationUpdate,
  onOpenRate,
  rewardPoints,
  taskExternalId,
  taskRewardAmount = "100",
}: ApplicationListProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  // Escrow deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [pendingApplication, setPendingApplication] =
    useState<Application | null>(null);

  // Wallet and escrow hooks for release
  const { isConnected } = useWallet();
  const { adminReleaseEscrow, isReleasing } = useEscrow({
    onSuccess: (tx) => {
      toast.success(
        `Payment released to freelancer! Tx: ${tx.txHash.slice(0, 10)}...`
      );
    },
    onError: (err) => {
      console.error("Release escrow error:", err);
    },
  });

  useEffect(() => {
    loadApplications();
  }, [taskId]);
  const { error, fetchMore } = useAccountQuery({
    skip: !applications,
    variables: {
      request: {
        address: applications[0]?.applicantProfileId,
      },
    },
  });

  const getUsernameByProfileId = async (profileId: string) => {
    const data = await fetchMore({
      variables: {
        request: {
          address: profileId,
        },
      },
    });
    if (error) {
      console.error("Error fetching account data:", error);
      return null;
    }

    return {
      name: data?.data?.account?.metadata?.name,
      avatar: data?.data?.account?.metadata?.picture,
    };
  };

  const loadApplications = async () => {
    try {
      setLoading(true);

      const data = await apiClient.getApplicationsByTask(taskId);
      let applicationsData: Application[] = data;
      if (taskStatus !== "open") {
        applicationsData = data.filter((app) => app.status !== "rejected");
      }
      const applicationsWithProfiles = await Promise.all(
        applicationsData.map(async (app) => {
          const metadata = await getUsernameByProfileId(app.applicantProfileId);
          return {
            ...app,
            applicantName: metadata?.name || "Unknown",
            applicantAvatar: metadata?.avatar || null,
          };
        })
      );
      setApplications(applicationsWithProfiles);
    } catch (error) {
      console.error("Failed to load applications:", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (id: string) => {
    // NEW FLOW: Don't call API immediately!
    // Instead, open escrow deposit modal first
    const app = applications.find((a) => a.id === id);
    if (!app) {
      toast.error("Application not found");
      return;
    }

    if (!taskExternalId) {
      toast.error("Task external ID not found. Cannot proceed with escrow.");
      return;
    }

    // Set pending application and show modal
    setPendingApplication(app);
    setShowDepositModal(true);
  };

  // Called AFTER escrow deposit succeeds
  const handleDepositSuccess = async (
    txHash: string,
    onChainTaskId?: string
  ) => {
    if (!pendingApplication) return;

    try {
      // Step 1: Confirm deposit to backend (save onChainTaskId and txHash)
      if (onChainTaskId && taskExternalId) {
        toast.info("Confirming deposit on backend...");
        await apiClient.confirmDeposit(taskExternalId, {
          onChainTaskId,
          depositedTxHash: txHash,
        });
      }

      // Step 2: Accept the application on backend
      await apiClient.acceptApplication(pendingApplication.id);

      // Step 3: Reject all other submitted applications for this task
      const others = applications.filter(
        (a) => a.id !== pendingApplication.id && a.status === "submitted"
      );
      await Promise.all(
        others.map((a) => apiClient.rejectApplication(a.id).catch(() => {}))
      );

      toast.success(
        `Application accepted! Escrow deposited (Tx: ${txHash.slice(0, 10)}...)`
      );

      // Close modal and reset state
      setShowDepositModal(false);
      setPendingApplication(null);

      // Reload and notify parent
      await loadApplications();
      onApplicationUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.body?.message || "Failed to accept application after deposit"
      );
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.rejectApplication(id);
      toast.success("Application rejected");
      loadApplications();
      onApplicationUpdate?.();
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to reject application");
    }
  };

  const handleRequestRevision = async (id: string) => {
    const feedback = prompt("Please provide feedback for revision:");
    if (!feedback) return;

    try {
      await apiClient.updateApplication(id, {
        status: "needs_revision",
        feedback,
      });
      toast.success("Revision requested");
      loadApplications();
      onApplicationUpdate?.();
    } catch (error: any) {
      toast.error(error?.body?.message || "Failed to request revision");
    }
  };

  // Parent can control opening the rating modal to keep UI consistent
  // via onOpenRate callback prop.
  const handleRating = async (id: string) => {
    onOpenRate?.(id);
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this submission and release payment from escrow?"))
      return;

    if (!isConnected) {
      toast.error("Please connect wallet to release payment");
      return;
    }

    if (!taskExternalId) {
      toast.error("Task external ID not found. Cannot release escrow.");
      return;
    }

    try {
      const app = applications.find((a) => a.id === id);
      if (!app) {
        toast.error("Application not found");
        return;
      }

      const freelancerProfileId = app.applicantProfileId;

      // Call backend API to release escrow (admin action)
      // Backend will handle: get on-chain ID, call contract release(), update DB
      toast.info("Releasing payment from escrow...");
      await adminReleaseEscrow(
        taskExternalId, // Pass DB UUID, not on-chain ID
        `Work approved for application ${id} by employer`
      );

      // Update application status to completed
      await apiClient.updateApplication(id, { status: "completed" });

      // Mark task as completed
      await apiClient.updateTask(taskId, { status: "completed" });

      toast.success("Work approved and payment released successfully!");
      await loadApplications();

      // Ask parent to open rating modal
      onOpenRate?.(id);
      onApplicationUpdate?.();
    } catch (error: any) {
      toast.error(
        error?.shortMessage ||
          error?.message ||
          "Failed to approve and release payment"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No applications yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            showActions={isEmployer}
            onAccept={handleAccept}
            onApprove={handleApprove}
            onRating={handleRating}
            // View profile navigates to user page (safe fallback)
            onViewProfile={(username: string) => {
              if (!username) return;
              window.location.href = `/u/${username}`;
            }}
            {...(isEmployer
              ? {
                  onRequestRevision: handleRequestRevision,
                  onReject: handleReject,
                }
              : {
                  onReject: handleReject,
                  onRequestRevision: handleRequestRevision,
                })}
          />
        ))}
      </div>

      {/* Escrow Deposit Modal (NEW FLOW) */}
      <Modal
        show={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
          setPendingApplication(null);
        }}
        title="Deposit Escrow to Accept Application"
        size="md"
      >
        <div className="p-6">
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-blue-800 text-sm dark:text-blue-200">
              <strong>New Flow:</strong> You must deposit escrow funds before
              accepting this application. The funds will be locked on-chain
              until the task is completed.
            </p>
          </div>

          {pendingApplication && (
            <div className="mb-4">
              <p className="text-gray-600 text-sm dark:text-gray-400">
                Accepting application from:{" "}
                <strong>{pendingApplication.applicantName || "Unknown"}</strong>
              </p>
            </div>
          )}

          <EscrowDeposit
            taskId={taskExternalId}
            freelancerAddress={pendingApplication?.applicantProfileId}
            defaultAmount={taskRewardAmount}
            defaultDeadlineDays={7}
            onSuccess={handleDepositSuccess}
          />
        </div>
      </Modal>
    </>
  );
};

export default ApplicationList;
