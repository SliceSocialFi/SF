import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import type { Application } from "@/types/task-api";
import ApplicationCard from "./ApplicationCard";
import { Spinner } from "@/components/Shared/UI";
import { useAccountQuery } from "@slice/indexer";

interface ApplicationListProps {
  taskId: string;
  isEmployer?: boolean;
  taskStatus?: string;
  onApplicationUpdate?: () => void;
  onOpenRate?: (applicationId: string) => void;
}

const ApplicationList = ({
  taskId,
  taskStatus,
  isEmployer = false,
  onApplicationUpdate,
  onOpenRate,
}: ApplicationListProps) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

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
    // console.log("data", data);
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

  const handleAccept = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to accept this application? This will reject other submitted applications."
      )
    )
      return;
    try {
      // Accept selected application
      await apiClient.acceptApplication(id);

      // Reject all other submitted applications for this task
      const others = applications.filter(
        (a) => a.id !== id && a.status === "submitted"
      );
      await Promise.all(
        others.map((a) =>
          apiClient.rejectApplication(a.id).catch((e) => {
            console.error("Failed to reject application", a.id, e);
          })
        )
      );

      toast.success("Application accepted and others rejected");
      await loadApplications();
      onApplicationUpdate?.();
    } catch (error: any) {
      console.error("accept error", error);
      toast.error(error?.body?.message || "Failed to accept application");
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
    if (!confirm("Approve this submission and mark application as completed?"))
      return;
    try {
      await apiClient.updateApplication(id, { status: "completed" });
      await apiClient.updateTask(taskId, { status: "completed" });
      toast.success("Submission approved and application completed");
      await loadApplications();
      // Ask parent to open rating modal so employer can post a rating for the freelancer
      onOpenRate?.(id);
      onApplicationUpdate?.();
    } catch (error: any) {
      console.error("approve error", error);
      toast.error(error?.body?.message || "Failed to approve submission");
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
  );
};

export default ApplicationList;
