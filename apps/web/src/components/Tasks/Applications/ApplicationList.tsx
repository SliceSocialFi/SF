import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import type { Application } from "@/types/task-api";
import ApplicationCard from "./ApplicationCard";
import { Spinner } from "@/components/Shared/UI";
import { useAccountQuery } from "@slice/indexer";
import { EscrowDeposit, EscrowRelease } from "@/components/Escrow";
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
  taskDeadline?: string; // Task deadline ISO string
  employerAddress?: string; // Employer wallet address
  freelancerAddress?: string; // Freelancer wallet address
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
  taskDeadline,
  employerAddress,
  freelancerAddress,
}: ApplicationListProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  // Escrow deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [pendingApplication, setPendingApplication] =
    useState<Application | null>(null);

  // Revision modal state
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [pendingRevisionId, setPendingRevisionId] = useState<string | null>(
    null
  );

  // Approve confirmation modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [pendingApproveId, setPendingApproveId] = useState<string | null>(null);

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
      // Step 1: Confirm deposit to backend (REQUIRED - save onChainTaskId and txHash)
      // This is critical for mainnet - backend needs txHash to verify deposit
      if (!taskExternalId) {
        toast.error("Task external ID not found. Cannot confirm deposit.");
        return;
      }

      toast.info("Confirming deposit on backend...");

      // IMPORTANT: Always call confirmDeposit even if onChainTaskId is missing
      // Backend can extract onChainTaskId from txHash if needed
      try {
        await apiClient.confirmDeposit(taskExternalId, {
          onChainTaskId: onChainTaskId || "", // Send empty string if not parsed from event
          depositedTxHash: txHash,
        });
        // console.log("✅ Deposit confirmed on backend:", {
        //   taskExternalId,
        //   onChainTaskId,
        //   txHash,
        // });
      } catch (confirmError: any) {
        console.error("❌ Failed to confirm deposit on backend:", confirmError);
        toast.error(
          confirmError?.body?.message ||
            "Failed to confirm deposit. Please contact support with tx: " +
              txHash.slice(0, 10) +
              "..."
        );
        // Don't proceed with accept if confirm fails
        return;
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

  const handleRequestRevision = (id: string) => {
    setPendingRevisionId(id);
    setRevisionFeedback("");
    setShowRevisionModal(true);
  };

  const confirmRevision = async () => {
    if (!pendingRevisionId || !revisionFeedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    try {
      await apiClient.updateApplication(pendingRevisionId, {
        status: "needs_revision",
        feedback: revisionFeedback,
      });
      toast.success("Revision requested");
      setShowRevisionModal(false);
      setPendingRevisionId(null);
      setRevisionFeedback("");
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

  const handleApprove = (id: string) => {
    if (!isConnected) {
      toast.error("Please connect wallet to release payment");
      return;
    }

    if (!taskExternalId) {
      toast.error("Task external ID not found. Cannot release escrow.");
      return;
    }

    setPendingApproveId(id);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!pendingApproveId) return;

    setShowApproveModal(false);

    try {
      const app = applications.find((a) => a.id === pendingApproveId);
      if (!app) {
        toast.error("Application not found");
        return;
      }

      const freelancerProfileId = app.applicantProfileId;

      // Call backend API to release escrow (admin action)
      // Backend will handle: get on-chain ID, call contract release(), update DB
      toast.info("Releasing payment from escrow...");
      await adminReleaseEscrow(
        taskExternalId!, // Pass DB UUID, not on-chain ID
        `Work approved for application ${pendingApproveId} by employer`
      );

      // Update application status to completed
      await apiClient.updateApplication(pendingApproveId, {
        status: "completed",
      });

      // Mark task as completed
      await apiClient.updateTask(taskId, { status: "completed" });

      toast.success("Work approved and payment released successfully!");
      setPendingApproveId(null);
      await loadApplications();

      // Ask parent to open rating modal
      onOpenRate?.(pendingApproveId);
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
        title="Confirm Deposit to Accept Application"
        size="md"
      >
        <div className="p-6">
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-blue-800 text-sm dark:text-blue-200">
              <strong>Review Information:</strong> Please confirm the details
              below before depositing escrow funds. The funds will be locked
              on-chain until the task is completed.
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
            taskDeadline={taskDeadline}
            onSuccess={handleDepositSuccess}
            readOnly={true}
          />
        </div>
      </Modal>

      {/* Escrow Release After Deadline (NEW FEATURE) */}
      {/* Only show if task is not completed/cancelled (escrow not settled) */}
      {taskExternalId &&
        taskDeadline &&
        taskStatus !== "completed" &&
        taskStatus !== "cancelled" && (
          <div className="mt-6">
            <EscrowRelease
              taskId={taskId}
              taskExternalId={taskExternalId}
              taskDeadline={taskDeadline}
            />
          </div>
        )}

      {/* Revision Request Modal */}
      <Modal
        show={showRevisionModal}
        onClose={() => {
          setShowRevisionModal(false);
          setPendingRevisionId(null);
          setRevisionFeedback("");
        }}
        title="Request Revision"
        size="md"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 text-sm dark:text-gray-400 mb-4">
              Please provide clear feedback explaining what needs to be revised:
            </p>
            <textarea
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="Describe what needs to be changed or improved..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
              rows={6}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowRevisionModal(false);
                setPendingRevisionId(null);
                setRevisionFeedback("");
              }}
              className="rounded-lg px-4 py-2 text-gray-700 text-sm font-medium transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={confirmRevision}
              disabled={!revisionFeedback.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-600"
              type="button"
            >
              Send Revision Request
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        show={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setPendingApproveId(null);
        }}
        title="Approve Submission"
        size="md"
      >
        <div className="p-6">
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-yellow-800 text-sm dark:text-yellow-200">
              <strong>⚠️ Important:</strong> This action will release the escrow
              payment to the freelancer and mark the task as completed. This
              cannot be undone.
            </p>
          </div>

          <p className="mb-6 text-gray-700 dark:text-gray-300">
            Are you sure you want to approve this submission and release payment
            from escrow?
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowApproveModal(false);
                setPendingApproveId(null);
              }}
              className="rounded-lg px-4 py-2 text-gray-700 text-sm font-medium transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={confirmApprove}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              type="button"
            >
              Yes, Approve & Release Payment
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ApplicationList;
