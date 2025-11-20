# Task Management System - Frontend Documentation

## Tổng quan
Frontend đã được thiết kế module hóa, tách biệt rõ ràng giữa logic và UI components, tận dụng components có sẵn và đồng bộ với giao diện hiện tại.

## Cấu trúc thư mục

```
apps/web/src/
├── types/
│   └── task-api.d.ts                    # Type definitions cho tất cả API
├── lib/
│   └── apiClient.ts                      # API Client đã được mở rộng
├── store/
│   └── non-persisted/
│       └── useNotificationStore.ts       # Zustand store cho notifications
└── components/
    ├── Tasks/
    │   ├── index.tsx                     # Main Tasks page
    │   ├── TaskCard.tsx                  # Card hiển thị task
    │   ├── NewTask.tsx                   # Modal tạo task mới
    │   ├── TaskDetailModal.tsx           # Modal chi tiết task (CẦN SỬA)
    │   └── Applications/
    │       ├── ApplicationCard.tsx       # Card hiển thị application
    │       ├── ApplicationList.tsx       # List applications cho 1 task
    │       ├── ApplyModal.tsx            # Modal apply cho task
    │       └── SubmitOutcomeModal.tsx    # Modal submit work
    └── Notification/
        ├── NotificationList.tsx          # Danh sách notifications
        └── NotificationBell.tsx          # Icon bell với số lượng chưa đọc

```

## Chi tiết các Components

### 1. API Client (`lib/apiClient.ts`)

Đã mở rộng với tất cả các endpoints:

**Tasks:**
- `createTask(payload)` - POST /tasks
- `listTasks()` - GET /tasks
- `getTask(taskId)` - GET /tasks/:id
- `updateTask(taskId, payload)` - PUT /tasks/:id
- `deleteTask(taskId)` - PATCH /tasks/:id

**Applications:**
- `listApplications()` - GET /applications
- `getApplicationsByTask(taskId)` - GET /applications/task/:taskId
- `createApplication(payload)` - POST /applications
- `submitOutcome(applicationId, payload)` - POST /applications/:id/submit
- `updateApplication(applicationId, payload)` - PUT /applications/:id
- `rateApplication(applicationId, payload)` - POST /applications/:id/rate
- `deleteApplication(applicationId)` - DELETE /applications/:id

**Users:**
- `listUsers()` - GET /users
- `getUser(profileId)` - GET /users/:profileId
- `createUser(payload)` - POST /users
- `updateUser(profileId, payload)` - PUT /users/:profileId
- `deleteUser(profileId)` - DELETE /users/:profileId
- `adjustUserPoints(profileId, payload)` - POST /users/:profileId/adjust-points

**Notifications:**
- `getNotifications()` - GET /notifications
- `getUnreadCount()` - GET /notifications/unread
- `markNotificationAsRead(notificationId)` - PUT /notifications/:id/read
- `markAllNotificationsAsRead()` - PUT /notifications/read-all
- `deleteNotification(notificationId)` - DELETE /notifications/:id

### 2. Type Definitions (`types/task-api.d.ts`)

Định nghĩa đầy đủ types cho:
- Task, TaskChecklistItem, CreateTaskPayload, UpdateTaskPayload
- Application, CreateApplicationPayload, SubmitOutcomePayload, UpdateApplicationPayload, RateApplicationPayload
- User, CreateUserPayload, UpdateUserPayload, AdjustPointsPayload
- Notification, UnreadCountResponse

### 3. Notification Store (`store/non-persisted/useNotificationStore.ts`)

Zustand store quản lý state cho notifications:
- `notifications`: array of Notification
- `unreadCount`: số lượng chưa đọc
- `setNotifications`, `setUnreadCount`, `setLoading`
- `addNotification`, `markAsRead`, `markAllAsRead`, `removeNotification`

### 4. Application Components

#### ApplicationCard
Hiển thị 1 application với:
- Avatar + profile info
- Status badge (submitted, accepted, rejected, needs_revision, completed)
- Cover letter
- Outcome (text hoặc file link)
- Feedback (nếu needs_revision)
- Rating & comment (nếu completed)
- Action buttons cho employer (Accept, Request Revision, Reject)

#### ApplicationList
Quản lý danh sách applications cho 1 task:
- Load applications từ API
- Handle Accept/Reject/Request Revision
- Tự động refresh sau mỗi action
- Loading state & empty state

#### ApplyModal
Modal để freelancer apply cho task:
- Cover letter field (optional)
- Tự động tạo user nếu chưa tồn tại
- Submit application qua API

