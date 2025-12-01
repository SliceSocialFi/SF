# Notification System - Complete Documentation

## 📋 Tổng quan

Hệ thống thông báo được xây dựng với kiến trúc **Dedicated Page**, sử dụng **lightweight polling** và **page-based pagination** để đảm bảo hiệu suất tốt nhất.

---

## 🏗️ Kiến trúc Hệ thống

### Frontend Architecture

```
Navbar (Desktop/Mobile)
  └─> NotificationBell Icon (integrated in navigationItems)
      ├─> useNotificationPolling() (10s intervals)
      ├─> Badge indicator (red dot when unreadCount > 0)
      └─> Navigate to /notifications

NotificationsPage (/notifications)
  ├─> useQuery with page-based pagination
  ├─> Tab Navigation (All / Unread)
  ├─> Mark All as Read button
  ├─> Pagination (Previous / Next buttons)
  └─> Notification Cards
      ├─> Avatar + Sender info
      ├─> Title + Message
      ├─> Time (relative)
      ├─> Type Badge
      └─> Mark as Read button
```

### Backend Requirements

**Endpoint:** `GET /notifications`

**Response Format:**
```json
[
  {
    "id": "uuid",
    "userProfileId": "0x...",
    "senderProfileId": "0x...",
    "type": "application_received",
    "title": "New Application Received",
    "message": "User applied for your task",
    "relatedTaskId": "task-uuid",
    "relatedApplicationId": "app-uuid",
    "isRead": 0,
    "createdAt": "2025-11-26T10:00:00Z",
    "metadata": {
      "taskId": "task-uuid",
      "applicationId": "app-uuid"
    },
    "sender": {
      "username": "john_doe",
      "avatar": "https://..."
    }
  }
]
```

**Note:** Backend cần map `relatedTaskId` vào `metadata.taskId` để frontend navigate chính xác.

---

## 📁 Cấu trúc Files

### Core Files

| File | Purpose | Status |
|------|---------|--------|
| `src/components/Shared/Navbar/index.tsx` | Notification bell integrated into navigation | ✅ Active |
| `src/components/Notification/NotificationsPage.tsx` | Full-page notification management | ✅ Active |
| `src/hooks/useNotificationPolling.ts` | Polling hook for unread count | ✅ Active |
| `src/store/non-persisted/useNotificationStore.ts` | Zustand store for task notifications | ✅ Active |
| `src/lib/apiClient.ts` | API methods | ✅ Active |

### Legacy Files (Lens Social Notifications)

| File | Purpose | Status |
|------|---------|--------|
| `src/components/Notification/List.tsx` | Lens social notifications list | 📦 Keep (different system) |
| `src/components/Notification/FeedType.tsx` | Feed type tabs for Lens | 📦 Keep |
| `src/components/Notification/Type/*` | Lens notification types | 📦 Keep |
| `src/store/persisted/useNotificationStore.ts` | Store for Lens notifications | 📦 Keep |

---

## 🔧 Technical Implementation

### 1. Notification Bell (Navbar Integration)

**Location:** `src/components/Shared/Navbar/index.tsx`

```tsx
// navigationItems includes /notifications route
"/notifications": {
  outline: <BellOutline className="size-6" />,
  solid: <BellSolid className="size-6" />,
  title: "Notifications",
}

// Badge indicator in NavItems
const iconWithIndicator = route === "/notifications" ? (
  <span className="relative">
    {icon}
    {unreadCount > 0 && (
      <span className="-right-1 -top-1 absolute size-2 rounded-full bg-red-500" />
    )}
  </span>
) : icon;

// Polling activated in Navbar component
useNotificationPolling();
```

**Features:**
- ✅ Integrated như một nav item thông thường
- ✅ Red dot badge khi có unread
- ✅ Solid icon khi active (đang ở trang notifications)
- ✅ Tooltip "Notifications" khi hover

### 2. Polling Hook

**Location:** `src/hooks/useNotificationPolling.ts`

```tsx
export const useNotificationPolling = () => {
  const { setUnreadCount } = useNotificationStore();
  const previousCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const result = await apiClient.getUnreadCount();
      return result.count;
    },
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!currentAccount,
  });

  // Update store and play sound on new notifications
  useEffect(() => {
    if (data !== undefined) {
      const newCount = data;
      const currentCount = previousCountRef.current;
      
      // Play sound if count increased
      if (newCount > currentCount && currentCount > 0) {
        audioRef.current?.play().catch(console.error);
      }
      
      setUnreadCount(newCount);
      previousCountRef.current = newCount;
    }
  }, [data, setUnreadCount]);
};
```

**Features:**
- ✅ Poll unread count every 10 seconds
- ✅ Play sound when new notifications arrive
- ✅ Optimized: Only fetch count, not full list
- ✅ Automatic cleanup

### 3. NotificationsPage

**Location:** `src/components/Notification/NotificationsPage.tsx`

**Key Features:**

