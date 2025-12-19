# DNPAY SSO - Quick Debug Guide

## Vấn đề: Popup mở rồi tắt ngay

### Nguyên nhân có thể:

1. **Redirect URI chưa được whitelist ở DNPAY**

   - Liên hệ team DNPAY để thêm redirect URI vào whitelist
   - Development: `http://localhost:4783/auth/dnpay/callback`
   - Production: `https://yourdomain.com/auth/dnpay/callback`

2. **DNPAY không cho phép hiển thị trong iframe/popup**

   - Một số OAuth provider block việc hiển thị trong popup do CSP headers

3. **CORS issues**
   - DNPAY server có thể block requests từ origin của bạn

## Cách debug (Updated):

### Bước 1: Mở Console trước khi test

```
F12 -> Console tab
```

### Bước 2: Click "Continue with DNPay"

Bạn sẽ thấy logs:

```
DNPay login button clicked
Opening DNPAY auth URL: https://mvp-api-dev.depay.ai/oauth2/login?client_id=...&redirect_uri=...
```

### Bước 3: Popup window giờ sẽ KHÔNG tự động đóng

Callback page giờ sẽ hiển thị:

- ✓ **Nếu thành công**: Hiển thị parameters nhận được từ DNPAY
- ⚠ **Nếu thất bại**: Hiển thị lý do và debug info

### Bước 4: Kiểm tra trong popup window

**Nếu thấy màn hình xanh lá (success)**:

- Parameters đã được gửi về parent window
- Check console của parent window xem có nhận được không
- Click "Close Window" để đóng

**Nếu thấy màn hình vàng (warning)**:

- Không có parameters nào được return
- Check "Current URL" để xem URL hiện tại
- Có thể redirect_uri chưa đúng hoặc chưa được whitelist

**Nếu thấy lỗi CORS hoặc 403/404**:

- Check Network tab (F12)
- Có thể DNPAY block origin của bạn

## Test redirect URI với browser thủ công:

Mở URL này trực tiếp trong browser:

```
https://mvp-api-dev.depay.ai/oauth2/login?client_id=dnpay_1e3370f3dcdd40cb&redirect_uri=http://localhost:4783/auth/dnpay/callback
```

**Nếu thấy login form của DNPAY** -> OK, endpoint hoạt động
**Nếu thấy error về redirect_uri** -> Cần whitelist
**Nếu thấy 404 Not Found** -> URL endpoint sai

## Whitelist Redirect URI với DNPAY:

Liên hệ DNPAY team để thêm các URIs sau:

### Development:

```
http://localhost:4783/auth/dnpay/callback
http://127.0.0.1:4783/auth/dnpay/callback
```

### Staging/Production:

```
https://dev-slice-dnpay-miniapp.vercel.app/auth/dnpay/callback
https://yourdomain.com/auth/dnpay/callback
```

## Expected Flow:

```
1. User clicks "Continue with DNPay"
   ↓
2. Popup opens with DNPAY login page
   ↓
3. User enters credentials and logs in
   ↓
4. DNPAY redirects to: http://localhost:4783/auth/dnpay/callback?code=xxx
   ↓
5. Callback page shows success message with parameters
   ↓
6. Parameters sent to parent window via postMessage
   ↓
7. User clicks "Close Window" or it closes automatically
   ↓
8. Parent window receives data and processes it
```

## Next Steps after fixing popup:

1. **Exchange authorization code for access token**

   - Create backend endpoint: `POST /api/auth/dnpay/token`
   - Call DNPAY token endpoint
   - Return access token to frontend

2. **Get user info from DNPAY**

   - Call DNPAY user info endpoint with access token
   - Create or link Lens account

3. **Issue JWT token**
   - Generate app's JWT token
   - Store in auth store
   - Redirect to home
