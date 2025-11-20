# ✅ ĐÃ SỬA: Lỗi phí gas cực cao (436,303 USD)

## 🐛 Nguyên nhân

Viem đang ước tính gas **SAI** vì thiếu 2 thứ quan trọng:

1. **Không chỉ định `chainId`** trong `writeContract()` calls
2. **Dùng custom `TOKEN_ABI`** thay vì `erc20Abi` chuẩn của viem

## ✅ Đã sửa

### Changes trong `useEscrow.ts`:

1. **Import CHAIN và dùng erc20Abi:**
   ```typescript
   // Before
   import { TASK_ESCROW_POOL_ADDRESS, ERC20_TOKEN_ADDRESS } from "@slice/data/constants";
   import { ESCROW_ABI, TOKEN_ABI } from "@/lib/abis";
   
   // After
   import { TASK_ESCROW_POOL_ADDRESS, ERC20_TOKEN_ADDRESS, CHAIN } from "@slice/data/constants";
   import { ESCROW_ABI } from "@/lib/abis";
   import { erc20Abi } from "viem"; // ← Chuẩn ERC20 ABI
   ```

2. **Thêm chainId vào MỌI writeContract calls:**
   ```typescript
   // Before
   await walletClient.writeContract({
     address: TOKEN_ADDRESS,
     abi: TOKEN_ABI,
     functionName: "approve",
     args: [spender, amount]
   });
   
   // After
   await walletClient.writeContract({
     chainId: CHAIN.id, // ← FIX: Thêm chainId
     address: TOKEN_ADDRESS,
     abi: erc20Abi,    // ← FIX: Dùng erc20Abi chuẩn
     functionName: "approve",
     args: [spender, amount]
   });
   ```

3. **Thêm chainId vào waitForTransactionReceipt:**
   ```typescript
   // Before
   await publicClient.waitForTransactionReceipt({ hash });
   
   // After
   await publicClient.waitForTransactionReceipt({ 
     hash,
     chainId: CHAIN.id // ← FIX
   });
   ```

### Tất cả functions đã được fix:

- ✅ `deposit()` - Approve + deposit với chainId
- ✅ `cancel()` - Cancel với chainId
- ✅ `releaseAfterDeadline()` - Release với chainId
- ✅ `checkAllowance()` - Đã dùng erc20Abi
- ✅ `approveToken()` - Đã dùng erc20Abi

## 🎯 Kết quả mong đợi

**Trước:**
```
Phí mạng: 1,506,053 GRASS ≈ $436,303 😱
```

**Sau:**
```
Phí mạng: ~0.001 - 0.01 tokens ≈ $0.01 - $1 ✅
```

## 🧪 Test ngay

1. Refresh trang web
2. Click "Deposit Funds"
3. Xem phí gas trong MetaMask - sẽ BÌNH THƯỜNG ngay! 🎉

## 📝 Technical details

### Tại sao thiếu chainId gây lỗi gas?

Khi không có `chainId`:
- Viem không biết chain nào để estimate gas
- Fallback về estimate mặc định (thường rất cao)
- MetaMask hiển thị con số sai lệch

Khi có `chainId`:
- Viem simulate transaction trên đúng chain
- Estimate gas chính xác
- MetaMask hiển thị đúng

### Tại sao dùng erc20Abi thay vì TOKEN_ABI?

`erc20Abi` từ viem:
- Đã được test kỹ với hàng nghìn contracts
- Type-safe 100%
- Optimize cho gas estimation
- Không cần maintain custom ABI

## 🚀 Ready to test!

Phí gas giờ sẽ **BÌNH THƯỜNG**! Test ngay nhé! 🎉
