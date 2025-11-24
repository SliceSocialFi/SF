# PHÂN TÍCH CẤU HÌNH LENS APP - SLICE PLATFORM

## MỤC LỤC
1. [Tổng quan](#1-tổng-quan)
2. [Cấu hình App Hey](#2-cấu-hình-app-hey)
3. [Lens SDK & Libraries](#3-lens-sdk--libraries)
4. [API Endpoints & Network](#4-api-endpoints--network)
5. [Authentication Flow](#5-authentication-flow)
6. [Client Configuration](#6-client-configuration)
7. [Storage & Upload](#7-storage--upload)
8. [Bảng Tổng hợp](#8-bảng-tổng-hợp)

---

## 1. TỔNG QUAN

Dự án này **KHÔNG tự tạo app mới** mà **sử dụng lại app Hey đã tồn tại** trên Lens Protocol. Hey là một social media app trên Lens với địa chỉ contract cố định trên cả Mainnet và Testnet.

### Kiến trúc Integration
```
┌─────────────────────────────────────────────────┐
│         Slice Platform (Frontend)               │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Uses Hey App Identity                    │  │
│  │  - App Address: 0x688... (Testnet)       │  │
│  │  - App Address: 0x1eFA... (Mainnet)      │  │
│  └───────────────────────────────────────────┘  │
│                     ↓                            │
│  ┌───────────────────────────────────────────┐  │
│  │  Lens Protocol GraphQL API                │  │
│  │  - Authentication (SIWE)                  │  │
│  │  - Profile Management                     │  │
│  │  - Social Graph (Follow/Posts)            │  │
│  └───────────────────────────────────────────┘  │
│                     ↓                            │
│  ┌───────────────────────────────────────────┐  │
│  │  Apollo Client                             │  │
│  │  - Auth Link (X-Access-Token)             │  │
│  │  - Retry Link                              │  │
│  │  - HTTP Link (api.lens.xyz)               │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ↓                    ↓
   ┌──────────────┐    ┌──────────────┐
   │ Lens Storage │    │ Custom Backend│
   │ (IPFS/Arweave)│   │ (Task System) │
   └──────────────┘    └──────────────┘
```

---

## 2. CẤU HÌNH APP SLICE

### 2.1. App Addresses (Contract Addresses)

#### File: `packages/data/contracts.ts`
```typescript
export const MAINNET_CONTRACTS = {
  app: "0x1eFA8F82d9E919F6b6A5f1701131c9Cb1a943BAA",
  defaultToken: "0x6bDc36E20D267Ff0dd6097799f82e78907105e2F",
  taskEscrowPool: "0x000000000000000000000000000000000000000000" // Not deployed yet
} as const;

export const TESTNET_CONTRACTS = {
  app: "0x688419B0299f3Ed8E80eBCa71ad05Ac23d20822b",
  defaultToken: "0x7326D8584c6b891B2f4B194CDF5ba746dD0D4080", // tRYF
  taskEscrowPool: "0x95207816564EB34b13De560a4F572b45e3001bc2"
} as const;
```

**Giải thích:**
- `app`: Địa chỉ contract của Hey app trên Lens Protocol
- Đây là **địa chỉ có sẵn**, không phải do dự án này tạo ra
- Mainnet app: `0x1eFA...BAA`
- Testnet app: `0x6884...22b`

### 2.2. Cấu hình Môi trường

#### File: `packages/data/utils/getEnvConfig.ts`
```typescript
const config = {
  mainnet: {
    appAddress: MAINNET_CONTRACTS.app,
    defaultCollectToken: MAINNET_CONTRACTS.defaultToken,
    chains: MAINNET_CHAINS,
    lensApiEndpoint: LENS_ENDPOINT.Mainnet
  },
  staging: {
    appAddress: TESTNET_CONTRACTS.app,
    defaultCollectToken: TESTNET_CONTRACTS.defaultToken,
    chains: TESTNET_CHAINS,
    lensApiEndpoint: LENS_ENDPOINT.Staging
  },
  testnet: {
    appAddress: TESTNET_CONTRACTS.app,
    defaultCollectToken: TESTNET_CONTRACTS.defaultToken,
    chains: TESTNET_CHAINS,
    lensApiEndpoint: LENS_ENDPOINT.Testnet
  }
} as const;

const getEnvConfig = (): Config => {
  return config[LENS_NETWORK as keyof typeof config] ?? config.mainnet;
};
```

**Logic:**
- Dựa vào biến môi trường `LENS_NETWORK` để chọn config
- Default: `mainnet` nếu không set
- `staging` và `testnet` dùng chung app address testnet

### 2.3. Export Constants

#### File: `packages/data/constants.ts`
```typescript
export const LENS_NETWORK = process.env.LENS_NETWORK || "mainnet";
export const LENS_API_URL = getEnvConfig().lensApiEndpoint;
export const SLICE_APP = getEnvConfig().appAddress;
export const IS_MAINNET = LENS_API_URL === LENS_ENDPOINT.Mainnet;
```

**Key Variables:**
- `SLICE_APP`: Địa chỉ app Hey (mainnet hoặc testnet)
- `LENS_API_URL`: GraphQL endpoint của Lens
- `IS_MAINNET`: Boolean để check environment
- `LENS_NETWORK`: Giá trị từ env variable

### 2.4. Docker Compose Configuration

#### File: `docker-compose.yml`
```yaml
services:
  web:
    environment:
      - LENS_NETWORK=staging
      - SLICE_API_URL=https://slice-api-indol.vercel.app/
```

**Current Setup:**
- Mặc định dùng **staging environment**
- Tương đương với testnet app address

---

## 3. LENS SDK & LIBRARIES

### 3.1. Thư viện Đang sử dụng

#### File: `apps/web/package.json`
```json
{
  "dependencies": {
    "@lens-chain/storage-client": "^1.0.6",
    "@lens-protocol/metadata": "^2.1.0",
    "@slice/indexer": "workspace:*"
  }
}
```

#### File: `packages/data/package.json`
```json
{
  "dependencies": {
    "@lens-chain/sdk": "^1.0.3"
  }
}
```

### 3.2. Chi tiết Thư viện

| Library | Version | Purpose | Usage |
|---------|---------|---------|-------|
| `@lens-protocol/metadata` | 2.1.0 | Lens Metadata Standard | Generate metadata cho posts, accounts, groups |
| `@lens-chain/storage-client` | 1.0.6 | Decentralized Storage | Upload files/metadata to IPFS/Arweave |
| `@lens-chain/sdk` | 1.0.3 | Lens Chain SDK | Chain configurations, utilities |
| `@slice/indexer` | workspace | GraphQL Operations | Code-generated hooks từ Lens API schema |

### 3.3. Import Patterns

#### Storage Client
```typescript
// File: apps/web/src/helpers/storageClient.ts
import { StorageClient } from "@lens-chain/storage-client";

export const storageClient = StorageClient.create();
```

#### Metadata Standard
```typescript
// File: apps/web/src/hooks/usePostMetadata.tsx
import { post as postMetadata } from "@lens-protocol/metadata";

const metadata = postMetadata({
  content: "...",
  attachments: [...],
  appId: SLICE_APP  // Hey app identifier
});
```

#### Chain SDK
```typescript
// File: packages/data/constants.ts
import { chains } from "@lens-chain/sdk/viem";

export const CHAIN = IS_MAINNET ? chains.mainnet : chains.testnet;
```

---

## 4. API ENDPOINTS & NETWORK

### 4.1. Lens API Endpoints

#### File: `packages/data/lens-endpoints.ts`
```typescript
export const LENS_ENDPOINT = {
  Mainnet: "https://api.lens.xyz/graphql",
  Staging: "https://api.staging.lens.xyz/graphql",
  Testnet: "https://api.testnet.lens.xyz/graphql"
} as const;
```

### 4.2. Network Configuration

#### File: `packages/data/chains.ts`
```typescript
export const TESTNET_CHAINS = {
  lensChain: {
    name: "Lens Chain Testnet",
    chainId: 37111,
    token: {
      name: "Testnet Rise Your Future",
      symbol: "tRYF",
      decimals: 18,
      address: "0x7326D8584c6b891B2f4B194CDF5ba746dD0D4080"
    },
    nativeToken: {
      name: "Grass",
      symbol: "GRASS",
      decimals: 18
    }
  },
  // ... BSC testnet config
};

export const MAINNET_CHAINS = {
  lensChain: {
    name: "Lens Chain",
    chainId: 232,
    token: {
      name: "Rise Your Future",
      symbol: "RYF",
      decimals: 18,
      address: "0x93198F5e56443286b50Cf749dFb6A27f251aA630"
    },
    nativeToken: {
      name: "GHO",
      symbol: "GHO",
      decimals: 18
    }
  },
  // ... BSC mainnet config
};
```

**Chain IDs:**
- Lens Testnet: `37111`
- Lens Mainnet: `232`
- BSC Testnet: `97`
- BSC Mainnet: `56`

### 4.3. HTTP Link Configuration

#### File: `packages/indexer/apollo/httpLink.ts`
```typescript
import { HttpLink } from "@apollo/client";
import { LENS_API_URL } from "@slice/data/constants";

const httpLink = new HttpLink({
  fetch,
  fetchOptions: "no-cors",
  headers: { origin: "https://hey.xyz" },
  uri: LENS_API_URL  // Dynamic based on LENS_NETWORK
});
```

**Note:** Header `origin: "https://hey.xyz"` để đảm bảo requests được Lens API accept.

---

## 5. AUTHENTICATION FLOW

### 5.1. Sign-In With Ethereum (SIWE)

#### Challenge Request
```typescript
// File: apps/web/src/components/Shared/Auth/Login.tsx

const handleSign = async (account: string) => {
  // Step 1: Request challenge
  const challenge = await loadChallenge({
    variables: {
      request: {
        accountOwner: {
          owner: address,      // Wallet address
          account: account,    // Lens profile address
          app: IS_MAINNET ? SLICE_APP : undefined  // Hey app (only on mainnet)
        }
      }
    }
  });
  
  // Step 2: Sign challenge
  const signature = await signMessageAsync({
    message: challenge.data.challenge.text
  });
  
  // Step 3: Authenticate
  const auth = await authenticate({
    variables: {
      request: {
        id: challenge.data.challenge.id,
        signature: signature
      }
    }
  });
  
  // Step 4: Store tokens
  const { accessToken, refreshToken } = auth.data.authenticate;
  signIn({ accessToken, refreshToken });
};
```

**GraphQL Mutations:**
```graphql
# File: packages/indexer/documents/mutations/auth/Challenge.graphql
mutation Challenge($request: ChallengeRequest!) {
  challenge(request: $request) {
    id
    text
  }
}

# File: packages/indexer/documents/mutations/auth/Authenticate.graphql
mutation Authenticate($request: SignedAuthChallenge!) {
  authenticate(request: $request) {
    ... on AuthenticationTokens {
      accessToken
      refreshToken
    }
  }
}
```

### 5.2. Authentication Link

#### File: `apps/web/src/helpers/authLink.ts`
```typescript
import { ApolloLink, fromPromise, toPromise } from "@apollo/client";

const authLink = new ApolloLink((operation, forward) => {
  const { accessToken, refreshToken } = hydrateAuthTokens();
  
  // Check if token is expiring soon
  const isExpiringSoon = isTokenExpiringSoon(accessToken);
  
  if (!isExpiringSoon) {
    // Add token to headers
    operation.setContext({
      headers: { "X-Access-Token": accessToken }
    });
    return forward(operation);
  }
  
  // Refresh token if expiring
  return fromPromise(
    refreshTokens(refreshToken)
      .then((newAccessToken) => {
        operation.setContext({
          headers: { "X-Access-Token": newAccessToken }
        });
        return toPromise(forward(operation));
      })
  );
});
```

**Header Format:**
- Lens API sử dụng: `X-Access-Token: <JWT>`
- Backend custom API sử dụng: `Authorization: Bearer <JWT>`

---

## 6. CLIENT CONFIGURATION

### 6.1. Apollo Client Setup

#### File: `packages/indexer/apollo/client.ts`
```typescript
import { ApolloClient, from } from "@apollo/client";
import cache from "./cache";
import httpLink from "./httpLink";
import retryLink from "./retryLink";

export const createApolloClient = (authLink?: ApolloLink) =>
  new ApolloClient({
    cache,
    connectToDevTools: true,
    link: authLink
      ? from([authLink, retryLink, httpLink])
      : from([retryLink, httpLink])
  });
```

**Link Chain:**
```
Request → authLink (add JWT) → retryLink (retry on failure) → httpLink (send to API)
```

### 6.2. Providers Configuration

#### File: `apps/web/src/components/Common/Providers/index.tsx`
```typescript
import { createApolloClient } from "@slice/indexer/apollo/client";
import authLink from "@/helpers/authLink";

const lensApolloClient = createApolloClient(authLink);

const Providers = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <ApolloProvider client={lensApolloClient}>
            <HelmetProvider>
              <ThemeProvider>{children}</ThemeProvider>
            </HelmetProvider>
          </ApolloProvider>
        </Web3Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
```

**Provider Hierarchy:**
```
ErrorBoundary
└─ QueryClientProvider (React Query)
   └─ Web3Provider (wagmi)
      └─ ApolloProvider (Lens GraphQL)
         └─ HelmetProvider (HTML head)
            └─ ThemeProvider (Dark/Light mode)
```

### 6.3. Web3 Provider (Wagmi)

#### File: `apps/web/src/components/Common/Providers/Web3Provider.tsx`
```typescript
import { CHAIN, IS_MAINNET, WALLETCONNECT_PROJECT_ID } from "@slice/data/constants";
import { familyAccountsConnector } from "family";
import { createConfig, WagmiProvider } from "wagmi";

const connectors = [
  familyAccountsConnector(),      // Lens family accounts
  walletConnect({ projectId }),   // WalletConnect
  injected()                       // MetaMask, etc.
];

const BSC_CHAIN = IS_MAINNET ? bsc : bscTestnet;

const config = createConfig({
  chains: [CHAIN, BSC_CHAIN],  // Lens + BSC for bridge
  connectors,
  transports: {
    [CHAIN.id]: getRpc({ chainId: CHAIN.id }),
    [BSC_CHAIN.id]: getRpc({ chainId: BSC_CHAIN.id })
  }
});
```

**Supported Wallets:**
1. **Family Accounts**: Lens-specific account abstraction
2. **WalletConnect**: Mobile wallets via QR code
3. **Injected**: MetaMask, Brave Wallet, etc.

---

## 7. STORAGE & UPLOAD

### 7.1. Storage Client

#### File: `apps/web/src/helpers/storageClient.ts`
```typescript
import { StorageClient } from "@lens-chain/storage-client";

export const storageClient = StorageClient.create();
```

### 7.2. Upload Metadata

#### File: `apps/web/src/helpers/uploadMetadata.ts`
```typescript
import { immutable } from "@lens-chain/storage-client";
import { CHAIN } from "@slice/data/constants";

const uploadMetadata = async (data: MetadataPayload): Promise<string> => {
  const { uri } = await storageClient.uploadAsJson(data, {
    acl: immutable(CHAIN.id)  // Immutable storage for chain
  });
  
  return uri;  // Returns: "lens://abc123..."
};
```

### 7.3. Upload to IPFS

#### File: `apps/web/src/helpers/uploadToIPFS.ts`
```typescript
import { immutable } from "@lens-chain/storage-client";
import { CHAIN, EVER_API, EVER_BUCKET } from "@slice/data/constants";

const uploadToIPFS = async (data: FileList | File[]): Promise<UploadResult[]> => {
  const files = Array.from(data) as File[];
  const FILE_SIZE_LIMIT = 8 * 1024 * 1024; // 8MB
  
  // Small files (<8MB): Upload to Grove (Lens storage)
  // Large files (>8MB): Upload to 4EVERLAND S3
  
  const attachments = await Promise.all(
    files.map(async (file: File) => {
      if (file.size <= FILE_SIZE_LIMIT) {
        // Upload to Lens storage
        const response = await storageClient.uploadFile(file, {
          acl: immutable(CHAIN.id)
        });
        return { mimeType: file.type, uri: response.uri };
      } else {
        // Upload to S3 (4EVERLAND)
        const s3Client = await getS3Client();
        const upload = new Upload({ client: s3Client, params });
        await upload.done();
        const result = await s3Client.headObject(params);
        const cid = result.Metadata?.["ipfs-hash"];
        return { mimeType: file.type, uri: `ipfs://${cid}` };
      }
    })
  );
  
  return attachments;
};
```

**Storage Strategy:**
- **< 8MB**: Lens Storage (Grove) → `lens://...`
- **≥ 8MB**: 4EVERLAND S3 → IPFS → `ipfs://...`

---

## 8. BẢNG TỔNG HỢP

### 8.1. Vị trí File - Vai trò - Cách App Hey được dùng

| Vị trí File | Vai trò | Cách App Hey được dùng | Code Snippet |
|-------------|---------|------------------------|--------------|
| `packages/data/contracts.ts` | **Khai báo địa chỉ app** | Lưu trữ contract address của Hey app (mainnet + testnet) | `app: "0x688419B0299f3Ed8E80eBCa71ad05Ac23d20822b"` |
| `packages/data/utils/getEnvConfig.ts` | **Environment configuration** | Map `LENS_NETWORK` → app address tương ứng | `appAddress: TESTNET_CONTRACTS.app` |
| `packages/data/constants.ts` | **Export global constants** | Export `SLICE_APP` để dùng trong toàn bộ app | `export const SLICE_APP = getEnvConfig().appAddress` |
| `apps/web/src/components/Shared/Auth/Login.tsx` | **Authentication** | Pass `SLICE_APP` vào challenge request (chỉ trên mainnet) | `app: IS_MAINNET ? SLICE_APP : undefined` |
| `apps/web/src/components/Shared/Auth/Signup/ChooseUsername.tsx` | **Signup flow** | Pass `SLICE_APP` vào challenge khi tạo username | `app: IS_MAINNET ? SLICE_APP : undefined` |
| `apps/web/src/hooks/usePostMetadata.tsx` | **Post metadata generation** | Add `appId: SLICE_APP` vào post metadata | `postMetadata({ content, appId: SLICE_APP })` |
| `packages/indexer/apollo/httpLink.ts` | **GraphQL HTTP Link** | Thêm header `origin: "https://hey.xyz"` để API accept requests | `headers: { origin: "https://hey.xyz" }` |
| `apps/web/src/helpers/authLink.ts` | **Authentication middleware** | Thêm JWT token vào mọi GraphQL request | `headers: { "X-Access-Token": accessToken }` |
| `apps/web/src/helpers/storageClient.ts` | **Decentralized storage** | Khởi tạo Lens storage client để upload files/metadata | `StorageClient.create()` |
| `apps/web/src/helpers/uploadMetadata.ts` | **Metadata upload** | Upload post metadata to Lens storage với ACL cho chain | `storageClient.uploadAsJson(data, { acl: immutable(CHAIN.id) })` |
| `apps/web/src/components/Common/Providers/index.tsx` | **Root providers** | Khởi tạo Apollo client với authLink để connect Lens API | `createApolloClient(authLink)` |
| `apps/web/src/components/Common/Providers/Web3Provider.tsx` | **Wallet connection** | Configure wagmi với Lens chain + BSC chain | `chains: [CHAIN, BSC_CHAIN]` |
| `docker-compose.yml` | **Docker environment** | Set `LENS_NETWORK=staging` để dùng testnet app | `LENS_NETWORK=staging` |

### 8.2. App Hey trong Logic Chính

| Feature | Cách sử dụng App Hey | File liên quan |
|---------|---------------------|----------------|
| **Login** | Pass `SLICE_APP` vào challenge request để xác thực với Hey app context | `Auth/Login.tsx` |
| **Signup** | Pass `SLICE_APP` vào challenge khi tạo account mới | `Auth/Signup/ChooseUsername.tsx` |
| **Create Post** | Add `appId: SLICE_APP` vào post metadata để đánh dấu post thuộc Hey app | `hooks/usePostMetadata.tsx` |
| **Follow/Unfollow** | GraphQL mutations tự động dùng authenticated session (có context của Hey app) | `Account/Follow.tsx`, `Account/Unfollow.tsx` |
| **Feed** | Query posts từ Lens API, filter theo app nếu cần | `Home/Feed.tsx` (implicit) |
| **Profile** | Load user profile từ Lens, không cần explicit app reference | `Account/UserProfilePage.tsx` |
| **API Requests** | Mọi GraphQL request đều có `X-Access-Token` (JWT được issue cho Hey app) | `helpers/authLink.ts` |
| **Storage** | Upload files/metadata to Lens storage với chain ACL | `helpers/uploadToIPFS.ts` |

### 8.3. Environment Variables Summary

| Variable | Values | Current Default | Set In |
|----------|--------|-----------------|--------|
| `LENS_NETWORK` | `mainnet` \| `staging` \| `testnet` | `mainnet` (code) <br> `staging` (docker) | `process.env.LENS_NETWORK` |
| `SLICE_APP` | Auto from `LENS_NETWORK` | Testnet: `0x6884...22b` <br> Mainnet: `0x1eFA...BAA` | `getEnvConfig().appAddress` |
| `LENS_API_URL` | Auto from `LENS_NETWORK` | Staging: `https://api.staging.lens.xyz/graphql` | `getEnvConfig().lensApiEndpoint` |
| `IS_MAINNET` | Boolean | `false` (using staging) | `LENS_API_URL === LENS_ENDPOINT.Mainnet` |

---

## 9. KẾT LUẬN

### 9.1. App Hey không được tạo mới

**Quan trọng:** Dự án này **KHÔNG tạo app Hey mới** bằng `createApp` mutation. Thay vào đó:
- Sử dụng **app Hey đã tồn tại** với địa chỉ cố định
- Mainnet: `0x1eFA8F82d9E919F6b6A5f1701131c9Cb1a943BAA`
- Testnet: `0x688419B0299f3Ed8E80eBCa71ad05Ac23d20822b`

### 9.2. Namespace & Feed Configuration

**Dự án hiện tại KHÔNG custom:**
- ❌ Custom namespace
- ❌ Custom feed
- ❌ Custom graph
- ✅ Dùng **globalFeed** và **globalGraph** của Lens Protocol
- ✅ App Hey context được pass vào challenge request (mainnet only)

### 9.3. Session Client vs Builder Client

**Dự án KHÔNG dùng:**
- ❌ `SessionClient` (Lens SDK v1/v2)
- ❌ `BuilderClient` (Lens SDK v1/v2)

**Dự án dùng:**
- ✅ **Apollo Client** với **authLink** middleware
- ✅ **GraphQL Code Generation** (`@slice/indexer`)
- ✅ **wagmi** cho wallet connection
- ✅ **@lens-chain/storage-client** cho IPFS/Arweave uploads

### 9.4. Cách App Hey được dùng trong logic

```typescript
// 1. Authentication (Login/Signup)
challenge(request: {
  accountOwner: {
    owner: walletAddress,
    account: profileAddress,
    app: SLICE_APP  // Only on mainnet
  }
})

// 2. Post Creation
postMetadata({
  content: "...",
  appId: SLICE_APP  // Mark post as created via Hey
})

// 3. GraphQL Requests
headers: {
  "X-Access-Token": jwt,  // JWT issued for Hey app context
  "origin": "https://hey.xyz"
}

// 4. Storage Uploads
storageClient.uploadAsJson(metadata, {
  acl: immutable(CHAIN.id)  // Chain-specific ACL
})
```

### 9.5. Điểm đặc biệt

1. **App ID chỉ dùng trên Mainnet:**
   ```typescript
   app: IS_MAINNET ? SLICE_APP : undefined
   ```
   - Testnet/Staging: `app` field = `undefined`
   - Mainnet: `app` field = `0x1eFA...BAA`

2. **Origin header:**
   ```typescript
   headers: { origin: "https://hey.xyz" }
   ```
   - Đảm bảo Lens API accept requests
   - Giả lập như requests từ Hey website

3. **Dual authentication:**
   - Lens API: `X-Access-Token: <JWT>`
   - Custom Backend: `Authorization: Bearer <JWT>`

4. **Storage tiering:**
   - Small files (<8MB): Lens Storage → `lens://...`
   - Large files (≥8MB): 4EVERLAND S3 → `ipfs://...`

---

**Tài liệu được tạo:** November 20, 2025  
**Phiên bản:** 1.0.0  
**Tác giả:** Technical Analysis Team - Slice Platform
