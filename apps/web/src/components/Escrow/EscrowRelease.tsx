/**
 * EscrowRelease - Component for releasing funds after deadline (permissionless)
 * NOTE: This component is for direct contract interaction (releaseAfterDeadline)
 * NOT for admin approval flow. Currently not used in main flow.
 */

import Button from "@/components/Shared/UI/Button";
import { toast } from "sonner";

interface EscrowReleaseProps {
  taskExternalId: string;
  application?: any;
  freelancerAddress?: string;
  deadline?: number;
  settled?: boolean;
  onSuccess?: (txHash: string) => void;
}

export function EscrowRelease({
  taskExternalId,
  freelancerAddress,
  deadline,
  settled,
  onSuccess,
}: EscrowReleaseProps) {
  // TODO: Implement permissionless release after deadline
  // This requires direct contract interaction with on-chain taskId
  // Not currently used in main approval flow

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-gray-600 text-sm dark:text-gray-400">
        Permissionless release feature (after deadline) - Not yet implemented in
        this flow.
      </p>
    </div>
  );
}
