import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import {
  Modal,
  Button,
  TextArea,
  Form,
  useZodForm,
  FieldError,
} from "@/components/Shared/UI";
import { z } from "zod";
import { type SubmitHandler } from "react-hook-form";

const PostRateSchema = z.object({
  rating: z.string().min(1).max(5),
  comment: z.string().max(500).optional(),
});

type PostRateFormValues = z.infer<typeof PostRateSchema>;

interface PostRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess?: () => void;
}

const PostRateModal = ({
  isOpen,
  onClose,
  applicationId,
  onSuccess,
}: PostRateModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DÙNG useZodForm THEO CHUẨN DỰ ÁN
  const form = useZodForm({
    schema: PostRateSchema,
    defaultValues: {
      rating: "5",
      comment: "",
    },
  });
  // useEffect(() => {
  //   if (isOpen) {
  //     form.reset({
  //       rating: 5,
  //       comment: "",
  //     });
  //   }
  // }, [isOpen, form]);
  const handleRating: SubmitHandler<PostRateFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // console.log("Submitted data:", data);
      const rating = Number(data.rating); // ĐÃ LÀ NUMBER NHỜ setValueAs
      console.log("Rating:", rating, typeof rating); // number
      await apiClient.rateApplication(applicationId, {
        rating,
        comment: data.comment,
      });
      toast.success("Rating posted");
      onSuccess?.();
      onClose();
      form.reset();
    } catch (error: any) {
      const msg =
        error?.body?.message || error?.message || "Failed to post rating";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (errors: any) => {
    console.error("Form validation failed:", errors);
  };

  return (
    <Modal show={isOpen} onClose={onClose} title="Post a Rating" size="sm">
      <Form
        form={form} // BẮT BUỘC THEO CHUẨN
        onSubmit={handleRating} // SubmitHandler<PostRateFormValues>
        onError={handleError} // Optional
        className="space-y-4 p-6"
      >
        <div className="space-y-2">
          <label className="block font-medium text-gray-700 text-sm dark:text-gray-300">
            Rating
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value={n}
                  {...form.register("rating", {
                    setValueAs: (value) =>
                      value === "" ? undefined : Number(value),
                  })}
                  className="text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-gray-700 text-sm dark:text-gray-300">
                  {n}
                </span>
              </label>
            ))}
          </div>
          <FieldError name="rating" />
        </div>

        <div className="space-y-2">
          <TextArea
            label="Comment (optional)"
            placeholder="Share feedback or notes about the submission"
            rows={4}
            {...form.register("comment")}
          />
          <FieldError name="comment" />
        </div>

        <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            {form.formState.isSubmitting ? "Posting..." : "Post Rating"}
          </Button>
          <Button
            type="button"
            outline
            onClick={onClose}
            disabled={form.formState.isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default PostRateModal;
