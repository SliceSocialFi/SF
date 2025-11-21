# Frontend — Contract Bridge (TaskEscrow Integration)

Comprehensive guide for frontend developers to interact with `TaskEscrowPool` smart contract.

## Quick Summary

- **Contract**: `TaskEscrowPool` (ERC20 token escrow)
- **Token**: ERC20 (tRYF on testnet, RYF on mainnet)
- **Key Functions**:
  - `deposit(uint256 amount, address freelancer, uint256 deadline, string externalTaskId)` — employer deposits funds
  - `cancel(uint256 taskId, string reason)` — employer/admin cancels **before deadline** → refund
  - `releaseAfterDeadline(uint256 taskId, address to, string reason)` — anyone releases **after deadline** (permissionless)
- **Events**: `Deposited`, `Released`, `Cancelled` — listen for real-time UI updates
- **Mapping**: Contract stores `externalTaskId` (string) ↔ on-chain `taskId` (uint256)

## Contract Addresses

- **Testnet**: `0xB957dd37bA6Da7bc10dE5b413B1F4ac3E3452d44`
- **Mainnet**: TBD (update `packages/data/contracts.ts`)
- **Token (Testnet)**: `0x50B4B400AbEcb21d8DCCEB74bd7E0d4C9b3F028d` (tRYF)

See `packages/data/contracts.ts` for latest addresses.

## Data Structure

### On-chain (Solidity struct)
```solidity
struct EscrowInfo {
  address employer;
  address freelancer;
  uint256 amount;
  uint256 deadline; // Unix timestamp
  bool settled;
  string externalTaskId;
}
```

### Backend DB (`escrow_tasks`)
```typescript
{
  taskId: number;           // On-chain ID
  externalTaskId: string;   // Backend task reference
  employer: string;         // Address
  freelancer: string;       // Address
  amount: string;           // Token amount (wei)
  deadline: number;         // Unix timestamp
  settled: boolean;
  depositedTx: string;      // Transaction hash
  releasedTx?: string;
  releaseTo?: string;
  releaseReason?: string;
  depositedAt: string;      // ISO timestamp
  releasedAt?: string;
}
```

## UX Flows

### 1. Connect Wallet (MetaMask)

```typescript
import { ethers } from 'ethers';

async function connectWallet() {
  if (!window.ethereum) throw new Error('Please install MetaMask');
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}
```

### 2. Deposit Flow (Employer)

**Steps**: Approve token → Deposit funds → Backend syncs event

```typescript
import { ethers } from 'ethers';
import { TASK_ESCROW_POOL_ADDRESS, ERC20_TOKEN_ADDRESS } from '@/constants';
import { ESCROW_ABI, TOKEN_ABI } from '@/lib/abis';

async function depositEscrow({
  signer,
  freelancerAddress,
  amountWei,
  deadlineUnix,
  externalTaskId
}: {
  signer: ethers.Signer;
  freelancerAddress: string;
  amountWei: bigint;
  deadlineUnix: number;
  externalTaskId: string;
}) {
  // Step 1: Approve token
  const token = new ethers.Contract(ERC20_TOKEN_ADDRESS, TOKEN_ABI, signer);
  const approveTx = await token.approve(TASK_ESCROW_POOL_ADDRESS, amountWei);
  await approveTx.wait();

  // Step 2: Deposit
  const escrow = new ethers.Contract(TASK_ESCROW_POOL_ADDRESS, ESCROW_ABI, signer);
  const depositTx = await escrow.deposit(
    amountWei,
    freelancerAddress,
    deadlineUnix,
    externalTaskId
  );
  const receipt = await depositTx.wait();

  // Step 3: Extract taskId from event
  const depositedEvent = receipt.logs
    .map((log: any) => {
      try {
        return escrow.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: any) => parsed?.name === 'Deposited');

  const taskId = depositedEvent?.args?.taskId;
  return { txHash: receipt.hash, taskId: taskId?.toString() };
}
```

**Notes**:
- `amountWei` = `ethers.parseUnits(amount, decimals)` (usually 18 for ERC20)
- `deadlineUnix` = Math.floor(Date.now() / 1000) + days * 86400
- Backend listens to `Deposited` event and inserts into `escrow_tasks`

### 3. Cancel Escrow (Employer, before deadline)

```typescript
async function cancelEscrow(
  taskId: string,
  signer: ethers.Signer,
  reason = 'Cancelled by employer'
) {
  const escrow = new ethers.Contract(TASK_ESCROW_POOL_ADDRESS, ESCROW_ABI, signer);
  const tx = await escrow.cancel(BigInt(taskId), reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}
```

**Requirements**:
- Must be called by `employer` (on-chain check)
- Must be **before** `deadline`
- Refunds tokens to employer automatically

### 4. Release After Deadline (Anyone)

