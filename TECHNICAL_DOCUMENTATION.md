# TÀI LIỆU KỸ THUẬT HỆ THỐNG QUẢN LÝ CÔNG VIỆC VÀ ESCROW TRÊN LENS PROTOCOL

## 1. TỔNG QUAN HỆ THỐNG (System Overview)

### 1.1. Giới thiệu
Hệ thống được xây dựng trên nền tảng **Lens Protocol**, cung cấp giải pháp toàn diện cho việc quản lý công việc (task management) tích hợp cơ chế thanh toán ký quỹ (escrow) thông qua smart contract trên blockchain Lens testnet. Hệ thống áp dụng kiến trúc monorepo, sử dụng **pnpm workspaces** để tổ chức và quản lý các module độc lập nhưng có tính liên kết cao.

### 1.2. Kiến trúc Tổng quan
Hệ thống triển khai theo mô hình **client-server với blockchain layer**, bao gồm:

- **Frontend Application**: Ứng dụng web React 19 tương tác trực tiếp với người dùng
- **Backend API Server**: Xử lý business logic, quản lý database và tương tác với smart contract
- **Blockchain Layer**: Smart contract TaskEscrowPool xử lý giao dịch escrow phi tập trung
- **Lens Protocol Integration**: Tận dụng hạ tầng xác thực và social graph của Lens

### 1.3. Mục tiêu Thiết kế
- **Bảo mật giao dịch**: Sử dụng escrow smart contract đảm bảo an toàn vốn cho cả hai bên
- **Tính minh bạch**: Mọi giao dịch đều có thể kiểm chứng trên blockchain
- **Trải nghiệm người dùng mượt mà**: Tích hợp wagmi/viem cho khả năng tương tác blockchain hiện đại
- **Khả năng mở rộng**: Kiến trúc module hóa cho phép dễ dàng thêm tính năng mới

---

## 2. LUỒNG HOẠT ĐỘNG (Workflow Analysis)

### 2.1. Luồng Đăng và Nhận Công việc

#### 2.1.1. Employer đăng công việc (Task Creation)
```
[Employer] → Create Task Form
           ↓
    Fill task details (title, objective, deliverables, reward, deadline)
           ↓
    POST /tasks → Backend validates & stores in PostgreSQL
           ↓
    Task status: "open"
```

**Dữ liệu quan trọng:**
- `taskId` (UUID): Định danh duy nhất trong database
- `employerProfileId`: Địa chỉ Lens profile của người tạo
- `rewardPoints`: Số điểm thưởng khi hoàn thành ==> Thực chất là số token
- `status`: Trạng thái công việc (`open`, `in_progress`, `completed`, `cancelled`)

#### 2.1.2. Freelancer apply công việc (Application Submission)
```
[Freelancer] → Browse open tasks
             ↓
      Select task → Submit application with cover letter
             ↓
      POST /applications → Store application
             ↓
      Application status: "submitted"
             ↓
      Notify employer via Notifications API
```

### 2.2. Luồng Escrow và Thanh toán (Escrow & Payment Flow)

#### 2.2.1. Employer accept application với Escrow Deposit
```
[Employer] → Select application to accept
           ↓
    Click "Accept" → Open Escrow Deposit Modal
           ↓
    [FRONTEND WALLET INTERACTION]
    Step 1: Check token balance (ERC20_TOKEN_ADDRESS)
           ↓
    Step 2: Approve token spending
            - Call token.approve(ESCROW_CONTRACT, amount)
            - Wait for confirmation (1 block)
            - Verify allowance updated
           ↓
    Step 3: Deposit to escrow
            - Call escrow.deposit(amount, freelancerAddress, deadline, taskId)
            - Extract onChainTaskId from Deposited event
            - Get transaction hash
           ↓
    [BACKEND CONFIRMATION]
    Step 4: PATCH /tasks/:id/confirm-deposit
            - Save onChainTaskId to database
            - Save depositedTxHash
            - Keep task status unchanged
           ↓
    Step 5: POST /applications/:id (status: "accepted")
            - Update application status
           ↓
    Step 6: Reject other applications
            - POST /applications/:id (status: "rejected") for others
           ↓
    Task status: "in_progress"
    Application status: "accepted"
```

**Thông tin Smart Contract:**
```solidity
// TaskEscrowPool Contract Address (Lens Testnet)
0x95207816564EB34b13De560a4F572b45e3001bc2

// Key functions:
function deposit(
    uint256 amount,
    address freelancer,
    uint256 deadline,
    string externalTaskId
) external
// Emits: Deposited(taskId, externalId, employer, amount)

// Escrow state stored on-chain:
struct Escrow {
    address employer;
    address freelancer;
    uint256 amount;
    uint256 deadline;
    bool settled;
    string externalTaskId;
}
```

#### 2.2.2. Freelancer submit work (Work Submission)
```
[Freelancer] → Click "Submit Work"
             ↓
      Fill outcome (text or file URL)
             ↓
      POST /applications/:id/submit
             ↓
      Application status: "in_review"
             ↓
      Notify employer
```

#### 2.2.3. Employer review và feedback (Review & Revision Cycle)
```
[Employer] → Review submitted work
           ↓
    Decision:
    
    Option A: Request Revision
           ↓
      PUT /applications/:id (status: "needs_revision", feedback)
           ↓
      [Freelancer] → Resubmit work
                   ↓
            POST /applications/:id/submit
                   ↓
            Status changes back to: "in_review"
                   ↓
            Cycle repeats until approved
    
    Option B: Approve Work
           ↓
      [CRITICAL FLOW - RELEASE ESCROW]
```

#### 2.2.4. Employer approve và Release Payment (Final Approval)
```
[Employer] → Click "Approve" button
           ↓
    Confirm action dialog
           ↓
    [BACKEND ADMIN WALLET - AUTOMATED]
    POST /tasks/:id/release
           ↓
    Backend fetches onChainTaskId from database
           ↓
    Backend admin wallet calls smart contract:
    contract.release(onChainTaskId, freelancerAddress, "Work approved")
           ↓
    Smart contract transfers tokens to freelancer
           ↓
    Emit Released event
           ↓
    [UPDATE DATABASE]
    PUT /applications/:id (status: "completed")
    PUT /tasks/:id (status: "completed")
           ↓
    Award rewardPoints to freelancer
           ↓
    Open rating modal for employer to rate freelancer
```

**Quan trọng:** Admin release được thực hiện bởi **backend admin wallet**, không phải employer wallet. Điều này đảm bảo:
- Employer không cần tốn gas fee cho transaction release
- Backend có toàn quyền kiểm soát việc release sau khi verify điều kiện business logic
- Tăng UX cho employer (chỉ cần click "Approve" thay vì sign transaction)

