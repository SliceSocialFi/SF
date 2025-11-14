import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import {
  Modal,
  Button,
  TextArea,
  Form,
  useZodForm,
} from "@/components/Shared/UI";
import { z } from "zod";

const SubmitOutcomeSchema = z.object({
  outcome: z.string().min(10, "Outcome must be at least 10 characters"),
  outcomeType: z.enum(["text", "file"]),
});

interface SubmitOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess?: () => void;
  // If this submission is a resubmit after a "needs_revision" outcome,
  // parent may pass taskId/profileId and reward payload so we can complete
  // the task and update user points in one flow.
  isResubmit?: boolean;
  taskId?: string;
  profileId?: string;
  rewardPoints?: number;
  reputationScore?: number;
}

const SubmitOutcomeModal = ({
  isOpen,
  onClose,
  applicationId,
  onSuccess,
  isResubmit,
  taskId,
  profileId,
  rewardPoints,
  reputationScore,
}: SubmitOutcomeModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useZodForm({
    schema: SubmitOutcomeSchema,
    defaultValues: {
      outcome: "",
      outcomeType: "text" as const,
    },
  });

  const handleSubmit = async (data: z.infer<typeof SubmitOutcomeSchema>) => {
    setIsSubmitting(true);
    try {
      // Persist the outcome first
      await apiClient.submitOutcome(applicationId, data);

      // If this submission is a resubmit (needs_revision -> final submission),
      // call completeTaskAndUpdateUser to mark the task completed and award points.
      if (isResubmit && taskId && profileId) {
        await apiClient.completeTaskAndUpdateUser(taskId, profileId, {
          rewardPoints: rewardPoints ?? 0,
          reputationScore: reputationScore ?? 0,
        });
        toast.success("Work submitted and task completed. Points awarded.");
      } else {
        toast.success("Work submitted successfully!");
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error: any) {
      const msg =
        error?.body?.message || error?.message || "Failed to submit work";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} title="Submit Your Work" size="md">
      <Form form={form} onSubmit={handleSubmit} className="space-y-4 p-6">
        <div className="space-y-2">
          <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
            Outcome Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="text"
                {...form.register("outcomeType")}
                className="text-brand-500"
              />
              <span className="text-gray-700 text-sm dark:text-gray-300">
                Text
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="file"
                {...form.register("outcomeType")}
                className="text-brand-500"
              />
              <span className="text-gray-700 text-sm dark:text-gray-300">
                File URL
              </span>
            </label>
          </div>
        </div>

        <TextArea
          label="Your Work"
          placeholder={
            form.watch("outcomeType") === "file"
              ? "Paste the URL to your work..."
              : "Describe or paste your completed work..."
          }
          rows={8}
          {...form.register("outcome")}
        />

        <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Work"}
          </Button>
          <Button
            type="button"
            outline
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SubmitOutcomeModal;
