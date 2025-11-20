# Migration từ Ethers.js sang Wagmi + Viem

## ✅ Đã hoàn thành

### 1. Cài đặt dependencies
- ✅ `viem` và `wagmi` đã có trong `package.json`
- ✅ `@tanstack/react-query` đã có (required by wagmi)

### 2. Tạo Wagmi configuration
- ✅ `apps/web/src/lib/wagmi.ts` - Định nghĩa chain và connectors
- ✅ `apps/web/src/lib/Web3Provider.tsx` - Wrapper component

### 3. Refactor hooks
- ✅ `useWallet.ts` - Chuyển từ ethers sang wagmi hooks
- ✅ `useEscrow.ts` - Chuyển từ ethers.Contract sang viem contract interactions

### 4. Refactor components
- ✅ `EscrowDeposit.tsx` - Thay thế `ethers.parseUnits`, `ethers.isAddress` bằng viem

## 🔧 Cần làm tiếp

### Bước 1: Wrap App với Web3Provider

Mở file `apps/web/src/main.tsx` hoặc root component và wrap với `Web3Provider`:

```tsx
import { Web3Provider } from "@/lib/Web3Provider";

// ...existing code...

root.render(
  <StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </StrictMode>
);
```

### Bước 2: Test lại tất cả flows

1. **Kết nối ví:**
   ```tsx
   const { connect, isConnected, address } = useWallet();
   ```
   
2. **Deposit escrow:**
   - Wagmi sẽ tự động decode custom errors
   - Không cần `escrowDiagnostic.ts` nữa vì viem decode error rất tốt
   
3. **Check logs:**
   ```
   Console sẽ hiển thị error rõ ràng như:
   "InsufficientAllowance: Current allowance 10.0, required 250.0"
   ```

### Bước 3: Xóa code cũ (optional)

Sau khi test OK, có thể xóa:
- `apps/web/src/lib/escrowDiagnostic.ts` - Không cần nữa
- Import `ethers` trong các component khác (nếu có)

## 🎯 Lợi ích của Wagmi + Viem

### 1. Error Decoding tốt hơn
**Trước (ethers):**
```
Error: execution reverted (unknown custom error)
data: 0xfb8f41b2000000...
```

**Sau (viem):**
```typescript
ContractFunctionExecutionError: InsufficientAllowance
Details: Current allowance: 10.0 tokens, Required: 250.0 tokens
```

### 2. Không cần manual error parsing
```typescript
// Ethers - phải tự decode
if (error?.data?.includes("0xfb8f41b2")) {
  // Manual parsing...
}

// Viem - tự động decode
catch (error: any) {
  // error.shortMessage đã có thông tin rõ ràng
  toast.error(error.shortMessage);
}
```

### 3. TypeScript support tốt hơn
```typescript
// Viem có type-safe contract calls
const balance = await publicClient.readContract({
  address: TOKEN_ADDRESS,
  abi: TOKEN_ABI,
  functionName: "balanceOf", // ← autocomplete!
  args: [address] // ← type-checked!
}) as bigint; // ← explicit return type
```

### 4. Hook-based architecture
```typescript
// Wagmi hooks tự động handle:
// - Connection state
// - Network switching
// - Account changes
// - Transaction confirmations
const { address, isConnected } = useAccount();
const { writeContract } = useWriteContract();
```

## 🐛 Troubleshooting

### Lỗi: "Provider not found"
→ Chưa wrap với `Web3Provider`. Xem Bước 1 ở trên.

### Lỗi: "Chain not configured"
→ Check `apps/web/src/lib/wagmi.ts`, đảm bảo `CHAIN.id` đúng (37111 cho Lens testnet)

### Wallet không connect
→ Check console, wagmi sẽ log chi tiết lỗi. Thường là MetaMask chưa cài hoặc user reject.

### Transaction fail ngay lập tức
→ Viem sẽ simulate transaction trước khi gửi. Nếu fail, error message sẽ rất chi tiết:
```
ContractFunctionRevertedError: InsufficientBalance
Sender: 0x123...
Balance: 5.0 tokens
Required: 10.0 tokens
```

## 📊 So sánh code

### Approve token

**Trước (ethers):**
```typescript
const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
const tx = await token.approve(SPENDER, amount);
await tx.wait();
```

**Sau (viem + wagmi):**
```typescript
const hash = await walletClient.writeContract({
  address: TOKEN_ADDRESS,
  abi: TOKEN_ABI,
  functionName: "approve",
  args: [SPENDER, amount]
});
await publicClient.waitForTransactionReceipt({ hash });
```

### Read contract

**Trước (ethers):**
```typescript
const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, provider);
const balance = await token.balanceOf(address);
```

**Sau (viem):**
```typescript
const balance = await publicClient.readContract({
  address: TOKEN_ADDRESS,
  abi: TOKEN_ABI,
  functionName: "balanceOf",
  args: [address]
}) as bigint;
```

## 🚀 Next Steps

1. Wrap app với `Web3Provider`
2. Test deposit flow
3. Xem error messages trong console - sẽ rất rõ ràng!
4. Nếu OK, xóa `escrowDiagnostic.ts` và các ethers imports khác

## 📝 Notes

- Viem không có `ZeroAddress` constant → Dùng `"0x0000000000000000000000000000000000000000"` hoặc tạo constant riêng
- `isAddress()` function tên giống nhau nhưng import từ `viem`
- `parseUnits()` và `formatUnits()` tên giống nhau, import từ `viem`
- Wagmi tự động handle reconnect, network changes, account changes