### 2.3. Luồng Cancel Escrow (Cancellation Flow) ==> bỏ luồng này không dùng

```
[Employer/Admin] → Decide to cancel before deadline
                 ↓
          POST /escrow/cancel
                 ↓
          Backend admin wallet calls:
          contract.cancel(onChainTaskId, reason)
                 ↓
          Smart contract refunds tokens to employer
                 ↓
          Emit Cancelled event
                 ↓
          Update task status: "cancelled"
```

### 2.4. State Diagram của Application

```
submitted → accepted → in_review ⇄ needs_revision
                         ↓
                     completed
                         ↓
                      rated
```

**Giải thích transitions:**
- `submitted → accepted`: Employer chấp nhận và deposit escrow
- `accepted → in_review`: Freelancer submit work lần đầu
- `in_review → needs_revision`: Employer yêu cầu sửa
- `needs_revision → in_review`: Freelancer resubmit (có thể lặp nhiều lần)
- `in_review → completed`: Employer approve → trigger release escrow
- `completed → rated`: Employer đánh giá freelancer (optional)

---

## 3. CHI TIẾT KỸ THUẬT (Technical Implementation)

### 3.1. Frontend Stack

#### 3.1.1. Core Technologies
```json
{
  "framework": "React 19",
  "build_tool": "Vite",
  "language": "TypeScript 5.x",
  "styling": "TailwindCSS + CSS Modules",
  "state_management": "Zustand 5.x",
  "form_handling": "React Hook Form + Zod",
  "blockchain": "wagmi 2.17.2 + viem 2.37.8"
}
```

#### 3.1.2. Web3 Integration Architecture

**Wagmi Configuration:**
```typescript
// Stack: wagmi v2 + viem v2 (modern web3 libraries)
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatUnits, parseUnits, type Address, type Hash } from "viem";

// Lens Chain Configuration
const CHAIN = {
  id: 37111, // Lens testnet chainId
  name: "Lens Testnet",
  nativeCurrency: { name: "GRASS", symbol: "GRASS", decimals: 18 }
};
```

**Key Hooks Workflow:**

1. **useAccount**: Lấy thông tin wallet đang kết nối
```typescript
const { address, isConnected } = useAccount();
// address: 0x... (user wallet address)
// isConnected: boolean
```

2. **usePublicClient**: Đọc dữ liệu từ blockchain (không cần sign)
```typescript
const publicClient = usePublicClient();
// Read contract state
const balance = await publicClient.readContract({
  address: TOKEN_ADDRESS,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [userAddress]
});
```

3. **useWalletClient**: Ghi dữ liệu lên blockchain (cần sign)
```typescript
const { data: walletClient } = useWalletClient();
// Write to contract
const hash = await walletClient.writeContract({
  chain: CHAIN,
  address: ESCROW_ADDRESS,
  abi: ESCROW_ABI,
  functionName: "deposit",
  args: [amount, freelancer, deadline, taskId]
});
```

#### 3.1.3. useEscrow Hook - Core Smart Contract Interaction

**Custom Hook Architecture:**
```typescript
export function useEscrow({ onSuccess, onError }: UseEscrowOptions) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // State management
  const [isDepositing, setIsDepositing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  
  // Main functions
  return {
    deposit,           // Employer deposit funds
    cancel,            // Cancel escrow (backend API)
    adminReleaseEscrow,// Admin approve release (backend API)
    readEscrow,        // Read escrow state
    getTaskIdFromExternal, // Map UUID to on-chain ID
    checkAllowance,    // Check ERC20 allowance
    approveToken,      // Approve ERC20 spending
    // Loading states
    isDepositing,
    isCancelling,
    isReleasing
  };
}
```

**Deposit Flow - Chi tiết Implementation:**
```typescript
async function deposit(params: EscrowDepositParams) {
  const { freelancerAddress, amountWei, deadlineUnix, externalTaskId } = params;
  
  // Step 1: Validate balance
  const balance = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address]
  });
  
  if (balance < amountWei) {
    throw new Error("Insufficient token balance");
  }
  
  // Step 2: Check allowance
  const allowance = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address, ESCROW_ADDRESS]
  });
  
  // Step 3: Approve if needed
  if (allowance < amountWei) {
    // Reset to 0 first (some tokens require this)
    if (allowance > 0n) {
      await walletClient.writeContract({
        chain: CHAIN,
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [ESCROW_ADDRESS, 0n]
      });
    }
    
    // Approve required amount
    const approveHash = await walletClient.writeContract({
      chain: CHAIN,
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [ESCROW_ADDRESS, amountWei]
    });
    
    // Wait for confirmation
    await publicClient.waitForTransactionReceipt({ 
      hash: approveHash,
      confirmations: 1 
    });
    
    // Verify approval (retry up to 3 times)
    for (let i = 0; i < 3; i++) {
      const newAllowance = await publicClient.readContract({
        address: TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, ESCROW_ADDRESS]
      });
      
      if (newAllowance >= amountWei) break;
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Step 4: Deposit to escrow
  const depositHash = await walletClient.writeContract({
    chain: CHAIN,
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: "deposit",
    args: [amountWei, freelancerAddress, deadlineUnix, externalTaskId]
  });
  
  // Step 5: Wait and extract taskId from event
  const receipt = await publicClient.waitForTransactionReceipt({ 
    hash: depositHash 
  });
  
  let taskId: string | undefined;
  for (const log of receipt.logs) {
    const decoded = decodeEventLog({
      abi: ESCROW_ABI,
      data: log.data,
      topics: log.topics
    });
    
    if (decoded.eventName === "Deposited") {
      taskId = decoded.args.taskId?.toString();
      break;
    }
  }
  
  return { txHash: receipt.transactionHash, taskId };
}
```

**Kỹ thuật quan trọng:**
- **Sequential approval flow**: Reset → Approve → Verify (đảm bảo tương thích với mọi ERC20 token)
- **Event parsing**: Extract on-chain taskId từ transaction logs
- **Confirmation strategy**: Đợi 1 block confirmation + retry mechanism
- **Error handling**: Viem tự động decode contract errors thành human-readable messages

#### 3.1.4. API Client Layer

