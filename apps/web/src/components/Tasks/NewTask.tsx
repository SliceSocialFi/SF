import { 
  PlusIcon, 
  TrashIcon,
  LinkIcon,
  NoSymbolIcon, 
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { z } from "zod";
import {
  Button,
  Card,
  Form,
  H5,
  Input,
  Modal,
  TextArea,
  useZodForm,
} from "@/components/Shared/UI";
import type { TaskItem } from "@/components/Shared/Sidebar/TaskSystem";
import DeadlineInput from "@/components/Tasks/DeadlineInput";

const resourceSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().optional(),
  description: z.string().optional(),
});

const TaskAgreementSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters"),
    objective: z
      .string()
      .trim()
      .min(10, "Objective must be at least 10 characters"),
    deliverables: z
      .string()
      .trim()
      .min(10, "Deliverables must be at least 10 characters"),
    acceptanceCriteria: z
      .string()
      .trim()
      .min(10, "Acceptance criteria must be at least 10 characters"),
    resources: z
      .array(resourceSchema)
      .optional(),
    rewardPoints: z
      .number()
      .int()
      .positive("Reward must be a positive integer")
      .min(1, "Reward must be at least 1 point"),
    deadline: z.preprocess((val) => {
      if (!val) return undefined;
      if (typeof val === "string") {
        const d = new Date(val);
        if (!Number.isNaN(d.getTime())) return d.toISOString();
      }
      return val;
    }, z.string().datetime().optional()),
  })
  .refine(
    (data) => {
      if (!data.deadline) return true;
      const d = new Date(data.deadline);
      return d.getTime() > Date.now();
    },
    {
      path: ["deadline"],
      message: "Deadline must be in the future",
    }
  );

type TaskAgreementData = z.infer<typeof TaskAgreementSchema>;