#### SubmitOutcomeModal
Modal để freelancer submit work:
- Chọn outcome type (text hoặc file URL)
- Textarea/input cho outcome
- Submit qua API

### 5. Notification Components

#### NotificationBell
Icon bell hiển thị ở header/navbar:
- Badge đỏ với số lượng unread
- Poll API mỗi 30 giây để cập nhật
- Link đến trang /notifications

#### NotificationList
Danh sách đầy đủ notifications:
- Filter: All / Unread
- Mark as read (từng cái hoặc tất cả)
- Delete notification
- Auto-refresh mỗi 30 giây
- Format time (Just now, 5m ago, 2h ago, 3d ago)

### 6. Task Components (Đã có, cần update)

#### TaskDetailModal
**⚠️ FILE NÀY CẦN SỬA LẠI** (hiện tại bị duplicate content)

Nên có:
- Tabs: Details / Applications
- Tab Details:
  - Task info với status badge
  - Created date / Deadline
  - Reward points
  - Objective, Deliverables, Acceptance Criteria
- Tab Applications:
  - ApplicationList component
  - Employer có thể accept/reject
- Action buttons:
  - Freelancer: "Apply for Task" hoặc "Submit Work"
  - Employer: "Close"

## Cách sửa TaskDetailModal

File hiện tại bị duplicate nội dung (mỗi dòng xuất hiện 2 lần). Cần:

1. Xóa file cũ:
```powershell
Remove-Item "d:\INTERN\Lens\Slice\apps\web\src\components\Tasks\TaskDetailModal.tsx" -Force
```

2. Tạo file mới với nội dung như sau:

```tsx
import {
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { Button, H5, Modal, Tabs} from "@/components/Shared/UI";
import { useAccountStore } from "@/store/persisted/useAccountStore";
import { TaskItem } from "./TaskCard";
import ApplicationList from "./Applications/ApplicationList";
import ApplyModal from "./Applications/ApplyModal";
import SubmitOutcomeModal from "./Applications/SubmitOutcomeModal";

const TaskDetailModal = ({
  task,
  isOpen,
  onClose
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "applications">("details");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentAccount } = useAccountStore();

  if (!task) return null;

  const isOwner = task.employerProfileId === curren;
  const hasApplied = task.applicants.some(
    (applicant) => applicant.walletAddress === currentAccount?.address || applicant.applicant === currentAccount?.address
  );

  const myApplication = task.applicants.find(
    (applicant) => applicant.walletAddress === currentAccount?.address || applicant.applicant === currentAccount?.address
  );
  const canSubmitOutcome = myApplication && (myApplication as any).status === "accepted";

  const handleApplicationUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "in_review":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "completed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <>
      <Modal onClose={onClose} show={isOpen} size="lg" title="Task Details">
        <div className="space-y-4 p-6">
          {/* Header with status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {task.employerAvatar ? (
                <img src={task.employerAvatar} alt={task.employerName} className="h-12 w-12 rounded-full" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 font-bold text-lg text-white">
                  {task.employerName?.charAt(0) || "T"}
                </div>
              )}
              <div>
                <H5 className="text-gray-900 dark:text-white">{task.title}</H5>
                <p className="text-gray-600 text-sm dark:text-gray-400">
                  {task.employerName || task.employerProfileId?.slice(0, 8)}
                </p>
              </div>
            </div>
            
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            {task.createdAt && (
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>Posted {formatDate(task.createdAt)}</span>
              </div>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Due {formatDate(task.deadline)}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs
            active={activeTab}
            layoutId="task_detail_tabs"
            setActive={(type) => setActiveTab(type as "details" | "applications")}
            tabs={[
              { name: "Details", type: "details" },
              { name: `Applications (${task.applicants.length})`, type: "applications" }
            ]}
          />

          {/* Tab Content */}
          {activeTab === "details" && (
            <div className="space-y-4">
              {/* Reward */}
              <div className="rounded-lg bg-brand-50 p-4 dark:bg-brand-900/20">
                <div className="flex items-center gap-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-brand-500" />
                  <div>
                    <p className="font-medium text-brand-600 text-sm dark:text-brand-400">
                      Completion Reward
                    </p>
                    <p className="font-bold text-2xl text-brand-600 dark:text-brand-400">
                      {task.rewardPoints} points
                    </p>
                  </div>
                </div>
              </div>

              {/* Objective */}
              {task.objective && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Main Objective
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.objective}
                  </p>
                </div>
              )}

              {/* Deliverables */}
              {task.deliverables && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Deliverables
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.deliverables}
                  </p>
                </div>
              )}

              {/* Acceptance Criteria */}
              {task.acceptanceCriteria && (
                <div>
                  <h6 className="mb-2 font-medium text-gray-700 text-sm dark:text-gray-300">
                    Acceptance Criteria
                  </h6>
                  <p className="rounded-lg bg-gray-50 p-3 text-gray-600 text-sm dark:bg-gray-800 dark:text-gray-400">
                    {task.acceptanceCriteria}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "applications" && (
            <ApplicationList
              key={refreshKey}
              taskId={task.id}
              isEmployer={isOwner}
              onApplicationUpdate={handleApplicationUpdate}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 border-gray-200 border-t pt-4 dark:border-gray-700">
            {!isOwner && !hasApplied && task.status === "open" && (
              <Button
                className="flex-1"
                onClick={() => setShowApplyModal(true)}
              >
                Apply for Task
              </Button>
            )}

            {!isOwner && hasApplied && (
              <Button className="flex-1" disabled>
                Application Submitted
              </Button>
            )}

            {!isOwner && canSubmitOutcome && (
              <Button
                className="flex-1"
                onClick={() => setShowSubmitModal(true)}
              >
                Submit Work
              </Button>
            )}

            <Button className="flex-1" onClick={onClose} outline>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Apply Modal */}
      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onSuccess={handleApplicationUpdate}
      />

      {/* Submit Outcome Modal */}
      {myApplication && (
        <SubmitOutcomeModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          applicationId={myApplication.id || ""}
          onSuccess={handleApplicationUpdate}
        />
      )}
    </>
  );
};

export default TaskDetailModal;
```