**RESTful API Integration:**
```typescript
class ApiClient {
  private baseUrl: string;
  
  // Authentication
  private getToken(): string | null {
    // Priority: Zustand store → Cookie → LocalStorage
    return hydrateAuthTokens()?.accessToken || 
           getTokenFromCookie() || 
           getTokenFromLocalStorage();
  }
  
  // Generic request handler
  private async request(path: string, opts: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
    
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...opts,
      headers,
      mode: 'cors',
      credentials: 'omit' // Simplified CORS
    });
    
    if (!response.ok) {
      const body = await response.json();
      throw new ApiError(response.status, body.message, body);
    }
    
    return response.json();
  }
  
  // Task Management APIs
  async createTask(payload: TaskPayload) { }
  async getTask(taskId: string) { }
  async updateTask(taskId: string, payload: Partial<Task>) { }
  async confirmDeposit(taskId: string, { onChainTaskId, txHash }) { }
  
  // Application Management APIs
  async getApplicationsByTask(taskId: string) { }
  async submitOutcome(applicationId: string, { outcome, outcomeType }) { }
  async updateApplication(applicationId: string, { status, feedback }) { }
  async acceptApplication(applicationId: string) { }
  async rejectApplication(applicationId: string) { }
}
```

### 3.2. Component Architecture

#### 3.2.1. ApplicationList Component
**Trách nhiệm:**
- Hiển thị danh sách applications cho một task
- Quản lý escrow deposit modal
- Xử lý approve/reject/revision workflows

**Key Features:**
```typescript
const ApplicationList = ({
  taskId,
  taskExternalId,    // UUID for escrow mapping
  taskRewardAmount,  // Reward in token units
  isEmployer,
  onApplicationUpdate
}) => {
  // State management
  const [applications, setApplications] = useState<Application[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(null);
  
  // Escrow hooks
  const { adminReleaseEscrow } = useEscrow({ onSuccess, onError });
  
  // Critical handlers
  const handleAccept = (id) => {
    // Open escrow deposit modal (blocking action)
    setPendingApplication(applications.find(a => a.id === id));
    setShowDepositModal(true);
  };
  
  const handleDepositSuccess = async (txHash, onChainTaskId) => {
    // Step 1: Confirm deposit to backend
    await apiClient.confirmDeposit(taskExternalId, {
      onChainTaskId,
      depositedTxHash: txHash
    });
    
    // Step 2: Accept application
    await apiClient.acceptApplication(pendingApplication.id);
    
    // Step 3: Reject others
    await Promise.all(
      otherApps.map(a => apiClient.rejectApplication(a.id))
    );
  };
  
  const handleApprove = async (id) => {
    // Release escrow via backend API
    await adminReleaseEscrow(taskExternalId, "Work approved");
    
    // Update statuses
    await apiClient.updateApplication(id, { status: "completed" });
    await apiClient.updateTask(taskId, { status: "completed" });
    
    // Open rating modal
    onOpenRate?.(id);
  };
};
```

#### 3.2.2. SubmitOutcomeModal Component
**Simplified architecture sau refactor:**
```typescript
interface SubmitOutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onSuccess?: () => void;
  isResubmit?: boolean;  // Chỉ còn 1 prop quan trọng
}

const SubmitOutcomeModal = ({ isResubmit, ... }) => {
  const handleSubmit = async (data) => {
    // Submit outcome to backend
    await apiClient.submitOutcome(applicationId, {
      outcome: data.outcome,
      outcomeType: data.outcomeType // "text" | "file"
    });
    
    // Show appropriate message
    toast.success(
      isResubmit 
        ? "Work resubmitted! Waiting for employer review."
        : "Work submitted successfully!"
    );
  };
};
```

**Điểm nổi bật:**
- Loại bỏ unnecessary props (taskId, profileId, rewardPoints, reputationScore)
- Backend tự động xử lý status transition (không cần frontend update)
- Clean error handling với toast notifications

### 3.3. Smart Contract Integration

#### 3.3.1. Contract Addresses
```typescript
// Testnet (Lens Testnet - chainId: 37111)
const TESTNET_CONTRACTS = {
  taskEscrowPool: "0x95207816564EB34b13De560a4F572b45e3001bc2",
  defaultToken: "0x7326D8584c6b891B2f4B194CDF5ba746dD0D4080" // tRYF
};

// Mainnet (Lens Mainnet - chainId: TBD)
const MAINNET_CONTRACTS = {
  taskEscrowPool: "0x0000...", // To be deployed
  defaultToken: "0x6bDc36E20D267Ff0dd6097799f82e78907105e2F"
};
```

#### 3.3.2. ABI Definitions
```typescript
export const ESCROW_ABI = parseAbi([
  // Write functions
  "function deposit(uint256 amount, address freelancer, uint256 deadline, string externalTaskId)",
  "function cancel(uint256 taskId, string reason)",
  "function release(uint256 taskId, address to, string reason)", // Admin only
  "function releaseAfterDeadline(uint256 taskId, address to, string reason)", // Permissionless
  
  // Read functions
  "function escrows(uint256) view returns (address employer, address freelancer, uint256 amount, uint256 deadline, bool settled, string externalTaskId)",
  "function externalToInternal(string externalId) view returns (uint256)",
  
  // Events
  "event Deposited(uint256 indexed taskId, string indexed externalId, address employer, uint256 amount)",
  "event Released(uint256 indexed taskId, address to, uint256 amount, string reason)",
  "event Cancelled(uint256 indexed taskId, address employer, uint256 amount, string reason)"
]);
```

#### 3.3.3. Database to Blockchain Mapping

**Quan trọng:** Hệ thống sử dụng dual-ID system:

```typescript
// Database (PostgreSQL)
{
  id: "550e8400-e29b-41d4-a716-446655440000", // UUID v4
  title: "Build Landing Page",
  status: "in_progress",
  // ... other fields
  
  // Blockchain tracking fields
  onChainTaskId: "12345",              // uint256 from smart contract
  depositedTxHash: "0xabc123...",      // Transaction hash của deposit
}

// Smart Contract (Solidity)
mapping(uint256 => Escrow) public escrows;
mapping(string => uint256) public externalToInternal; // UUID → on-chain ID

struct Escrow {
    address employer;
    address freelancer;
    uint256 amount;
    uint256 deadline;
    bool settled;
    string externalTaskId; // UUID from database
}
```

**Lợi ích của dual-ID:**
- Frontend/Backend sử dụng UUID cho clean RESTful API
- Smart contract sử dụng uint256 cho gas efficiency
- Bidirectional mapping cho phép query linh hoạt
- `externalToInternal` mapping cho phép lookup on-chain ID từ UUID

---

## 4. ĐIỂM NỔI BẬT & BẢO MẬT (Highlights & Security)

### 4.1. Điểm Nổi bật Kỹ thuật