#### A. Page-based Pagination
```tsx
const NOTIFICATIONS_PER_PAGE = 10;
const [currentPage, setCurrentPage] = useState(0);

const { data, isLoading } = useQuery({
  queryKey: ["notifications", "list", currentPage],
  queryFn: async () => {
    return await apiClient.getNotifications({
      limit: NOTIFICATIONS_PER_PAGE,
      offset: currentPage * NOTIFICATIONS_PER_PAGE,
    });
  },
  enabled: !!currentAccount,
});

const totalPages = Math.max(1, Math.ceil(totalCount / NOTIFICATIONS_PER_PAGE));
```

#### B. Tab Navigation
```tsx
const [filter, setFilter] = useState<"all" | "unread">("all");

<Tabs
  active={filter}
  setActive={(type) => setFilter(type as "all" | "unread")}
  tabs={[
    {
      name: "All",
      type: "all",
      suffix: <Badge>{totalCount}</Badge>,
    },
    {
      name: "Unread",
      type: "unread",
      suffix: unreadCount > 0 ? <Badge>{unreadCount}</Badge> : null,
    },
  ]}
/>
```

#### C. Mark All as Read
```tsx
const handleMarkAllAsRead = async () => {
  if (unreadCount === 0) return;

  try {
    // Optimistic update
    setUnreadCount(0);
    
    // Update cache
    if (data) {
      queryClient.setQueryData(
        ["notifications", "list", currentPage],
        (oldData: Notification[]) => 
          oldData?.map((n) => ({ ...n, isRead: true })) ?? []
      );
    }

    // API call
    await apiClient.markAllNotificationsAsRead();
    
    // Invalidate to refresh
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    
    toast.success("All notifications marked as read");
  } catch (error) {
    toast.error("Failed to mark all as read");
    refetch();
  }
};
```

#### D. Smart Navigation
```tsx
const handleNotificationClick = async (notification: Notification) => {
  // 1. Mark as read
  if (!notification.isRead) {
    handleMarkAsRead(notification.id);
  }

  // 2. Navigate based on type
  const taskId = notification.metadata?.taskId;

  switch (notification.type) {
    case "application_received":
      navigate(taskId ? `/my-tasks/${taskId}` : "/my-tasks");
      break;
    case "application_accepted":
      navigate(taskId ? `/tasks/${taskId}` : "/tasks");
      break;
    case "task_submitted":
      navigate(taskId ? `/my-tasks/${taskId}` : "/my-tasks");
      break;
    // ... more cases
  }
};
```

#### E. Pagination UI
```tsx
{filteredNotifications.length > 0 && totalPages > 1 && (
  <div className="flex items-center justify-center gap-4 pt-6 pb-4">
    <button
      onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
      disabled={currentPage === 0}
      className="flex items-center gap-1 rounded-lg border px-4 py-2 font-medium text-sm"
    >
      <ChevronLeftIcon className="h-5 w-5" />
      Previous
    </button>

    <span className="text-gray-600 text-sm">
      Page {currentPage + 1} of {totalPages}
    </span>

    <button
      onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
      disabled={currentPage >= totalPages - 1}
      className="flex items-center gap-1 rounded-lg border px-4 py-2 font-medium text-sm"
    >
      Next
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  </div>
)}
```

### 4. Zustand Store

**Location:** `src/store/non-persisted/useNotificationStore.ts`

```tsx
interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementCount: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  decrementCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  
  markAsRead: (id) => set((state) => ({ 
    unreadCount: Math.max(0, state.unreadCount - 1) 
  })),
  
  markAllAsRead: () => set({ unreadCount: 0 }),
}));
```

### 5. API Client

**Location:** `src/lib/apiClient.ts`

```typescript
class ApiClient {
  // Get unread count
  async getUnreadCount(): Promise<{ count: number }> {
    return this.request('/notifications/unread-count', { method: 'GET' });
  }

  // Get notifications with pagination
  async getNotifications(params?: { limit?: number; offset?: number }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.offset) queryParams.append('offset', String(params.offset));
    
    const path = queryParams.toString() 
      ? `/notifications?${queryParams.toString()}` 
      : '/notifications';
      
    const notifications = await this.request(path, { method: 'GET' });
    
    // Map to include metadata for navigation
    return Array.isArray(notifications) 
      ? notifications.map((n: any) => ({
          ...n,
          metadata: {
            taskId: n.relatedTaskId,
            applicationId: n.relatedApplicationId
          }
        })) 
      : [];
  }

  // Mark single notification as read
  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  // Mark all as read
  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', { method: 'PATCH' });
  }
}
```

---

## 🎨 UI/UX Features

### Design System Components

| Component | Usage | Variants |
|-----------|-------|----------|
| `Card` | Notification container | Default |
| `Badge` | Type indicator, counts | Primary, custom colors |
| `Tabs` | Filter navigation | All, Unread |
| `EmptyState` | No notifications | Icon + message |
| `Spinner` | Loading state | Default |

### Visual States

**Unread Notification:**
- Background: `bg-brand-50/30 dark:bg-brand-900/5`
- Border: `border-brand-200 dark:border-brand-800`
- Badge: `bg-brand-100 text-brand-700`
- Avatar indicator: Blue dot ring

