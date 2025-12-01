# Hệ Thống Thông Báo Frontend

## Tổng Quan

Hệ thống thông báo sử dụng chiến lược **Lightweight Polling** để tối ưu hiệu suất:
- **Polling nhẹ**: Chỉ lấy số lượng thông báo chưa đọc mỗi 10 giây
- **Fetch on Demand**: Chỉ tải danh sách thông báo khi người dùng mở dropdown
- **Optimistic Updates**: Cập nhật UI ngay lập tức trước khi API phản hồi

## Tech Stack

- **React Query (TanStack Query)**: Quản lý data fetching và caching
- **Zustand**: State management cho notification state
- **TailwindCSS**: Styling
- **Heroicons**: Icons

## Kiến Trúc

### 1. API Client (`src/lib/apiClient.ts`)

Methods mới được thêm vào:

```typescript
// Lấy số lượng thông báo chưa đọc
getUnreadCount(): Promise<{ count: number }>

// Lấy danh sách thông báo với pagination
getNotifications(params?: { limit?: number; offset?: number }): Promise<any[]>

// Đánh dấu thông báo đã đọc
markNotificationAsRead(id: string): Promise<void>
```

### 2. Store (`src/store/non-persisted/useNotificationStore.ts`)

**State:**
- `unreadCount`: Số lượng thông báo chưa đọc
- `isDropdownOpen`: Trạng thái dropdown (đóng/mở)
- `notifications`: Danh sách thông báo
- `loading`: Trạng thái loading

**Actions:**
- `setUnreadCount(count)`: Cập nhật số lượng từ API
- `decrementCount()`: Giảm 1 đơn vị ngay lập tức (Optimistic Update)
- `toggleDropdown()`: Đóng/mở dropdown
- `markAsRead(id)`: Đánh dấu thông báo đã đọc trong store
- `markAllAsRead()`: Đánh dấu tất cả đã đọc
- `removeNotification(id)`: Xóa thông báo khỏi danh sách

### 3. Polling Hook (`src/hooks/useNotificationPolling.ts`)

Custom hook sử dụng React Query để:
- Poll số lượng thông báo chưa đọc mỗi 10 giây
- Tự động refetch khi user quay lại tab
- Đồng bộ data vào Zustand store
- Chỉ hoạt động khi user đã đăng nhập

**Cấu hình:**
```typescript
{
  queryKey: ["notifications", "count"],
  refetchInterval: 10000,      // Poll mỗi 10 giây
  refetchOnWindowFocus: true,  // Refetch khi focus tab
  staleTime: 0,                // Luôn coi data là stale
  enabled: !!currentAccount    // Chỉ chạy khi đã login
}
```

### 4. UI Components

#### NotificationBell (`src/components/Notification/NotificationBell.tsx`)

Component hiển thị icon chuông với badge số lượng:
- Kích hoạt polling thông qua `useNotificationPolling()`
- Hiển thị badge đỏ khi có thông báo chưa đọc
- Mở Modal khi click
- Gọi `toggleDropdown()` để trigger fetch danh sách

#### NotificationList (`src/components/Notification/NotificationList.tsx`)

Component hiển thị danh sách thông báo:
- **Fetch on Demand**: Chỉ fetch khi `isDropdownOpen === true`
- **Optimistic Update**: Giảm số ngay khi user click "Mark as read"
- **Navigation**: Tự động điều hướng đến task/application liên quan khi click
- **Filter**: Cho phép lọc "All" hoặc "Unread"

**Xử lý Click Item:**
1. Mark as read (nếu chưa đọc) với optimistic update
2. Gọi `decrementCount()` để giảm badge ngay lập tức
3. Parse notification để lấy taskId
4. Navigate đến trang chi tiết task

## Cách Sử Dụng

### 1. Thêm NotificationBell vào Layout

```tsx
import NotificationBell from "@/components/Notification/NotificationBell";

function Header() {
  return (
    <header>
      <NotificationBell />
    </header>
  );
}
```

### 2. Sử dụng Store trong Component khác

```tsx
import { useNotificationStore } from "@/store/non-persisted/useNotificationStore";

function MyComponent() {
  const { unreadCount } = useNotificationStore();
  
  return <div>You have {unreadCount} unread notifications</div>;
}
```

## API Endpoints

Backend cần implement các endpoints sau:

### GET `/notifications/unread-count`
```json
{
  "count": 5
}
```

### GET `/notifications?limit=50&offset=0`
```json
[
  {
    "id": "notif-123",
    "recipientProfileId": "user-123",
    "title": "New Task Application",
    "message": "Someone applied for your task: Build a React App",
    "type": "application_received",
    "isRead": false,
    "createdAt": "2025-11-25T10:30:00Z"
  }
]
```

### PATCH `/notifications/:id/read`
```json
{
  "success": true
}
```

## Optimizations

1. **Polling Strategy**:
   - Chỉ poll số lượng (lightweight) mỗi 10s
   - Không poll khi tab không focus
   - Dừng polling khi user logout

2. **Data Fetching**:
   - Fetch danh sách CHỈ KHI cần (dropdown mở)
   - Cache data trong 30s
   - Pagination support (limit/offset)

3. **UX Improvements**:
   - Optimistic updates cho instant feedback
   - Badge animation khi có thông báo mới
   - Auto-navigation sau khi click
   - Relative time display

## Troubleshooting

### Polling không hoạt động
- Kiểm tra `currentAccount` đã được set chưa
- Kiểm tra API endpoint `/notifications/unread-count` hoạt động đúng
- Xem console logs cho errors

### Badge không cập nhật
- Kiểm tra `setUnreadCount` được gọi trong `useNotificationPolling`
- Verify store state bằng React DevTools

### Navigation không hoạt động
- Kiểm tra routing setup
- Verify taskId được parse đúng từ notification message
- Kiểm tra notification.type có đúng enum values

## Future Enhancements

- [ ] WebSocket/SSE cho real-time updates
- [ ] Push notifications (Browser API)
- [ ] Notification grouping
- [ ] Mark as read on scroll
- [ ] Infinite scroll cho danh sách dài
- [ ] Sound/vibration alerts