#### 4.1.1. Modern Web3 Stack
- **wagmi v2 + viem v2**: State-of-the-art web3 libraries với:
  - Type-safe contract interactions
  - Automatic error decoding
  - Built-in retry mechanisms
  - React Hooks patterns

#### 4.1.2. Optimized Transaction Flow
```
User Action → Frontend validates → Wallet signs → Blockchain confirms
                                          ↓
                            Backend saves state ← Event emitted
```

**Tối ưu:**
- Parallel batch reads từ blockchain
- Sequential writes với confirmation strategy
- Event-driven state synchronization
- Optimistic UI updates với rollback capability

#### 4.1.3. Error Handling Strategy
```typescript
// Smart contract errors automatically decoded
try {
  await contract.deposit(...)
} catch (error) {
  // Viem provides detailed error messages
  if (error.name === "ContractFunctionExecutionError") {
    // e.g., "Insufficient allowance", "Deadline passed"
    toast.error(error.shortMessage);
  }
}
```

#### 4.1.4. Gas Optimization
- **Approval strategy**: Reset → Approve (tương thích USDT/USDC)
- **Event parsing**: Extract data từ logs thay vì multiple contract calls
- **Batch operations**: Reject multiple applications trong 1 Promise.all

### 4.2. Bảo mật (Security Measures)

#### 4.2.1. Smart Contract Security

**Access Control:**
```solidity
// Pseudo-code từ TaskEscrowPool
modifier onlyEmployer(uint256 taskId) {
    require(escrows[taskId].employer == msg.sender, "Not employer");
    _;
}

modifier onlyAdmin() {
    require(hasRole(ADMIN_ROLE, msg.sender), "Not admin");
    _;
}

// deposit: Anyone can deposit
// cancel: Only employer before deadline
// release: Only admin (backend wallet)
// releaseAfterDeadline: Anyone after deadline
```

**Reentrancy Protection:**
- Checks-Effects-Interactions pattern
- `settled` flag prevents double-spending

**Deadline Enforcement:**
```solidity
require(block.timestamp < escrow.deadline, "Deadline passed");
```

#### 4.2.2. Frontend Security

**Private Key Management:**
- Browser wallet only (MetaMask, WalletConnect)
- Never expose private keys
- Use wagmi's secure wallet connectors

**Input Validation:**
```typescript
// Zod schema validation
const SubmitOutcomeSchema = z.object({
  outcome: z.string().min(10, "Outcome must be at least 10 characters"),
  outcomeType: z.enum(["text", "file"])
});

// Form validation before submission
const form = useZodForm({ schema: SubmitOutcomeSchema });
```

**XSS Prevention:**
- React automatic escaping
- Sanitize user input before rendering
- CSP headers từ backend

#### 4.2.3. Backend Security

**Authentication:**
```typescript
// JWT-based authentication
Authorization: Bearer <access_token>

// Token validation middleware
authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, SECRET);
  req.user = decoded;
  next();
}
```

**Admin Wallet Security:**
- Private key stored in environment variables (never committed)
- Backend admin wallet có ADMIN_ROLE trong contract
- Rate limiting cho admin actions
- Audit log cho mọi admin transactions

**Database Security:**
- Parameterized queries (SQL injection prevention)
- Row-level security policies
- Encrypted sensitive fields
- Regular backups

#### 4.2.4. Transaction Security

**Confirmation Strategy:**
```typescript
// Wait for block confirmation
const receipt = await publicClient.waitForTransactionReceipt({
  hash: txHash,
  confirmations: 1  // Wait for 1 block
});

// Verify state changed
const newBalance = await contract.balanceOf(address);
assert(newBalance === expectedBalance);
```

**Idempotency:**
- Frontend prevents double submissions với loading states
- Backend checks task status before processing
- Smart contract checks `settled` flag

### 4.3. Scalability Considerations

#### 4.3.1. Frontend Optimization
- **Code splitting**: Lazy load components với React.lazy()
- **Caching**: React Query cho API responses
- **Debouncing**: Search inputs, form submissions
- **Virtual scrolling**: Cho large lists

#### 4.3.2. Backend Optimization
- **Database indexing**: UUID, profileId, status columns
- **Query optimization**: JOINs với proper indexes
- **Connection pooling**: PostgreSQL connection pool
- **Rate limiting**: Protect against DDoS

#### 4.3.3. Blockchain Optimization
- **Batch reads**: Multicall pattern cho multiple reads
- **Event indexing**: Backend indexes blockchain events
- **State caching**: Cache frequently accessed on-chain data

### 4.4. Monitoring & Observability

#### 4.4.1. Frontend Monitoring
```typescript
// Error tracking
window.addEventListener('unhandledrejection', (event) => {
  logToSentry(event.reason);
});

// Performance monitoring
useEffect(() => {
  const metrics = performance.getEntriesByType('navigation')[0];
  logPerformanceMetrics(metrics);
}, []);
```

#### 4.4.2. Backend Monitoring
- **Structured logging**: Winston/Pino với log levels
- **Health checks**: `/health` endpoint
- **Metrics**: Prometheus-compatible metrics
- **Alerts**: Critical errors trigger notifications

#### 4.4.3. Blockchain Monitoring
```typescript
// Listen to contract events
contract.on('Deposited', (taskId, externalId, employer, amount) => {
  logEvent('ESCROW_DEPOSITED', { taskId, amount });
  syncDatabaseWithBlockchain(taskId);
});
```

---

## 4. PHÂN HỆ MẠNG XÃ HỘI - LENS PROTOCOL (SocialFi Module)

### 4.1. Giới thiệu Lens Protocol Integration
Hệ thống tích hợp sâu với **Lens Protocol** - một nền tảng mạng xã hội phi tập trung (decentralized social graph) trên blockchain. Lens Protocol cung cấp hạ tầng xác thực, quản lý profile và tương tác xã hội cho toàn bộ ứng dụng.

### 4.2. Xác thực (Authentication - SIWE)

#### 4.2.1. Sign-In With Ethereum (SIWE) Flow
Hệ thống sử dụng chuẩn **Sign-In With Ethereum** để xác thực người dùng thông qua chữ ký số từ ví blockchain:

```
[User] → Connect Wallet (MetaMask/WalletConnect)
       ↓
   Wallet connected (wagmi useAccount)
       ↓
   [Backend] → Generate challenge message
       ↓
   [Frontend] → User signs message with private key
       ↓
   [Backend] → Verify signature + Issue JWT tokens
       ↓
   Access token & Refresh token stored in Zustand
       ↓
   User authenticated ✓
```

**Implementation Details:**

