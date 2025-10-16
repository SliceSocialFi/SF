import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button, Card, H5, Input, TextArea, Modal, Form, useZodForm } from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";

const TaskAgreementSchema = z.object({
  companyLogo: z.string().min(1, "Logo công ty là bắt buộc"),
  companyName: z.string().min(1, "Tên công ty là bắt buộc"),
  jobTitle: z.string().min(1, "Tiêu đề công việc là bắt buộc"),
  description: z.string().min(1, "Mô tả công việc là bắt buộc"),
  objective: z.string().min(1, "Mục tiêu chính là bắt buộc"),
  deliverables: z.string().min(1, "Sản phẩm cần bàn giao là bắt buộc"),
  acceptanceCriteria: z.string().min(1, "Tiêu chí nghiệm thu là bắt buộc"),
  skills: z.array(z.string()).min(1, "Ít nhất một kỹ năng là bắt buộc"),
  location: z.string().min(1, "Địa điểm là bắt buộc"),
  salary: z.string().min(1, "Mức lương là bắt buộc"),
  rewardTokens: z.number().min(1, "Phần thưởng phải lớn hơn 0"),
  contact: z.object({
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().min(1, "Số điện thoại là bắt buộc")
  })
});

type TaskAgreementData = z.infer<typeof TaskAgreementSchema>;

const NewTask = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const { currentAccount } = useAccountStore();
  
  const form = useZodForm({
    schema: TaskAgreementSchema,
    defaultValues: {
      companyLogo: "",
      companyName: "",
      jobTitle: "",
      description: "",
      objective: "",
      deliverables: "",
      acceptanceCriteria: "",
      skills: [],
      location: "",
      salary: "",
      rewardTokens: 0,
      contact: {
        email: "",
        phone: ""
      }
    }
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
    setValue("skills", skills.filter(skill => skill !== skillToRemove));
  };

  const handleSubmit = async (data: TaskAgreementData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would call your API to create the task
      console.log("Creating task agreement:", data);
      
      toast.success("Đăng thỏa thuận công việc thành công!");
      setIsModalOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng thỏa thuận công việc");
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
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsModalOpen(true)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <H5 className="text-gray-900 dark:text-white">Tạo thỏa thuận công việc</H5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tạo thỏa thuận chi tiết và tìm người thực hiện
            </p>
          </div>
        </div>
      </Card>

      <Modal show={isModalOpen} onClose={handleClose} size="lg" title="Tạo Thỏa thuận Công việc">
        <Form className="p-6 space-y-6 max-h-[80vh] overflow-y-auto" form={form} onSubmit={handleSubmit}>
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-full">
                <Input
                  label="Logo công ty"
                  placeholder="VD: WCE, TECH"
                  maxLength={10}
                  {...form.register("companyLogo")}
                />
              </div>
              <div className="w-full">
                <Input
                  label="Tên công ty"
                  placeholder="Tên công ty hoặc tổ chức"
                  {...form.register("companyName")}
                />
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="space-y-4">
            <Input
              label="Chức danh công việc"
              placeholder="VD: QA Engineer, Frontend Developer"
              {...form.register("jobTitle")}
            />

            <TextArea
              label="Mô tả công việc"
              placeholder="Mô tả chi tiết về công việc, yêu cầu, trách nhiệm..."
              rows={4}
              {...form.register("description")}
            />
          </div>

          {/* Task Agreement Fields */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h6 className="text-sm font-medium text-gray-900 dark:text-white">
              Thỏa thuận Công việc
            </h6>
            
            <TextArea
              label="Mục tiêu chính"
              placeholder="Ví dụ: Thiết kế một logo hiện đại cho thương hiệu cà phê của chúng tôi."
              rows={3}
              {...form.register("objective")}
            />
            
            <TextArea
              label="Sản phẩm cần bàn giao"
              placeholder="Ví dụ: 01 file logo định dạng PNG (nền trong suốt), 01 file logo định dạng vector (.AI)."
              rows={3}
              {...form.register("deliverables")}
            />
            
            <TextArea
              label="Tiêu chí nghiệm thu"
              placeholder="Ví dụ: Logo sử dụng đúng 2 màu chủ đạo đã cung cấp, có 3 phiên bản để lựa chọn."
              rows={3}
              {...form.register("acceptanceCriteria")}
            />
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kỹ năng yêu cầu
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Thêm kỹ năng"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button type="button" onClick={addSkill} size="sm">
                Thêm
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location & Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Địa điểm"
              placeholder="VD: Remote, Hybrid, On-site"
              {...form.register("location")}
            />
            <Input
              label="Mức lương"
              placeholder="VD: 100.000/h, $50/hour"
              {...form.register("salary")}
            />
          </div>

          {/* Reward Tokens */}
          <Input
            label="Phần thưởng (tokens)"
            type="number"
            placeholder="Số token sẽ trả cho người hoàn thành"
            min="1"
            {...form.register("rewardTokens", { valueAsNumber: true })}
          />

          {/* Contact Info */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h6 className="text-sm font-medium text-gray-900 dark:text-white">
              Thông tin liên hệ
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                {...form.register("contact.email")}
              />
              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="+84 123 456 789"
                {...form.register("contact.phone")}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              className="flex-1"
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo thỏa thuận công việc"}
            </Button>
            <Button
              outline
              className="flex-1"
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default NewTask;
