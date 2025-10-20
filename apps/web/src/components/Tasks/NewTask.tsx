import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
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

const TaskAgreementSchema = z.object({
  acceptanceCriteria: z.string().min(1, "Acceptance criteria is required"),
  companyLogo: z.string().min(1, "Company logo is required"),
  companyName: z.string().min(1, "Company name is required"),
  contact: z.object({
    email: z.string().email("Invalid email format"),
    phone: z.string().min(1, "Phone number is required")
  }),
  deliverables: z.string().min(1, "Deliverables are required"),
  description: z.string().min(1, "Job description is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
  objective: z.string().min(1, "Main objective is required"),
  rewardTokens: z.number().min(1, "Reward must be greater than 0"),
  salary: z.string().min(1, "Salary is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required")
});

type TaskAgreementData = z.infer<typeof TaskAgreementSchema>;

const NewTask = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  // const { currentAccount } = useAccountStore();

  const form = useZodForm({
    defaultValues: {
      acceptanceCriteria: "",
      companyLogo: "",
      companyName: "",
      contact: {
        email: "",
        phone: ""
      },
      deliverables: "",
      description: "",
      jobTitle: "",
      location: "",
      objective: "",
      rewardTokens: 0,
      salary: "",
      skills: []
    },
    schema: TaskAgreementSchema
  });

  const { watch, setValue } = form;
  const skills = watch("skills");

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setValue("skills", [...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setValue(
      "skills",
      skills.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleSubmit = async (data: TaskAgreementData) => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Here you would call your API to create the task
      console.log("Creating task agreement:", data);

      toast.success("Task agreement posted successfully!");
      setIsModalOpen(false);
      form.reset();
    } catch (_error) {
      toast.error("Failed to post task agreement");
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
        >
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-full">
                <Input
                  label="Company Logo"
                  maxLength={10}
                  placeholder="e.g: WCE, TECH"
                  {...form.register("companyLogo")}
                />
              </div>
              <div className="w-full">
                <Input
                  label="Company Name"
                  placeholder="Company or organization name"
                  {...form.register("companyName")}
                />
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="space-y-4">
            <Input
              label="Job Title"
              placeholder="e.g: QA Engineer, Frontend Developer"
              {...form.register("jobTitle")}
            />

            <TextArea
              label="Job Description"
              placeholder="Detailed description of the job, requirements, responsibilities..."
              rows={4}
              {...form.register("description")}
            />
          </div>

          {/* Task Agreement Fields */}
          <div className="space-y-4 border-gray-200 border-t pt-4 dark:border-gray-700">
            <h6 className="font-medium text-gray-900 text-sm dark:text-white">
              Work Agreement
            </h6>

            <TextArea
              label="Main Objective"
              placeholder="e.g: Design a modern logo for our coffee brand."
              rows={3}
              {...form.register("objective")}
            />

            <TextArea
              label="Deliverables"
              placeholder="e.g: 01 PNG logo file (transparent background), 01 vector logo file (.AI)."
              rows={3}
              {...form.register("deliverables")}
            />

            <TextArea
              label="Acceptance Criteria"
              placeholder="e.g: Logo uses the correct 2 main colors provided, has 3 versions to choose from."
              rows={3}
              {...form.register("acceptanceCriteria")}
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add skill"
                value={newSkill}
              />
              <Button onClick={addSkill} size="sm" type="button">
                Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-700 text-sm dark:bg-gray-800 dark:text-gray-300"
                    key={index}
                  >
                    {skill}
                    <button
                      className="ml-1 text-gray-400 hover:text-gray-600"
                      onClick={() => removeSkill(skill)}
                      type="button"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location & Salary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Location"
              placeholder="e.g: Remote, Hybrid, On-site"
              {...form.register("location")}
            />
            <Input
              label="Salary"
              placeholder="e.g: 100.000/h, $50/hour"
              {...form.register("salary")}
            />
          </div>

          {/* Reward Tokens */}
          <Input
            label="Reward (tokens)"
            min="1"
            placeholder="Number of tokens to reward upon completion"
            type="number"
            {...form.register("rewardTokens", { valueAsNumber: true })}
          />

          {/* Contact Info */}
          <div className="space-y-4 border-gray-200 border-t pt-4 dark:border-gray-700">
            <h6 className="font-medium text-gray-900 text-sm dark:text-white">
              Contact Information
            </h6>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Email"
                placeholder="email@example.com"
                type="email"
                {...form.register("contact.email")}
              />
              <Input
                label="Phone Number"
                placeholder="+84 123 456 789"
                type="tel"
                {...form.register("contact.phone")}
              />
            </div>
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
