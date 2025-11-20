# Escrow Components

React components and hooks for interacting with the TaskEscrow smart contract.

## Overview

This package provides a complete UI layer for escrow functionality:
- **Hooks**: `useWallet`, `useEscrow` for contract interactions
- **Components**: Deposit, Cancel, Release, Status display
- **Manager**: All-in-one escrow management UI

## Quick Start

### 1. Connect Wallet

```tsx
import { useWallet } from "@/hooks/useWallet";

function MyComponent() {
  const { isConnected, address, connect } = useWallet();

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return <p>Connected: {address}</p>;
}
```

### 2. Use Escrow Manager (All-in-one)

```tsx
import { EscrowManager } from "@/components/Escrow";

function TaskDetail({ task, currentUser }) {
  return (
    <EscrowManager
      taskId={task.id}
      freelancerAddress={task.freelancerProfileId}
      employerAddress={task.employerProfileId}
      currentUserAddress={currentUser.address}
      defaultAmount="100"
      defaultDeadlineDays={7}
    />
  );
}
```

### 3. Use Individual Components

```tsx
import { EscrowDeposit, EscrowStatus, EscrowCancel } from "@/components/Escrow";

function MyCustomFlow() {
  return (
    <>
      <EscrowStatus taskId="123" />
      <EscrowDeposit
        taskId="123"
        freelancerAddress="0x..."
        onSuccess={(txHash, taskId) => console.log("Deposited:", txHash, taskId)}
      />
      <EscrowCancel
        taskId="123"
        onChainTaskId="456"
        isEmployer={true}
        onSuccess={(txHash) => console.log("Cancelled:", txHash)}
      />
    </>
  );
}
```

## Hooks

### useWallet

Manages wallet connection (MetaMask).

```tsx
const {
  address,           // User's wallet address
  isConnected,       // Connection status
  isConnecting,      // Loading state
  chainId,           // Current network ID
  provider,          // ethers.BrowserProvider
  signer,            // ethers.Signer
  connect,           // Connect function
  disconnect,        // Disconnect function
  switchNetwork      // Switch to different chain
} = useWallet();
```

### useEscrow

Provides escrow contract interactions.

```tsx
const {
  deposit,                  // Deposit funds
  cancel,                   // Cancel escrow
  releaseAfterDeadline,     // Release funds
  readEscrow,               // Read on-chain data
  getTaskIdFromExternal,    // Get taskId from externalId
  checkAllowance,           // Check token allowance
  approveToken,             // Approve token spending
  isDepositing,             // Loading state
  isCancelling,             // Loading state
  isReleasing               // Loading state
} = useEscrow({
  signer,
  onSuccess: (tx) => console.log("Success:", tx),
  onError: (err) => console.error("Error:", err)
});
```

## Components

### EscrowManager

All-in-one escrow management UI with tabs for Status, Deposit, and Actions.

**Props:**
- `taskId` (required): Backend task ID
- `freelancerAddress`: Freelancer's wallet address
- `employerAddress`: Employer's wallet address
- `currentUserAddress`: Current logged-in user's address
- `onChainTaskId`: On-chain task ID (if known)
- `defaultAmount`: Default deposit amount
- `defaultDeadlineDays`: Default deadline in days

### EscrowDeposit

Form to deposit funds into escrow.

**Props:**
- `taskId`: Backend task ID
- `freelancerAddress`: Pre-fill freelancer address
- `defaultAmount`: Default amount
- `defaultDeadlineDays`: Default deadline
- `onSuccess`: Callback on successful deposit

### EscrowCancel

Button to cancel escrow (employer only, before deadline).

**Props:**
- `taskId`: Backend task ID
- `onChainTaskId`: On-chain task ID
- `isEmployer`: Whether current user is employer
- `deadline`: Deadline timestamp
- `onSuccess`: Callback on successful cancel

### EscrowRelease

Button to release funds after deadline (permissionless).

**Props:**
- `taskId`: Backend task ID
- `onChainTaskId`: On-chain task ID
- `freelancerAddress`: Default recipient
- `deadline`: Deadline timestamp
- `settled`: Whether already settled
- `onSuccess`: Callback on successful release

### EscrowStatus

Display escrow information (amount, addresses, deadline, status).

**Props:**
- `taskId`: Backend task ID
- `onChainTaskId`: On-chain task ID

## Flow Example

### Employer Flow

1. Create task in backend
2. Open EscrowManager with task details
3. Click "Deposit" tab
4. Enter amount and deadline → Submit
5. MetaMask prompts: Approve token → Confirm
6. MetaMask prompts: Deposit → Confirm
7. Wait for confirmation
8. View status in "Status" tab

### Freelancer Flow

1. View task with escrow
2. See escrow status (amount, deadline)
3. Wait for deadline to pass
4. Click "Release Funds" in "Actions" tab
5. MetaMask prompts: Confirm release
6. Funds transferred to wallet

### Cancel Flow

1. Employer opens task with active escrow
2. Before deadline, click "Cancel Escrow"
3. Enter reason → Confirm
4. MetaMask prompts: Confirm cancel
5. Funds refunded to employer

## API Integration

Backend endpoints used:
- `GET /escrow/task/:taskId` - Get escrow info
- `GET /escrow/external/:externalTaskId` - Get by external ID
- `POST /escrow/sync` - Manually sync events (admin)

## Error Handling

All components handle common errors:
- "Wallet not connected" → prompts user to connect
- "Already settled" → shows settled status
- "Past deadline" / "Before deadline" → context-specific UI
- Transaction reverts → toast error with reason

## Styling

Components use Tailwind CSS and follow the app's design system:
- Dark mode support
- Responsive layout
- Loading states (spinners)
- Toast notifications (sonner)

## Testing

To test escrow flows locally:

1. Start local hardhat node with deployed contracts
2. Set contract addresses in `.env`:
   ```
   VITE_CONTRACT_ADDRESS=0x...
   VITE_TOKEN_ADDRESS=0x...
   ```
3. Import test accounts into MetaMask
4. Connect wallet and test flows

## Security Notes

- Never expose private keys in frontend code
- Always use user's wallet (MetaMask) for transactions
- Admin operations should use backend server signer
- Verify on-chain state after transactions
- Use backend as source of truth for display data

## Further Reading

- [Contract Documentation](../../docs/FRONTEND_CONTRACT_BRIDGE.md)
- [Backend API](../../docs/API_DOCUMENTATION.md)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
