import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { Modal, Button, TextArea, Form, useZodForm } from "@/components/Shared/UI";
import { z } from "zod";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { NoSymbolIcon } from "@heroicons/react/24/outline";

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
  const [isBanned, setIsBanned] = useState(false);
  const { currentAccount } = useAccountStore();

  // Check if user is banned
  useEffect(() => {
    const checkBannedStatus = async () => {
      if (!currentAccount?.address) return;
      try {
        const userData = await apiClient.getUser(currentAccount.address);
        setIsBanned(userData?.isBanned ?? false);
      } catch (err) {
        // User might not exist yet
      }
    };
    if (isOpen) {
      checkBannedStatus();
    }
  }, [currentAccount?.address, isOpen]);

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
      {isBanned ? (
        <div className="p-6">
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <NoSymbolIcon className="h-6 w-6 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <h4 className="font-semibold text-red-800 dark:text-red-300">
                  Không thể ứng tuyển
                </h4>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  Tài khoản của bạn đã bị khóa do điểm uy tín thấp (dưới 30).
                  Bạn không thể ứng tuyển vào các task cho đến khi tài khoản
                  được mở khóa.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" outline onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      ) : (
        <Form form={form} onSubmit={handleSubmit} className="space-y-4 p-6">
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
      )}
    </Modal>
  );
};

export default ApplyModal;