## Tích hợp Notification Bell

Thêm NotificationBell vào navbar/header của app. Ví dụ trong `apps/web/src/components/Common/Layout.tsx`:

```tsx
import NotificationBell from "@/components/Notification/NotificationBell";

// Trong JSX, thêm:
<NotificationBell />
```

## Testing API

Đảm bảo biến môi trường đã được cấu hình đúng:

```env
VITE_SLICE_API_URL=http://localhost:4000
```

hoặc nếu đã deploy backend:

```env
VITE_SLICE_API_URL=https://your-backend-api.com
```

## Workflow người dùng

### Employer (Người thuê):
1. Tạo task mới qua NewTask button
2. Xem danh sách tasks tại tab "Posted Tasks"
3. Click vào task → Tab "Applications" → Accept/Reject/Request Revision
4. Sau khi freelancer submit work → Accept hoặc Request Revision lần 2
5. Khi completed → Rate the work

### Freelancer (Người làm):
1. Xem danh sách tasks tại tab "Tasks List"
2. Click task → "Apply for Task" → Submit application
3. Khi được accept → "Submit Work"
4. Nếu needs revision → Sửa và submit lại
5. Nhận rating khi completed

### Notifications:
- Employer nhận thông báo khi có application mới hoặc work được submit
- Freelancer nhận thông báo khi application được accept/reject, hoặc work được approved/rated
- Icon bell luôn hiển thị số lượng unread

## Các cải tiến có thể thêm

1. **Real-time notifications**: Sử dụng WebSocket thay vì polling
2. **File upload**: Cho phép upload file trực tiếp thay vì chỉ URL
3. **Task search & filter**: Filter theo status, reward range, deadline
4. **User profiles**: Trang profile đầy đủ với rating history, completed tasks
5. **Task checklist**: UI để manage checklist items
6. **Pagination cho applications**: Nếu số lượng applications lớn
7. **Advanced rating system**: Review text, multiple criteria
8. **Email notifications**: Gửi email khi có sự kiện quan trọng

## Troubleshooting

### CORS errors
Nếu gặp lỗi CORS, đảm bảo backend đã config:
```typescript
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
  credentials: true
}))
```

### 401 Unauthorized
- Kiểm tra JWT token đã được lưu trong localStorage/cookie
- Kiểm tra `apiClient.getToken()` có return đúng token không
- Kiểm tra token chưa hết hạn

### Task không load
- Kiểm tra `VITE_SLICE_API_URL` trong `.env`
- Kiểm tra backend đang chạy
- Mở DevTools → Network tab để xem API response

## Kết luận

Frontend đã được thiết kế hoàn chỉnh với:
✅ API Client đầy đủ tất cả endpoints
✅ Type definitions chuẩn TypeScript
✅ Components module hóa, dễ maintain
✅ UI/UX đồng bộ với existing design system
✅ State management với Zustand
✅ Real-time notifications (polling)
✅ Error handling và loading states

**Việc còn lại:** Sửa file `TaskDetailModal.tsx` bị duplicate content như hướng dẫn ở trên.