```typescript
// Component: Login.tsx
// Hook: wagmi useSignMessage + Lens GraphQL mutations

const handleSign = async (accountAddress: string) => {
  // Step 1: Request challenge from Lens backend
  const challenge = await loadChallenge({
    variables: {
      request: {
        accountOwner: {
          owner: walletAddress,  // User's wallet address
          account: accountAddress, // Lens profile address
          app: HEY_APP            // App identifier
        }
      }
    }
  });
  
  // Challenge text example:
  // "lens.xyz wants you to sign in with your Ethereum account:
  //  0x123...
  //  
  //  Sign in with Ethereum to the app.
  //  
  //  URI: https://lens.xyz
  //  Version: 1
  //  Nonce: abc123..."
  
  // Step 2: Sign challenge with wallet
  const signature = await signMessageAsync({
    message: challenge.data.challenge.text
  });
  
  // Step 3: Authenticate with signature
  const auth = await authenticate({
    variables: {
      request: {
        id: challenge.data.challenge.id,
        signature: signature
      }
    }
  });
  
  // Step 4: Store JWT tokens
  const { accessToken, refreshToken } = auth.data.authenticate;
  signIn({ accessToken, refreshToken }); // Zustand store
  
  // Step 5: Redirect to home
  window.location.href = '/';
};
```

**GraphQL Mutations:**
```graphql
# Get challenge
mutation Challenge($request: ChallengeRequest!) {
  challenge(request: $request) {
    id
    text  # SIWE message to sign
  }
}

# Authenticate with signature
mutation Authenticate($request: SignedAuthChallenge!) {
  authenticate(request: $request) {
    ... on AuthenticationTokens {
      accessToken   # JWT for API requests
      refreshToken  # JWT for token renewal
    }
  }
}
```

#### 4.2.2. Authentication State Management
```typescript
// Store: useAuthStore (Zustand + LocalStorage persistence)
interface AuthState {
  accessToken?: string;
  refreshToken?: string;
  signIn: (tokens: AuthTokens) => void;
  signOut: () => void;
  hydrateAuthTokens: () => AuthTokens | undefined;
}

// Store: useAccountStore (Current logged-in Lens account)
interface AccountState {
  currentAccount?: AccountFragment; // Lens profile data
  setCurrentAccount: (account?: AccountFragment) => void;
  hydrateAccount: () => AccountFragment | undefined;
}

// AccountFragment structure:
{
  address: "0x123...",        // Lens profile address
  username?: "alice.lens",    // Lens handle
  metadata?: {
    name: "Alice",
    bio: "...",
    picture: "ipfs://..."
  },
  operations?: {
    isFollowedByMe: boolean,
    isFollowingMe: boolean
  }
}
```

#### 4.2.3. Wallet Integration
**Supported Wallets:**
- **MetaMask** (injected provider)
- **WalletConnect** (QR code for mobile wallets)
- **Family Accounts** (Lens-specific account abstraction)

```typescript
// Component: WalletSelector.tsx
const { connectAsync, connectors } = useConnect();

// Filtered connectors (priority order)
const allowedConnectors = [
  "familyAccountsProvider",  // Lens account abstraction
  "injected",                // MetaMask, etc.
  "walletConnect"            // Mobile wallets
];

// Connect flow
const handleConnect = async (connector: Connector) => {
  await connectAsync({ connector });
  // After connection, show Lens accounts managed by wallet
};
```

### 4.3. Hồ sơ Người dùng (User Profile)

#### 4.3.1. Lens Profile Structure
Mỗi người dùng có một **Lens Profile** (NFT-based identity) chứa:

```typescript
interface LensProfile {
  address: string;           // On-chain profile address (NFT token ID)
  username?: string;         // Human-readable handle (e.g., "alice.lens")
  metadata?: {
    name: string;            // Display name
    bio: string;             // Biography
    picture: string;         // Avatar (IPFS/Arweave URL)
    coverPicture?: string;   // Cover image
    attributes?: Array<{     // Custom metadata
      key: string;
      value: string;
    }>;
  };
  stats?: {
    followers: number;
    following: number;
    posts: number;
  };
  operations?: {
    isFollowedByMe: boolean;  // Current user follows this profile
    isFollowingMe: boolean;   // This profile follows current user
  };
}
```

#### 4.3.2. User Profile Data Retrieval
```typescript
// Component: UserProfilePage.tsx
// API: Backend RESTful API (not Lens GraphQL directly)

const fetchUserProfile = async (walletAddress: string) => {
  // Backend API endpoint
  const res = await apiClient.getUser(walletAddress);
  
  // Backend returns hybrid data (Lens + custom fields)
  return {
    // Lens Profile fields
    walletAddress: res.address,
    username: res.username,
    avatar: res.metadata?.picture,
    
    // Custom app fields (stored in backend DB)
    reputationScore: res.reputationScore ?? 100,  // Default: 100
    rewardPoints: res.rewardPoints ?? 0,          // Task rewards
    expertise: res.expertise || [],               // Skill levels
    completedTasks: res.completedTasks || []      // Task history
  };
};
```

**GraphQL Query (Alternative - Direct Lens API):**
```graphql
query Account($request: AccountRequest!) {
  account(request: $request) {
    address
    username {
      value        # e.g., "alice"
      namespace    # e.g., "lens"
    }
    metadata {
      name
      bio
      picture
    }
    stats {
      followers
      following
      posts
    }
  }
}
```

#### 4.3.3. Hệ thống Uy tín (Reputation System)

**Reputation Score Architecture:**
```typescript
interface ReputationSystem {
  initialScore: 100,           // Mọi user bắt đầu với 100 điểm
  maxScore: 100,
  minScore: 0,
  
  // Điểm tăng khi:
  increaseFactors: [
    "Complete task successfully",
    "Receive 5-star rating from employer",
    "Submit work on time (before deadline)",
    "High-quality work (low revision requests)"
  ],
  
  // Điểm giảm khi:
  decreaseFactors: [
    "Receive 1-2 star rating",
    "Fail to complete task after acceptance",
    "Multiple revision requests (>3 times)",
    "Deadline violations"
  ],
  
  // Impacts:
  benefits: [
    "Score ≥ 80: Priority in application selection",
    "Score ≥ 90: Access to high-value tasks",
    "Score < 50: Limited task access (probation period)"
  ]
}
```

**Display Logic:**
```tsx
// Component: UserProfilePage.tsx
<Card>
  <H6>Reputation Score</H6>
  <div className="flex justify-between">
    <span>Score</span>
    <span>{profile.reputationScore}/100</span>
  </div>
  
  {/* Progress bar */}
  <div className="h-2 bg-gray-200 rounded-full">
    <div 
      className="h-2 bg-brand-500 rounded-full"
      style={{ width: `${profile.reputationScore}%` }}
    />
  </div>
</Card>
```