interface NewTaskProps {
  onSubmit?: (tasks: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const NewTask = ({
  onSubmit = (tasks: any) => {},
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: NewTaskProps) => {
  const [internalIsModalOpen, setInternalIsModalOpen] = useState(false);
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
        // User might not exist yet, that's ok
      }
    };
    checkBannedStatus();
  }, [currentAccount?.address]);

  // Use external control if provided, otherwise use internal state
  const isModalOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalIsModalOpen;
  const setIsModalOpen =
    externalOnClose !== undefined
      ? (value: boolean) => !value && externalOnClose()
      : setInternalIsModalOpen;

  const form = useZodForm({
    defaultValues: {
      title: "",
      objective: "",
      deliverables: "",
      acceptanceCriteria: "",
      resources: [] as Array<{
        label: string;
        url?: string;
        description?: string;
      }>,
      // default to 1 so an accidental empty submit doesn't immediately fail validation
      rewardPoints: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    schema: TaskAgreementSchema,
  });

  // Watch resources for dynamic rendering
  const resources = form.watch("resources") || [];

  const handleSubmit = async (data: TaskAgreementData) => {
    if (!currentAccount?.address) {
      toast.error("Please connect wallet");
      return;
    }
    setIsSubmitting(true);

    try {
      const employerProfileId = currentAccount.address;

      // Ensure user exists (backend needs this for FK constraints)
      try {
        await apiClient.getUser(employerProfileId);
      } catch (err: any) {
        if (err?.status === 404) {
          await apiClient.createUser({ profileId: employerProfileId });
        } else {
          throw err;
        }
      }

      // Build payload
      const payload: any = {
        employerProfileId,
        title: data.title,
        objective: data.objective,
        deliverables: data.deliverables,
        acceptanceCriteria: data.acceptanceCriteria,
        rewardPoints: data.rewardPoints,
      };

      // Add resources if provided (with default type 'other')
      if (data.resources && data.resources.length > 0) {
        payload.resources = data.resources
          .filter((r) => r.label.trim()) // Only include resources with labels
          .map((r) => ({
            type: "other" as const,
            label: r.label,
            url: r.url || undefined,
            description: r.description || undefined,
          }));
      }

      if (data.deadline) {
        payload.deadline = new Date(data.deadline).toISOString();
      }

      // Create task
      await apiClient.createTask(payload as any);

      toast.success("Task agreement posted successfully!");

      // Refresh task list
      try {
        const res = await apiClient.listTasks();

        const mapped = (res || []).map((t: any) => {
          let postedDays = 0;
          if (t.createdAt) {
            const createdDate = new Date(t.createdAt);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - createdDate.getTime());
            postedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }

          return {
            id: t.id || t.taskId,
            companyLogo: t.companyLogo || t.company?.logo || "",
            companyName: t.companyName || t.company?.name || t.ownerName || "",
            jobTitle: t.title || t.jobTitle,
            description: t.description || t.summary || "",
            skills: t.skills || [],
            location: t.location || "",
            salary: t.salary || "",
            postedDays,
            owner: t.owner || {
              id: t.ownerId || t.ownerProfileId,
              name: t.ownerName || "",
            },
            rewardTokens: t.rewardPoints || t.rewardTokens || 0,
            employerProfileId:
              t.employerProfileId || t.ownerProfileId || t.ownerId,
            freelancerProfileId: t.freelancerProfileId ?? null,
            title: t.title,
            rewardPoints: t.rewardPoints || t.rewardTokens || 0,
            createdAt: t.createdAt,
            deadline: t.deadline,
            objective: t.objective,
            deliverables: t.deliverables,
            acceptanceCriteria: t.acceptanceCriteria,
            resources: t.resources || [],
            status: t.status || "open",
            assigneeId: t.assigneeId,
            applicants: t.applications || t.applicants || [],
          } as TaskItem;
        });

        const sorted = mapped.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        onSubmit(sorted);
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }

      setIsModalOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Failed to post task agreement:", error, error?.body);
      const msg =
        error?.body?.message ||
        error?.body?.error ||
        error?.message ||
        "Failed to post task agreement";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsModalOpen(false);
    }
    form.reset();
  };

  return (
    <>
      {externalIsOpen === undefined &&
        (isBanned ? (
          <Card className="p-4 opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <NoSymbolIcon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <H5 className="text-gray-500 dark:text-gray-400">
                  Không thể tạo Task
                </H5>
                <p className="text-red-500 text-sm">
                  Tài khoản đã bị khóa do điểm uy tín thấp
                </p>
              </div>
            </div>
        </Card>
        ) : (
          <Card
            className="cursor-pointer p-4 transition-shadow hover:shadow-md"
            onClick={() => setInternalIsModalOpen(true)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full task-gradient">
                <PlusIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <H5 className="text-gray-900 dark:text-white">
                  Create Task Agreement
                </H5>
                <p className="text-gray-500 text-sm dark:text-gray-400">
                  Create detailed agreement and find the right freelancer
                </p>
              </div>
              </div>
      </Card>
        ))}

      <Modal
        onClose={handleClose}
        show={isModalOpen}
        size="lg"
        title="Create Task Agreement"
      >
        <Form
          className="max-h-[80vh] space-y-6 overflow-y-auto p-6"
          form={form}
          onSubmit={handleSubmit}
          onError={(errors) => {
            console.debug("Validation errors", errors);

            const messages: string[] = [];
            let firstPath: string | null = null;

            function walk(errObj: any, pathPrefix = "") {
              if (!errObj) return;
              for (const key of Object.keys(errObj)) {
                const val = errObj[key];
                const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;

                if (val && (val.message || val.type) && !firstPath) {
                  firstPath = currentPath;
                }

                if (val && (val.message || val.types)) {
                  if (val.message) messages.push(val.message as string);
                  else if (val.types)
                    messages.push(Object.values(val.types).join(" "));
                }

                // nested errors
                if (val && typeof val === "object" && !val.message) {
                  walk(val, currentPath);
                }
              }
            }

            walk(errors);

            if (firstPath && typeof (form as any).setFocus === "function") {
              try {
                // react-hook-form setFocus expects the field name as registered (e.g. 'contact.email')
                (form as any).setFocus(firstPath);
              } catch (e) {
                // ignore focus errors
              }
            }

            if (messages.length === 0) {
              toast.error("Please fix form errors");
            } else if (messages.length === 1) {
              toast.error(messages[0]);
            } else {
              // show first error and inform there are more
              toast.error(`${messages[0]} (${messages.length} errors total)`);
            }
          }}
        >
          {/* Minimal Task fields required by backend */}
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g: Frontend Engineer - UI"
              {...form.register("title")}
            />

            <TextArea
              label="Objective"
              placeholder="Short objective of the task"
              rows={3}
              {...form.register("objective")}
            />

            <TextArea
              label="Deliverables"
              placeholder="What the freelancer should deliver"
              rows={3}
              {...form.register("deliverables")}
            />

            <TextArea
              label="Acceptance Criteria"
              placeholder="How you'll accept the work"
              rows={3}
              {...form.register("acceptanceCriteria")}
            />

            {/* Resources */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Resources (Optional)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add links to design files, API docs, repos, or other helpful
                resources
              </p>
              {resources.map((_, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Label (e.g. Figma Design)"
                      {...form.register(`resources.${index}.label`)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="URL (optional)"
                      {...form.register(`resources.${index}.url`)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const current = form.getValues("resources") || [];
                      form.setValue(
                        "resources",
                        current.filter((_, i) => i !== index),
                        { shouldValidate: true }
                      );
                    }}
                    className="mt-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const current = form.getValues("resources") || [];
                  form.setValue(
                    "resources",
                    [...current, { label: "", url: "" }],
                    {
                      shouldValidate: true,
                    }
                  );
                }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <LinkIcon className="size-4" />
                Add resource
              </button>
            </div>

            <Input
              label="Reward (points)"
              min="1"
              placeholder="e.g: 100"
              type="number"
              {...form.register("rewardPoints", { valueAsNumber: true })}
            />

            <DeadlineInput
              value={form.watch("deadline")}
              onChange={(isoString) => {
                form.setValue("deadline", isoString, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              error={!!form.formState.errors.deadline}
              name="deadline"
              label="Deadline"
              helper="When should this task be completed?"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
            <Button
              className="flex-1"
              disabled={isSubmitting}
              loading={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating..." : "Create Task Agreement"}
            </Button>
            <Button
              className="flex-1"
              disabled={isSubmitting}
              onClick={handleClose}
              outline
              type="button"
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default NewTask;
