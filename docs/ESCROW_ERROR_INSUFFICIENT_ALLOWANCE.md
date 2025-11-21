# Escrow Deposit Error: InsufficientAllowance (0xfb8f41b2)

## Problem

When trying to deposit to escrow, you get error:
```
execution reverted (unknown custom error)
data: "0xfb8f41b2..."
```

## Root Cause

Error selector `0xfb8f41b2` = `InsufficientAllowance(address spender, uint256 currentAllowance, uint256 required)`

This happens when:
- Token allowance is less than deposit amount
- Previous approval didn't complete
- Token requires reset to 0 before increasing allowance

## Diagnostic Output

```
✓ Token balance: 50.0
✓ Token allowance: 5.0      ← Too low!
✗ Gas estimation failed      ← Deposit amount > allowance
```

## Solution Implemented

### 1. Enhanced Approval Logic (`useEscrow.ts`)

```typescript
// Check current allowance
const currentAllowance = await token.allowance(owner, spender);

if (currentAllowance < amountWei) {
  // Reset to 0 first (required by some ERC20 tokens)
  if (currentAllowance > 0n) {
    const resetTx = await token.approve(spender, 0n);
    await resetTx.wait();
  }
  
  // Approve required amount
  const approveTx = await token.approve(spender, amountWei);
  await approveTx.wait();
  
  // Verify approval succeeded
  const newAllowance = await token.allowance(owner, spender);
  if (newAllowance < amountWei) {
    throw new Error("Approval failed");
  }
}
```

### 2. Better Error Messages

```typescript
if (error?.data?.includes("0xfb8f41b2")) {
  message = "Insufficient token allowance. Please try again.";
}
```

### 3. Diagnostic Decoder

Diagnostic tool now decodes `0xfb8f41b2` and shows:
- Current allowance
- Required amount
- Suggested fix

## How to Fix Your Issue

### Option A: Increase Allowance Manually (MetaMask)

1. Call token.approve(escrowContract, largeAmount)
2. Wait for tx to confirm
3. Try deposit again

### Option B: Reset & Approve (Recommended)

1. Call token.approve(escrowContract, 0)
2. Wait for tx to confirm
3. Call token.approve(escrowContract, requiredAmount)
4. Wait for tx to confirm
5. Try deposit again

### Option C: Use Updated Code (Best)

The updated `useEscrow` hook now handles this automatically:
1. Checks allowance
2. Resets to 0 if needed
3. Approves correct amount
4. Verifies approval
5. Proceeds with deposit

## Testing

Run diagnostic to verify:
```typescript
import { runEscrowDiagnostic } from "@/lib/escrowDiagnostic";

await runEscrowDiagnostic(signer, {
  freelancerAddress: "0x...",
  amount: "100",
  externalTaskId: "uuid"
});
```

Expected output after fix:
```
✓ Token balance: 50.0
✓ Token allowance: 100.0    ← Should be >= deposit amount
✓ Gas estimate: success
```

## Common ERC20 Token Quirks

Some tokens (like USDT) require:
- Reset allowance to 0 before increasing
- This prevents front-running attacks
- Our code now handles this automatically

## Prevention

- Always approve sufficient allowance before deposit
- Use `ethers.MaxUint256` for unlimited approval (not recommended for production)
- Check allowance before every deposit
- Wait for approve tx to confirm before calling deposit

## Related Files

- `apps/web/src/hooks/useEscrow.ts` - Deposit logic with auto-approve
- `apps/web/src/lib/escrowDiagnostic.ts` - Error decoder
- `apps/web/src/lib/abis.ts` - Contract ABIs

## Next Steps

1. Try deposit again with updated code
2. Monitor console for detailed logs
3. Verify allowance after approval
4. Check transaction on block explorer if still failing