**Welcome Modal cho First-time Users:**
```tsx
// Hiển thị khi user đăng nhập lần đầu
const WelcomeModal = () => (
  <Modal title="Welcome to the Task System!">
    <p>Your reputation score starts at 100.</p>
    
    <div className="bg-brand-50 p-4">
      <h6>How the Reputation System Works:</h6>
      <ul>
        <li>• Start with 100 reputation points</li>
        <li>• Complete tasks successfully to maintain your score</li>
        <li>• High reputation = more task opportunities</li>
        <li>• Poor performance may decrease your score</li>
      </ul>
    </div>
  </Modal>
);
```

#### 4.3.4. Reward Points System ==> Bỏ cái này, vì đã có token thay thế
```typescript
interface RewardPointsSystem { ==> 
  // Accumulation
  earnPoints: [
    "Complete task → Earn task.rewardPoints",
    "Receive 5-star rating → Bonus +10 points",
    "First task completion → Bonus +20 points"
  ],
  
  // Usage (Future features)
  spendPoints: [
    "Boost task visibility",
    "Unlock premium features",
    "Redeem for platform tokens"
  ],
  
  // Display
  display: "Total earned rewards (lifetime)" ==> Token thay cho RewardPoint
}

// Backend updates points after task completion
await apiClient.completeTask(taskId, {
  freelancerId,
  rewardPoints: task.rewardPoints
});
// Backend increments user.rewardPoints in database
```

### 4.4. Tương tác Xã hội (Social Graph)

#### 4.4.1. Follow/Unfollow Mechanism

**Follow Flow:**
```
[User A] → Click "Follow" on User B's profile
         ↓
  Check authentication (useAuthModalStore)
         ↓
  [GraphQL Mutation] → Lens Protocol API
         ↓
  Transaction submitted (SelfFunded or Sponsored)
         ↓
  Wait for transaction confirmation
         ↓
  Update Apollo cache (isFollowedByMe = true)
         ↓
  UI updates instantly ✓
```

**Implementation:**
```typescript
// Component: Follow.tsx
const Follow = ({ account, buttonClassName, title = "Follow" }) => {
  const { currentAccount } = useAccountStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { cache } = useApolloClient();
  
  const [follow] = useFollowMutation({
    onCompleted: async ({ follow }) => {
      if (follow.__typename === "FollowResponse") {
        // Optimistic update
        cache.modify({
          id: cache.identify(account.operations),
          fields: {
            isFollowedByMe: () => true
          }
        });
        
        return onCompleted();
      }
      
      // Handle transaction lifecycle (if on-chain)
      if (follow.__typename === "SelfFundedTransactionRequest") {
        await handleTransactionLifecycle({ transactionData: follow });
      }
    }
  });
  
  const handleFollow = async () => {
    if (!currentAccount) {
      return setShowAuthModal(true); // Redirect to login
    }
    
    setIsSubmitting(true);
    await follow({
      variables: {
        request: { account: account.address }
      }
    });
  };
  
  return (
    <Button 
      onClick={handleFollow} 
      loading={isSubmitting}
      outline
    >
      {title}
    </Button>
  );
};
```

**GraphQL Mutation:**
```graphql
mutation Follow($request: CreateFollowRequest!) {
  follow(request: $request) {
    ... on FollowResponse {
      hash  # Transaction hash (on-chain)
    }
    ... on SelfFundedTransactionRequest {
      # User pays gas
      reason
    }
    ... on SponsoredTransactionRequest {
      # App sponsors gas
      reason
    }
    ... on AccountFollowOperationValidationFailed {
      reason  # e.g., "Already following", "Blocked"
    }
  }
}
```

**Unfollow Flow:**
```typescript
// Component: Unfollow.tsx
// Similar logic, inverse cache update
const [unfollow] = useUnfollowMutation({
  onCompleted: async ({ unfollow }) => {
    cache.modify({
      id: cache.identify(account.operations),
      fields: {
        isFollowedByMe: () => false
      }
    });
  }
});
```

**Social Graph Queries:**
```typescript
// Get user's followers
const { data } = useFollowersQuery({
  variables: {
    request: {
      account: accountAddress,
      pageSize: 20
    }
  }
});

// Get user's following
const { data } = useFollowingQuery({
  variables: {
    request: {
      account: accountAddress,
      pageSize: 20
    }
  }
});
```

#### 4.4.2. Who to Follow Widget
```tsx
// Component: WhoToFollow.tsx
const WhoToFollow = () => {
  const { currentAccount } = useAccountStore();
  
  // Query recommended accounts (Lens ML algorithm)
  const { data } = useRecommendedAccountsQuery({
    variables: {
      request: {
        pageSize: 5,
        // Exclude already followed
        filter: {
          excludeFollowing: true
        }
      }
    }
  });
  
  return (
    <Card>
      <H5>Who to Follow</H5>
      {data?.recommendedAccounts.map(account => (
        <SingleAccount
          account={account}
          hideFollowButton={false}
          hideUnfollowButton={false}
        />
      ))}
    </Card>
  );
};
```

#### 4.4.3. Đăng bài (Post/Publication)

**Post Creation Flow:**
```
[User] → Open composer modal
       ↓
   Write content (text/images/video)
       ↓
   [Optional] Add attachments, tags, mentions
       ↓
   Upload media to Lens Storage (IPFS/Arweave)
       ↓
   Generate metadata JSON (Lens Metadata Standard)
       ↓
   [GraphQL Mutation] → Lens API
       ↓
   Transaction submitted + hash returned
       ↓
   Wait for indexing (toast notification)
       ↓
   Post visible on timeline ✓
```

**Implementation:**
```typescript
// Hook: useCreatePost.tsx
const useCreatePost = ({ onCompleted, onError }) => {
  const [createPost] = useCreatePostMutation({
    onCompleted: async ({ post }) => {
      if (post.__typename === "PostResponse") {
        // Transaction hash received
        const toastId = toast.loading("Post processing...");
        
        // Wait for blockchain confirmation
        await waitForTransactionToComplete(post.hash);
        
        // Fetch indexed post data
        const { data } = await getPost({
          variables: { request: { txHash: post.hash } }
        });
        
        // Update cache
        cache.writeQuery({
          query: PostDocument,
          data: data.post
        });
        
        toast.success("Post created successfully!", {
          action: {
            label: "View",
            onClick: () => navigate(`/posts/${data.post.slug}`)
          }
        });
        
        return onCompleted();
      }
    },
    onError
  });
  
  return { createPost };
};
```