**Read Notification:**
- Background: Default card background
- Border: Default card border
- Badge: `bg-gray-100 text-gray-700`
- No avatar indicator

### Responsive Design

- **Desktop:** Tab navigation + full-width cards
- **Mobile:** MobileHeader + compact layout
- **Pagination:** Always centered, responsive buttons

---

## 🔄 Navigation Rules

All task-related notifications navigate to `/tasks/:taskId` route, which displays TaskDetailPage component. The page automatically adapts UI based on user role (employer vs freelancer).

| Notification Type | Recipient | Navigate To | Description |
|-------------------|-----------|-------------|-------------|
| `application_received` | Employer | `/tasks/:taskId` | View task with new application |
| `application_accepted` | Freelancer | `/tasks/:taskId` | View accepted task details |
| `application_rejected` | Freelancer | `/tasks` | View all tasks (no specific task) |
| `task_submitted` | Employer | `/tasks/:taskId` | Review submitted work |
| `task_approved` | Freelancer | `/tasks/:taskId` | View approved task |
| `task_rated` | Freelancer | `/tasks/:taskId` | View rating received |
| `task_needs_revision` | Freelancer | `/tasks/:taskId` | Resubmit work |
| `task_created` | Public | `/tasks/:taskId` | View new task details |

---

## 📊 Performance Optimizations

### 1. Lightweight Polling
- Only fetch unread **count** (not full list)
- 10-second interval (not aggressive)
- Automatic pause when page hidden

### 2. Page-based Pagination
- Load 10 items at a time
- Simple Previous/Next navigation
- Better for database queries (offset-based)

### 3. Optimistic Updates
- Mark as read → UI updates immediately
- API call in background
- Rollback on error

### 4. Smart Caching
- React Query cache per page
- 30-second stale time
- Invalidate on mutations

---

## 🧪 Testing Scenarios

### Frontend Testing

1. **Polling:**
   - Open app → verify polling starts
   - Create notification on backend → badge updates within 10s
   - Sound plays when new notification arrives

2. **Navigation:**
   - Click bell icon → navigate to `/notifications`
   - Click notification card → navigate to correct route
   - Back button → return to previous page

3. **Mark as Read:**
   - Click individual mark button → badge decrements
   - Click "Mark all as read" → all items marked, badge = 0
   - Refresh page → state persists

4. **Pagination:**
   - Create 15+ notifications
   - Verify pages show 10 items each
   - Click Next/Previous → correct page loads
   - Page count displays correctly

5. **Filters:**
   - Switch to "Unread" tab → only unread shown
   - Mark some as read → filter updates
   - Badge counts match filtered results

### Backend Testing

```bash
# 1. Check unread count
curl http://localhost:3000/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Get notifications list
curl http://localhost:3000/notifications?limit=10&offset=0 \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Mark as read
curl -X PATCH http://localhost:3000/notifications/NOTIF_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Mark all as read
curl -X PATCH http://localhost:3000/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Deployment Checklist

### Backend
- [ ] Database table `notifications` with indexes
- [ ] API endpoints implemented and tested
- [ ] Notification service triggers on events
- [ ] Metadata mapping in GET response
- [ ] Sender info included in response

### Frontend
- [ ] Polling hook activated in Navbar
- [ ] NotificationsPage route configured
- [ ] Bell icon integrated in navigationItems
- [ ] Sound file in public folder
- [ ] All navigation routes tested
- [ ] Error handling with toasts
- [ ] Empty states for all tabs

### Monitoring
- [ ] Track polling frequency
- [ ] Monitor API response times
- [ ] Log notification creation events
- [ ] Alert on high error rates

---

## 📝 Future Enhancements

### Phase 2 (Optional)
- WebSocket for real-time updates (remove polling)
- Push notifications (browser API)
- Notification preferences (sound on/off)
- Custom sound selection
- Mark multiple notifications at once
- Notification search/filter by type
- Notification history archive

### Phase 3 (Advanced)
- Email notifications digest
- Slack/Discord integration
- Notification templates system
- A/B testing for notification content
- Analytics dashboard

---

## 🐛 Common Issues & Solutions

### Issue: Badge not updating
**Solution:** Verify polling is activated in Navbar component via `useNotificationPolling()`

### Issue: Navigation not working
**Solution:** Check backend returns `metadata.taskId` in response

### Issue: Mark all as read not working
**Solution:** Verify API endpoint returns success and query invalidation runs

### Issue: Sound not playing
**Solution:** Check audio file exists in `/public` and volume is set

### Issue: Pagination showing wrong count
**Solution:** Backend needs to return total count or calculate client-side from filtered results

---

## 📚 Related Documentation

- [Backend API Documentation](./TASK_BACKEND_INTEGRATION.md)
- [Technical System Overview](./TECHNICAL_DOCUMENTATION.md)
- [Agents Guidelines](./AGENTS.md)

---

**Last Updated:** November 26, 2025
**Version:** 2.0 (Dedicated Page Architecture with Pagination)
