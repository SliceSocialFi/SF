import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { Modal, Button, TextArea, Form, useZodForm } from "@/components/Shared/UI";
import { z } from "zod";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const ApplySchema = z.object({
  coverLetter: z.string().optional()
});

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onSuccess?: () => void;
}

const ApplyModal = ({ isOpen, onClose, taskId, taskTitle, onSuccess }: ApplyModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentAccount } = useAccountStore();

  const form = useZodForm({
    schema: ApplySchema,
    defaultValues: {
      coverLetter: ""
    }
  });

  const handleSubmit = async (data: z.infer<typeof ApplySchema>) => {
    if (!currentAccount?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure user exists
      try {
        await apiClient.getUser(currentAccount.address);
      } catch (err: any) {
        if (err?.status === 404) {
          await apiClient.createUser({ profileId: currentAccount.address });
        }
      }

      await apiClient.applyForTask(taskId, data.coverLetter);
      toast.success("Application submitted successfully!");
      onSuccess?.();
      onClose();
      form.reset();
    } catch (error: any) {
      const msg = error?.body?.message || error?.message || "Failed to submit application";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      title={`Apply for: ${taskTitle}`}
      size="md"
    >
      <Form
        form={form}
        onSubmit={handleSubmit}
        className="space-y-4 p-6"
      >
        <TextArea
          label="Cover Letter (Optional)"
          placeholder="Tell the employer why you're the best fit for this task..."
          rows={6}
          {...form.register("coverLetter")}
        />

        <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
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

export default ApplyModal;