**Metadata Generation:**
```typescript
// Hook: usePostMetadata.tsx
import { post as postMetadata } from "@lens-protocol/metadata";

const generateMetadata = async (content: string, attachments: Media[]) => {
  // Use Lens Metadata Standard
  const metadata = postMetadata({
    content: content,
    locale: "en",
    
    // Attachments (images/videos)
    attachments: attachments.map(media => ({
      type: media.type,      // "image" | "video" | "audio"
      item: media.uri,       // IPFS/Arweave URI
      cover: media.cover     // Thumbnail
    })),
    
    // Tags
    tags: extractHashtags(content),
    
    // App identifier
    appId: HEY_APP
  });
  
  // Upload metadata to Lens Storage
  const { uri } = await uploadToLensStorage(metadata);
  return uri; // e.g., "lens://abc123..."
};
```

**GraphQL Mutation:**
```graphql
mutation CreatePost($request: CreatePostRequest!) {
  post(request: $request) {
    ... on PostResponse {
      hash  # Transaction hash
    }
    ... on SelfFundedTransactionRequest {
      reason
    }
  }
}

# Request structure:
{
  "request": {
    "contentUri": "lens://metadata...",  # Metadata URI
    "referenceTo": null,                 # Parent post (for comments)
    "sponsored": true                     # Gas sponsorship
  }
}
```

**Post Types:**
- **Post**: Standalone publication
- **Comment**: Reply to another post (referenceTo field)
- **Repost**: Share another user's post
- **Quote**: Repost with additional commentary

#### 4.4.4. Timeline & Feed
```typescript
// Query: Get timeline posts
const { data } = useTimelineQuery({
  variables: {
    request: {
      pageSize: 20,
      filter: {
        // Following feed (posts from followed accounts)
        following: currentAccount?.address
      }
    }
  }
});

// Query: Get explore posts (algorithmic feed)
const { data } = useExplorePostsQuery({
  variables: {
    request: {
      pageSize: 20,
      orderBy: "LATEST" | "TOP_COMMENTED" | "TOP_COLLECTED"
    }
  }
});
```

### 4.5. Công nghệ Lens Protocol

#### 4.5.1. Thư viện Sử dụng
```json
{
  // packages/web/package.json
  "dependencies": {
    "@lens-protocol/metadata": "^2.1.0",  // Metadata standard
    "@lens-chain/storage-client": "^1.0.6", // IPFS/Arweave upload
    "@slice/indexer": "workspace:*"        // GraphQL operations
  }
}
```

**Giải thích:**
- **`@lens-protocol/metadata`**: Chuẩn hóa metadata cho posts, accounts, groups theo Lens Metadata Standard v2.1.0
- **`@lens-chain/storage-client`**: Upload và retrieve data từ Lens decentralized storage (IPFS + Arweave)
- **`@slice/indexer`**: Code-generated GraphQL operations từ Lens Protocol API

#### 4.5.2. GraphQL Operations Generation
```bash
# packages/indexer/codegen.ts
# Generate TypeScript hooks từ GraphQL schema

pnpm run codegen

# Output: packages/indexer/generated.ts
# - useFollowMutation
# - useUnfollowMutation
# - useCreatePostMutation
# - useAccountQuery
# - ...300+ operations
```

**Workflow:**
```
1. Define GraphQL operation (e.g., Follow.graphql)
   ↓
2. Run codegen script
   ↓
3. Generated TypeScript hooks
   ↓
4. Use in components:
   const [follow] = useFollowMutation()
```

#### 4.5.3. Apollo Client Configuration
```typescript
// packages/indexer/apollo/client.ts
import { ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: LENS_API_ENDPOINT,  // "https://api-v2.lens.dev"
  cache: new InMemoryCache({
    typePolicies: {
      Account: {
        keyFields: ["address"]  // Cache by address
      },
      Post: {
        keyFields: ["id"]
      }
    }
  }),
  
  // Add auth token to requests
  link: authLink.concat(httpLink)
});
```

**Authentication Link:**
```typescript
const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();
  
  return {
    headers: {
      ...headers,
      "x-access-token": token || ""
    }
  };
});
```

#### 4.5.4. Lens Network Configuration
```typescript
// docker-compose.yml
environment:
  - LENS_NETWORK=staging    # "mainnet" | "staging"
  - HEY_API_URL=https://api.hey.xyz/

// packages/data/lens-endpoints.ts
export const LENS_API = IS_MAINNET
  ? "https://api-v2.lens.dev"
  : "https://api-v2-staging.lens.dev";
```

### 4.6. Security & Privacy (Social Features)

#### 4.6.1. Content Moderation
- **Report Post**: Người dùng có thể report nội dung vi phạm
- **Hide Reply**: Tác giả post có thể ẩn comments không phù hợp
- **Block Account**: Chặn user khác (không hiển thị content, không tương tác được)

```typescript
// Block user
const [block] = useBlockMutation({
  variables: {
    request: { account: userToBlock.address }
  }
});

// Report post
const [report] = useReportPostMutation({
  variables: {
    request: {
      post: postId,
      reason: "SPAM" | "HARASSMENT" | "MISLEADING"
    }
  }
});
```

#### 4.6.2. Privacy Controls
- **Managed Accounts**: Cho phép ủy quyền quản lý profile cho third-party app
- **Signless Transactions**: Pre-approve transactions để không cần sign mỗi lần interact
- **Hidden Accounts**: Ẩn managed accounts khỏi UI

```typescript
// Enable signless (gasless interactions)
const [enableSignless] = useEnableSignlessMutation({
  variables: {
    request: { 
      approval: true,
      deadline: futureTimestamp
    }
  }
});
```

---

## 5. KẾT LUẬN

### 5.1. Tổng kết Kiến trúc
Hệ thống triển khai thành công kiến trúc hybrid kết hợp:
- **Centralized backend**: Quản lý business logic, user data
- **Decentralized payments**: Smart contract escrow đảm bảo trust-minimized transactions
- **Decentralized social layer**: Lens Protocol cho identity, social graph, content ownership
- **Modern frontend**: React 19 + wagmi/viem cho UX mượt mà