```typescript
async function releaseAfterDeadline(
  taskId: string,
  toAddress: string,
  signer: ethers.Signer,
  reason = 'Release after deadline'
) {
  const escrow = new ethers.Contract(TASK_ESCROW_POOL_ADDRESS, ESCROW_ABI, signer);
  const tx = await escrow.releaseAfterDeadline(BigInt(taskId), toAddress, reason);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}
```

**Requirements**:
- Must be **after** `deadline`
- Anyone can call (permissionless)
- Releases tokens to specified address (usually freelancer)

### 5. Read Escrow Info (On-chain)

```typescript
async function readEscrow(taskId: string, provider: ethers.Provider) {
  const escrow = new ethers.Contract(TASK_ESCROW_POOL_ADDRESS, ESCROW_ABI, provider);
  const info = await escrow.escrows(BigInt(taskId));
  return {
    employer: info[0],
    freelancer: info[1],
    amount: info[2].toString(),
    deadline: Number(info[3]),
    settled: Boolean(info[4]),
    externalTaskId: info[5]
  };
}
```

**Recommended**: Use backend `GET /escrow/task/:taskId` for enriched data (timestamps, tx hashes).

### 6. Listen to Events (Optional Real-time UI)

```typescript
const escrow = new ethers.Contract(TASK_ESCROW_POOL_ADDRESS, ESCROW_ABI, provider);

escrow.on('Deposited', (taskId, externalId, employer, amount) => {
  console.log('Deposited:', taskId.toString(), externalId, employer, amount.toString());
  // Refetch backend or update UI
});

escrow.on('Released', (taskId, to, amount, reason) => {
  console.log('Released:', taskId.toString(), to, amount.toString(), reason);
});

escrow.on('Cancelled', (taskId, employer, amount, reason) => {
  console.log('Cancelled:', taskId.toString(), employer, amount.toString(), reason);
});
```

**Note**: Browser providers may not support WebSocket event filters reliably. Prefer backend event-sync for production.

## Backend Integration

### Endpoints

- `GET /escrow/task/:taskId` — Get escrow info from DB (recommended for UI)
- `POST /escrow/sync` — Manually trigger event sync (admin only)

### Event Sync Flow

1. User calls contract (deposit/cancel/release)
2. Contract emits event
3. Backend listener catches event → inserts/updates `escrow_tasks` table
4. Frontend polls backend or subscribes to WebSocket for updates

## ABIs

### Minimal Escrow ABI
```typescript
export const ESCROW_ABI = [
  'function deposit(uint256 amount, address freelancer, uint256 deadline, string externalTaskId)',
  'function cancel(uint256 taskId, string reason)',
  'function releaseAfterDeadline(uint256 taskId, address to, string reason)',
  'function externalToInternal(string externalId) view returns (uint256)',
  'function escrows(uint256) view returns (address,address,uint256,uint256,bool,string)',
  'event Deposited(uint256 indexed taskId, string indexed externalId, address employer, uint256 amount)',
  'event Released(uint256 indexed taskId, address to, uint256 amount, string reason)',
  'event Cancelled(uint256 indexed taskId, address employer, uint256 amount, string reason)'
];
```

### Minimal Token ABI
```typescript
export const TOKEN_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];
```

## Security & Best Practices

1. **User wallet for on-chain actions**: Always use MetaMask for approve/deposit/cancel/release
2. **Backend as source of truth**: Display data from backend API (synced from events)
3. **Transaction confirmations**: Wait for `tx.wait()` before updating UI
4. **Error handling**: Catch reverts (e.g., "Already settled", "Past deadline")
5. **Admin operations**: Use backend server signer, never expose admin keys in frontend
6. **Allowance check**: Before deposit, check `token.allowance()` to avoid double-approve

## Environment Variables

Add to `.env`:
```bash
VITE_CONTRACT_ADDRESS=0xB957dd37bA6Da7bc10dE5b413B1F4ac3E3452d44
VITE_TOKEN_ADDRESS=0x50B4B400AbEcb21d8DCCEB74bd7E0d4C9b3F028d
```

## Integration Checklist

- [ ] Add contract addresses to `packages/data/contracts.ts`
- [ ] Add ABIs to `apps/web/src/lib/abis.ts`
- [ ] Implement wallet connection (MetaMask / WalletConnect)
- [ ] Create `useWallet` hook
- [ ] Create `useEscrow` hook with deposit/cancel/release
- [ ] Add deposit flow: approve → deposit → show tx hash → poll backend
- [ ] Add cancel button (employer-only, before deadline)
- [ ] Add release button (anyone, after deadline)
- [ ] Subscribe to backend updates (WebSocket or polling)
- [ ] Add transaction status UI (pending, confirmed, failed)
- [ ] Test flows on testnet

## Example Components

See `apps/web/src/components/Escrow/` for:
- `EscrowDeposit.tsx` — Deposit form with approve + deposit
- `EscrowCancel.tsx` — Cancel button
- `EscrowRelease.tsx` — Release button (after deadline)
- `EscrowStatus.tsx` — Display escrow info

## Further Reading

- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- Backend API: `docs/API_DOCUMENTATION.md`
