import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
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
  useZodForm
} from "@/components/Shared/UI";
import type { TaskItem } from "@/components/Shared/Sidebar/TaskSystem";

// Client validation should match backend zod schema to avoid 400s.
// Backend requires: title >=3, objective/deliverables/acceptanceCriteria >=10,
// rewardPoints positive integer, deadline is optional ISO datetime.
const TaskAgreementSchema = z.object({
  title: z.string().min(1, "Title must be at least 3 characters"),
  objective: z.string().min(1, "Objective must be at least 10 characters"),
  deliverables: z.string().min(1, "Deliverables must be at least 10 characters"),
  acceptanceCriteria: z.string().min(1, "Acceptance criteria must be at least 10 characters"),
  rewardPoints: z.number().int().positive("Reward must be a positive integer"),
  // Accept a simple date from the <input type="date" /> (YYYY-MM-DD) and
  // preprocess it into an ISO datetime string so server's z.string().datetime()
  // validation will pass. Deadline is optional.
  deadline: z.preprocess((val) => {
    if (!val) return undefined;
    if (typeof val === "string") {
      // If the input is a plain date (YYYY-MM-DD), create an ISO at midnight UTC
      // new Date('YYYY-MM-DD') interprets as UTC by most browsers; normalize anyway
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    return val;
  }, z.string().datetime().optional())
});

type TaskAgreementData = z.infer<typeof TaskAgreementSchema>;

const NewTask = ({ onSubmit = (tasks:any) => {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentAccount } = useAccountStore();

  const form = useZodForm({
    defaultValues: {
      title: "",
      objective: "",
      deliverables: "",
      acceptanceCriteria: "",
      // default to 1 so an accidental empty submit doesn't immediately fail validation
      rewardPoints: 1,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    },
    schema: TaskAgreementSchema
  });

  const handleSubmit = async (data: TaskAgreementData) => {
    if (!currentAccount?.address) {
      toast.error("Please connect wallet");
      return;
    }
    setIsSubmitting(true);
    try {
      // ensure we have currentAccount/profile id
      if (!currentAccount?.address) {
        toast.error("You must be logged in to create a task");
        return;
      }

      const employerProfileId = currentAccount.address;

      // Ensure user exists in backend (users.profile_id) to satisfy FK constraints
      try {
        await apiClient.getUser(employerProfileId);
      } catch (err: any) {
        if (err?.status === 404) {
          await apiClient.createUser({ profileId: employerProfileId });
        } else {
          throw err;
        }
      }

      // Build payload including employerProfileId required by backend
      const payload: any = {
        employerProfileId,
        title: data.title,
        objective: data.objective,
        deliverables: data.deliverables,
        acceptanceCriteria: data.acceptanceCriteria,
        rewardPoints: data.rewardPoints
      };

      if (data.deadline) {
        payload.deadline = new Date(data.deadline).toISOString();
      }
    
      await apiClient.createTask(payload as any);

      toast.success("Task agreement posted successfully!");

      

      const tasks = await apiClient.listTasks(); // refresh task list cache

      try {
              const res = await apiClient.listTasks();
              // Attempt to map server task shape to local TaskItem
              const mapped = (res || []).map((t: any) => {
                // Calculate days since created
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
                  owner: t.owner || { id: t.ownerId || t.ownerProfileId, name: t.ownerName || "" },
                  rewardTokens: t.rewardPoints || t.rewardTokens || 0,
                  // backend-compatible fields
                  employerProfileId: t.employerProfileId || t.ownerProfileId || t.ownerId,
                  freelancerProfileId: t.freelancerProfileId ?? null,
                  title: t.title,
                  rewardPoints: t.rewardPoints || t.rewardTokens || 0,
                  createdAt: t.createdAt,
                  deadline: t.deadline,
                  objective: t.objective,
                  deliverables: t.deliverables,
                  acceptanceCriteria: t.acceptanceCriteria,
                  status: t.status || "open",
                  assigneeId: t.assigneeId,
                  applicants: t.applications || t.applicants || []
                } as TaskItem;
              });
      
              // Sort by createdAt descending (newest first)
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
      // Log full error including body (ApiClient throws ApiError with .status and .body)
      console.error("Failed to post task agreement:", error, error?.body);
      const msg = error?.body?.message || error?.body?.error || error?.message || "Failed to post task agreement";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    form.reset();
  };

  return (
    <>
      <Card
        className="cursor-pointer p-4 transition-shadow hover:shadow-md"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600">
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

            // traverse errors object to collect messages and determine first field path
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
                  else if (val.types) messages.push(Object.values(val.types).join(" "));
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

            <Input
              label="Reward (points)"
              min="1"
              placeholder="e.g: 100"
              type="number"
              {...form.register("rewardPoints", { valueAsNumber: true })}
            />
            <Input
              label="Deadline"
              type="date"
              min={new Date().toISOString().split("T")[0]} //Không cho chọn quá khứ
              {...form.register("deadline")}
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