### 5.2. Ưu điểm Nổi bật
1. **Bảo mật cao**: Smart contract escrow + Admin-controlled release
2. **Trải nghiệm tốt**: Employer không cần sign transaction cho release
3. **Minh bạch**: Mọi transaction verifiable on-chain
4. **Scalable**: Monorepo architecture dễ mở rộng
5. **Type-safe**: Full TypeScript từ frontend đến backend
6. **Decentralized Identity**: Lens Protocol cho identity portability (profile NFT)
7. **Social Graph Ownership**: User sở hữu follow/follower data trên blockchain
8. **Content Ownership**: Posts lưu trữ phi tập trung (IPFS/Arweave)
9. **Reputation System**: Trust-based economy với điểm uy tín minh bạch

### 5.3. Tích hợp Lens Protocol - Giá trị Gia tăng

**5.3.1. Decentralized Identity (DID)**
- User chỉ cần đăng nhập 1 lần với Lens profile để truy cập mọi app trong Lens ecosystem
- Profile data portable: switch app mà không mất danh tính, follow/follower
- NFT-based identity: Profile là NFT trên blockchain, user có full ownership

**5.3.2. Social Graph Portability**
- Follow/follower data lưu on-chain, không bị lock-in platform
- Mang social graph sang bất kỳ app Lens nào
- App developers dễ dàng bootstrap social features (không cần rebuild network effect)

**5.3.3. Content Monetization (Future)**
- **Collect Posts**: Users có thể "collect" (NFT mint) posts có giá trị
- **Tip Creators**: Gửi crypto tips cho freelancer giỏi
- **Gated Content**: Premium posts chỉ accessible cho followers hoặc collectors

**5.3.4. Composability**
- Lens modules có thể compose với nhau (Follow rules, Collect rules, Reference rules)
- Third-party developers có thể build modules mới (e.g., Task Completion Module)
- Hệ thống escrow có thể integrate với Lens Collect để auto-release khi collect NFT

### 5.4. Reputation System - Trust Economy

**5.4.1. Dual Metrics System**
```
┌─────────────────────────────────────────┐
│  USER TRUST METRICS                     │
├─────────────────────────────────────────┤
│  1. Reputation Score (0-100)            │
│     - Quality-based metric              │
│     - Affects task access & priority    │
│     - Decreases with poor performance   │
│                                          │
│  2. Reward Points (Accumulative)        │ ==> bỏ rewardpoint 
│     - Quantity-based metric             │
│     - Total earnings (never decreases)  │
│     - Used for platform benefits        │
└─────────────────────────────────────────┘
```

**5.4.2. Reputation Score Algorithm (Backend)**
```typescript
// Pseudo-code for reputation calculation
const calculateReputationScore = (user: User, taskCompletion: Task) => {
  let score = user.reputationScore;
  
  // Positive factors (+5 to +10)
  if (taskCompletion.rating >= 4) {
    score += (taskCompletion.rating - 3) * 5; // 5-10 points
  }
  
  if (taskCompletion.completedBeforeDeadline) {
    score += 3;
  }
  
  if (taskCompletion.revisionCount === 0) {
    score += 5; // No revisions needed
  }
  
  // Negative factors (-5 to -20)
  if (taskCompletion.rating <= 2) {
    score -= (3 - taskCompletion.rating) * 10; // -10 to -20
  }
  
  if (taskCompletion.revisionCount >= 3) {
    score -= 5; // Too many revisions
  }
  
  if (taskCompletion.completedAfterDeadline) {
    score -= 10;
  }
  
  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, score));
};
```

**5.4.3. Reputation Benefits Matrix**
```
Score Range  | Benefits
─────────────┼────────────────────────────────────────
90-100       | • Priority application selection
             | • Access to high-value tasks (>$1000)
             | • Featured in "Top Freelancers" section
             | • 5% bonus on rewards
─────────────┼────────────────────────────────────────
70-89        | • Normal task access
             | • Standard application priority
             | • No restrictions
─────────────┼────────────────────────────────────────
50-69        | • Limited high-value task access
             | • Lower application priority
             | • Warning notification
─────────────┼────────────────────────────────────────
0-49         | • Probation period (30 days)
             | • Only low-value tasks (<$100)
             | • Required improvement plan
             | • Account review after 30 days
```

**5.4.4. Transparency & Appeals**
- **Public Score Display**: Reputation score visible trên profile (builds trust)
- **History Tracking**: Chi tiết breakdown điểm tăng/giảm sau mỗi task
- **Appeal Process**: User có thể appeal nếu rating không fair
- **Employer Accountability**: Employer cũng có reputation score (future feature)

### 5.5. Roadmap Phát triển

**Phase 1** (Current - Q4 2025):
- ✅ Basic escrow + task management
- ✅ Lens Protocol authentication
- ✅ Reputation system v1
- ✅ Social features (follow/post)

**Phase 2** (Q1 2026):
- 🔄 Dispute resolution mechanism
- 🔄 Employer reputation system
- 🔄 Multi-milestone escrow
- 🔄 Advanced search & filters

**Phase 3** (Q2 2026):
- 📋 DAO governance cho admin decisions
- 📋 Community voting on disputes
- 📋 Token economics (platform utility token)
- 📋 Staking for reputation boost

**Phase 4** (Q3 2026):
- 📋 Cross-chain support (Polygon, Arbitrum)
- 📋 Lens Collect integration (NFT rewards)
- 📋 Premium features (gated by Collect)
- 📋 Advanced analytics dashboard

**Phase 5** (Q4 2026):
- 📋 AI-powered task matching
- 📋 Automated testing for submissions
- 📋 Decentralized storage for deliverables
- 📋 Mobile app (React Native)

### 5.6. Technical Debt & Future Improvements

**5.6.1. Backend API Coverage**
- [ ] Verify all documented endpoints exist (`/tasks/:id/confirm-deposit`, etc.)
- [ ] Add OpenAPI/Swagger documentation
- [ ] Implement rate limiting for admin endpoints
- [ ] Add webhook support for blockchain events

**5.6.2. Testing Coverage**
- [ ] Unit tests for React components (Vitest)
- [ ] Integration tests for escrow flow
- [ ] E2E tests with testnet (Playwright)
- [ ] Load testing for concurrent users

**5.6.3. Performance Optimization**
- [ ] Implement GraphQL query batching
- [ ] Add Redis caching for frequent queries
- [ ] Optimize image loading (lazy load, WebP format)
- [ ] Bundle size reduction (<500KB initial load)

**5.6.4. Security Enhancements**
- [ ] Smart contract audit by third-party
- [ ] Bug bounty program
- [ ] Add 2FA for admin actions
- [ ] Implement withdrawal limits & delays

---

**Tài liệu được tạo:** November 20, 2025  
**Phiên bản:** 2.0.0  
**Cập nhật:** Bổ sung SocialFi Module + Reputation System  
**Tác giả:** Technical Team - Slice Platform
