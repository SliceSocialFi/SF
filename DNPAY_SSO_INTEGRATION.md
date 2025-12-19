# DNPAY SSO Integration

## Tổng quan

DNPAY SSO đã được tích hợp vào ứng dụng Slice, cho phép người dùng đăng nhập thông qua DNPAY bên cạnh việc kết nối ví.

## Các tính năng

- **Popup Login Window**: Tương tự như Google OAuth, mở cửa sổ popup để đăng nhập DNPAY
- **CSRF Protection**: Sử dụng state parameter để bảo vệ khỏi CSRF attacks
- **Message Passing**: Sử dụng `postMessage` API để giao tiếp giữa popup và parent window
- **Automatic Cleanup**: Tự động đóng popup và cleanup resources sau khi hoàn thành

## Cấu trúc

### 1. Environment Variables (.env)

```env
DNPAY_CLIENT_ID="dnpay_1e3370f3dcdd40cb"
DNPAY_REDIRECT_URI="https://dev-slice-dnpay-miniapp.vercel.app"
```

### 2. Constants (packages/data/constants.ts)

- `DNPAY_CLIENT_ID`: Client ID từ DNPAY (`dnpay_1e3370f3dcdd40cb`)
- `DNPAY_REDIRECT_URI`: Redirect URI đã đăng ký với DNPAY
- `DNPAY_AUTH_URL`: URL OAuth authorize của DNPAY (`https://mvp-api-dev.depay.ai/oauth2/login`)

### 3. Hook: `useDNPaySSO` (apps/web/src/hooks/useDNPaySSO.ts)

Custom hook xử lý toàn bộ flow OAuth:

- Mở popup window với DNPAY auth URL
- Lắng nghe message từ callback page
- Xử lý success/error callbacks
- Tự động cleanup resources

### 4. Component: `DNPayLoginButton` (apps/web/src/components/Shared/Auth/DNPayLoginButton.tsx)

Button component để trigger DNPAY login:

```tsx
<DNPayLoginButton
  onSuccess={(code) => {
    // Handle authorization code
  }}
/>
```

### 5. Callback Page: `DNPayCallback` (apps/web/src/components/Auth/DNPayCallback.tsx)

- Route: `/auth/dnpay/callback`
- Nhận authorization code từ DNPAY
- Gửi code về parent window thông qua `postMessage`
- Tự động đóng popup sau khi hoàn thành

### 6. UI Integration (apps/web/src/components/Shared/Auth/WalletSelector.tsx)

DNPAY login button được thêm vào đầu WalletSelector:

- Hiển thị trước các wallet options
- Có divider "Or continue with wallet" để phân tách

## Flow hoạt động

```
1. User clicks "Continue with DNPay"
   ↓
2. Popup window opens với DNPAY auth URL
   ↓
3. User logs in tại DNPAY
   ↓
4. DNPAY redirects về /auth/dnpay/callback với authorization code
   ↓
5. Callback page gửi code về parent window qua postMessage
   ↓
6. useDNPaySSO hook nhận code và trigger onSuccess callback
   ↓
7. Popup tự động đóng
   ↓
8. App xử lý authorization code (exchange for access token)
```

## TODO: Backend Integration

Hiện tại, authorization code được log ra console. Cần implement:

1. **Token Exchange Endpoint**:
   - Tạo API endpoint để exchange authorization code lấy access token
   - Endpoint: `POST /api/auth/dnpay/token`
   - Body: `{ code, redirect_uri }`
2. **User Authentication**:

   - Sau khi có access token, fetch user info từ DNPAY
   - Tạo hoặc link với Lens account
   - Issue JWT token cho user

3. **Session Management**:
   - Lưu DNPAY access token
   - Refresh token khi hết hạn
   - Logout flow

## Cấu hình DNPAY

### URL OAuth2

- Auth URL: `https://mvp-api-dev.depay.ai/oauth2/login`
- Parameters: `client_id`, `redirect_uri`

### Redirect URIs

Đảm bảo đã đăng ký redirect URI với DNPAY:

- Development: `http://localhost:4783/auth/dnpay/callback`
- Production: `https://yourdomain.com/auth/dnpay/callback`

## Testing

1. Chạy development server:

   ```bash
   pnpm dev
   ```

   Mở Developer Console (F12) để xem logs

2. Kiểm tra:
   - Console log: "Opening DNPAY auth URL: ..."
   - Popup window mở đúng cách
   - Console trong popup: "DNPay Callback - All params: ..."
   - Console log: "Sending message to opener window"
   - Console trong parent: "Received message from popup: ..."
   - Console log: "=== DNPAY LOGIN SUCCESS ==="
   - Authorization code/token được log ra console
   - Popup tự động đóng sau 1 giây
3. Kiểm tra:
   - Popup window mở đúng cách
   - Redirect về callback page
   - Authorization code được log ra console
   - Popup tự động đóng

## Troubleshooting

### Popup bị block

- Kiểm tra popup blocker settings
- Đảm bảo user action trigger popup (không phải tự động)

### Message không nhận được

- Kiểm tra origin matching trong `handleMessage`
- Verify `window.opener` tồn tại trong callback page

### State mismatch error

- Clear sessionStorage
- Refresh page và thử lại

## Security Notes

- Luôn verify state parameter để tránh CSRF
- Chỉ chấp nhận messages từ cùng origin
- Authorization code chỉ sử dụng 1 lần
- Không lưu sensitive data trong localStorage
