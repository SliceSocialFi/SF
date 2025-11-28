## Tích hợp Frontend với backend (slice-api) — hướng dẫn ngắn (Tiếng Việt)

Tài liệu này tóm tắt mọi thứ frontend dev cần để cấu hình, gọi API và debug auth khi tích hợp với repo `slice-api` (đã deploy tại Vercel: https://slice-api-indol.vercel.app/).

### Mục tiêu
- Cấu hình env và build local
- Gửi JWT hợp lệ trong các request
- Gọi / xử lý các endpoint Task / User / TaskApplications
- Xác thực hành vi bảo mật: server lấy `profileId` từ token (act.sub || sub)
- Debug JWKS/JWT khi gặp lỗi xác thực

---

## 1) Biến môi trường (frontend)
- SLICE_API_URL — (bắt buộc cho frontend) base URL tới backend (vd `https://slice-api-indol.vercel.app`).
  - VITE_ prefix bắt buộc để Vite expose cho client code.

Gợi ý (backend chỉ):
- LENS_API_URL = https://api.testnet.lens.xyz (dùng để discover JWKS theo iss)
- JWT_CLOCK_TOLERANCE = 60
- JWKS_FETCH_TIMEOUT_MS = 80000

Frontend chỉ cần đảm bảo biết `VITE_SLICE_API_URL` (deploy trên Vercel hoặc `.env` local trong `apps/web`).

---

## 2) Cách gửi token từ frontend
- Luôn gửi JWT trong header Authorization:

  Authorization: Bearer <JWT>

- Tùy chọn: backend cũng chấp nhận `X-Access-Token: <JWT>` nếu cần.
- Lưu token an toàn: httpOnly cookie là tốt nhất; nếu dùng localStorage thì hiểu rủi ro XSS.

Lưu ý quan trọng: KHÔNG gửi `employerProfileId` và mong server tin. Server sẽ lấy `profileId` từ token (claim `act.sub` ưu tiên, nếu không thì `sub`).

---

## 3) Endpoints chính (tổng quan)
Base: `${SLICE_API_URL}` (vd `https://slice-api-indol.vercel.app`)

A. POST /tasks (protected)
- Mục đích: tạo task. Server gán `employerProfileId` từ token.
- Header: Authorization: Bearer <JWT>
- Body (JSON):

```
{
  "title": "Tiêu đề nhiệm vụ",
  "objective": "Mục tiêu",
  "deliverables": "Giao nộp",
  "acceptanceCriteria": "Tiêu chí chấp nhận",
  "rewardPoints": 10,
  "deadline": "2025-12-31T23:59:00Z"
}
```

- Trả về: 201 Created + object task (bao gồm employerProfileId do server set)

B. Users
- CRUD theo `profileId` (xem `users.ts` trong backend)

C. TaskApplications (mounted dưới `/applications` hoặc tương đương)
- Tạo application (applicantProfileId lấy từ token hoặc phải được validate)
- Update status (pending/accepted/rejected)

D. Proxy / shim tới Hey API: `/oembed/get`, `/metadata/sts`, `/pageview`, `/posts` — một số route cần auth và được forward tới `REAL_SLICE_API_URL`.

---

## 4) Contract ngắn (inputs/outputs/errors)
- Inputs: Authorization header với JWT (RS256), JSON bodies theo shape
- Success: 2xx (POST tạo trả về 201)
- Errors:
  - 401: missing/invalid token
  - 400: validation error
  - 500: server / DB error

---

## 5) Cách chạy dev & test local (PowerShell)

1) Copy env mẫu (trong `apps/web`):

```powershell
copy .env.example .env
```

2) Cài phụ thuộc và chạy dev frontend:

```powershell
pnpm install
pnpm -F @slice/web dev
```

3) Build production (local bundle):

```powershell
pnpm -F @slice/web build
```

4) Test JWKS / JWT (nếu bạn có token):

Decode token (không verify):

```powershell
node ./scripts/decode-jwt.mjs <your-jwt>
```

Check JWKS availability (từ issuer iss):

```powershell
node ./scripts/check-jwks.mjs https://api.testnet.lens.xyz
```

Hoặc dùng `curl` để kiểm thử protected endpoint (đã deploy):

```powershell
curl -i -X POST "${env:VITE_SLICE_API_URL}/api/v1/tasks" -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" -d '{"title":"test","objective":"ok","deliverables":"x","acceptanceCriteria":"y","rewardPoints":1}'
```

---

## 6) Debugging checklist (khi gặp 401 / lỗi auth)
1. Kiểm header Authorization đã gửi chưa.
2. Dùng `decode-jwt.mjs` kiểm tra `iss`, `kid`, `alg`, `act.sub`/`sub`.
3. Chạy `check-jwks.mjs <iss>` để confirm JWKS reachable và có key tương ứng.
4. Nếu lỗi “Unsupported alg”: JWKS có attribute alg lạ — backend sanitizes nhưng cũng có fallback localJWKSet.
5. Nếu JWKS 404: kiểm tra `iss/.well-known/openid-configuration` để lấy `jwks_uri`.
6. Nếu token expired: tăng `JWT_CLOCK_TOLERANCE` hoặc kiểm tra clock skew.
7. Nếu DB FK failure: đảm bảo user với `profileId` tồn tại.

---

## 7) Snippet tích hợp frontend (ApiClient)
Sử dụng `apps/web/src/lib/apiClient.ts` (mẫu) trong repo, ví dụ:

```ts
import ApiClient from '@/lib/apiClient'

// khởi tạo (nếu cần) ApiClient mặc định dùng import.meta.env.SLICE_API_URL

// tạo task
await ApiClient.createTask({ title: 't', objective: 'o', deliverables: 'd', acceptanceCriteria: 'a', rewardPoints: 5 })
```

ApiClient sẽ tự đính token (từ cookie httpOnly hoặc localStorage nếu bạn cấu hình) vào header `Authorization`.

---

## 8) Edge cases (vài test case đề xuất)
- Missing Authorization → 401
- Token có `act.sub` → task.employerProfileId = `act.sub`
- Token không có `act.sub` nhưng có `sub` → server dùng `sub`
- JWKS tạm thời unreachable → kiểm `JWKS_FETCH_TIMEOUT_MS`/fallback
- `kid` không tìm thấy trong JWKS → jose sẽ fail; kiểm jwks content
- DB FK failure khi user không tồn tại → lỗi 500 hoặc 400

---

## 9) Next steps / improvements nhỏ (khuyến nghị)
- Thêm `LENS_JWKS_URI` env để middleware ưu tiên URL JWKS cố định
- Thêm `/health` endpoint kiểm tra DB & JWKS (smoke test)
- GitHub Action: chạy `check-jwks.mjs` + smoke test sau deploy
- Thêm ví dụ React nhỏ trong `apps/web` dùng `ApiClient`

---

Nếu bạn muốn, tôi có thể: (A) thêm example React component gọi `createTask`, (B) tạo test script smoke-test cURL, hoặc (C) mở rộng `ApiClient` để dùng httpOnly cookie fallback. Chỉ cần chọn 1-2 mục và tôi sẽ làm tiếp.
