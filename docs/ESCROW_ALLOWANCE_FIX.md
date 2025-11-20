# Escrow Allowance Error - Phân tích và Giải pháp

## ❌ Vấn đề

Khi deposit escrow, gặp lỗi:
```
InsufficientAllowance(address spender, uint256 currentAllowance, uint256 required)
```

### Log chi tiết:
- ✓ Token allowance check: **10.0 tokens** 
- ✗ Contract báo lỗi: allowance = **0 tokens**, required = **2.0 tokens**

## 🔍 Nguyên nhân

Có **race condition** giữa việc check allowance và thực hiện deposit:

1. User đã approve 10 tokens trước đó (có thể qua MetaMask UI)
2. Khi click Deposit:
   - Code check allowance → thấy 10.0 ✅
   - Code thấy 10.0 > 2.0 nên **skip approve step**
   - Nhưng **giữa lúc check và deposit**, có transaction khác reset allowance về 0
   - Khi gọi `escrow.deposit()`, allowance đã = 0 → lỗi!

### Hoặc:

1. Code tự động reset allowance về 0 (vì ERC20 requirement)
2. Code approve lại 2.0 tokens
3. **Transaction approve chưa được mine kịp**
4. Code gọi `escrow.deposit()` ngay lập tức → allowance vẫn = 0 → lỗi!

## ✅ Giải pháp đã implement

### 1. Thêm block confirmation
```typescript
// Wait for approve tx to be mined with at least 1 block confirmation
const approveReceipt = await approveTx.wait(1);
```

### 2. Thêm delay để state settle
```typescript
await new Promise(resolve => setTimeout(resolve, 1000));
```

### 3. Retry mechanism để verify allowance
```typescript
// Retry up to 3 times, wait 2s between attempts
for (let i = 0; i < 3; i++) {
  newAllowance = await token.allowance(owner, spender);
  if (newAllowance >= required) break;
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

### 4. Improved error logging
```typescript
// Decode error data to see what contract actually sees
const allowanceFromContract = BigInt("0x" + errorData.slice(64, 128));
console.log("Contract sees allowance:", ethers.formatUnits(allowanceFromContract, 18));
```

## 🧪 Testing

Sau khi refresh page, thử lại flow:

1. Click "Deposit Escrow"
2. Xem console log:
   ```
   Current allowance: 10.0
   Required amount: 2.0
   Allowance sufficient, skipping approve
   Depositing to escrow...
   ```
   
   HOẶC nếu allowance < required:
   ```
   Insufficient allowance, approving token...
   Resetting allowance to 0 first...
   Approve tx confirmed in block: 12345
   Allowance check attempt 1: 2.0
   ✓ Approval verified successfully
   Depositing to escrow...
   ```

3. Nếu vẫn lỗi, check log mới:
   ```
   CONTRACT ERROR DATA:
     Spender: 0xB957...
     Current allowance: 0.0 tokens
     Required: 2.0 tokens
   ```

## 🛠️ Manual workaround (nếu vẫn lỗi)

### Option 1: Reset allowance manually
```typescript
// Open browser console
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const token = new ethers.Contract(
  "0x7326D8584c6b891B2f4B194CDF5ba746dD0D4080",
  ["function approve(address spender, uint256 amount) returns (bool)"],
  signer
);

// Reset to 0
await token.approve("0xB957dd37bA6Da7bc10dE5b413B1F4ac3E3452d44", 0);

// Wait 5s
await new Promise(r => setTimeout(r, 5000));

// Approve required amount
await token.approve("0xB957dd37bA6Da7bc10dE5b413B1F4ac3E3452d44", ethers.parseUnits("2", 18));
```

### Option 2: Approve unlimited (NOT recommended)
```typescript
// Approve max uint256
await token.approve(
  "0xB957dd37bA6Da7bc10dE5b413B1F4ac3E3452d44", 
  ethers.MaxUint256
);
```

## 📊 Diagnostic tool improvement

Run diagnostic lại để thấy thông tin chi tiết hơn:
```
Checking allowance: owner= 0x8364... spender= 0xB957...
✓ Token allowance: 10.0

CONTRACT ERROR DATA:
  Spender: 0xB957dd37bA6Da7bc10dE5b413B1F4ac3E3452d44
  Current allowance: 0.0 tokens  ← Contract's view
  Required: 2.0 tokens
```

Điều này cho thấy **contract thấy allowance khác với frontend check**.

## 🎯 Next steps

1. ✅ Refresh page và test lại deposit
2. ✅ Check console log để xác nhận retry mechanism hoạt động
3. ✅ Nếu vẫn lỗi, sử dụng manual workaround
4. ⏳ Xem xét tăng số block confirmations từ 1 lên 2-3
5. ⏳ Xem xét thêm option "Force Approve" button trong UI

## 🔗 Related files

- `apps/web/src/hooks/useEscrow.ts` - Approve logic với retry
- `apps/web/src/lib/escrowDiagnostic.ts` - Improved error decoding
- `apps/web/src/components/Escrow/EscrowDeposit.tsx` - UI component
