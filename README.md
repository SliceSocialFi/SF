# Slice Platform - Freelance Task Management on Lens Protocol

A decentralized freelance platform built on Lens Protocol with integrated escrow smart contracts for secure payments.

## 📚 Documentation

Comprehensive technical documentation is available in the [`/docs`](./docs) folder:

- **[docs/README.md](./docs/README.md)** - Documentation index and navigation guide
- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - Complete system architecture
- **[TASK_BACKEND_INTEGRATION.md](./apps/web/TASK_BACKEND_INTEGRATION.md)** - API integration guide
- **[NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)** - Notification system architecture
- **[TASK_DETAIL_NAVIGATION.md](./TASK_DETAIL_NAVIGATION.md)** - Task detail page implementation

## Requirements

To start working with the Slice platform, ensure the following tools are installed:

- [Node.js](https://nodejs.org/en/download/) (v20 or higher) – see `.nvmrc` for exact version
- [pnpm](https://pnpm.io/installation) (v10) – the package manager used throughout this repository
- [Postgres App](https://postgresapp.com/) – the Postgres database used in development (if running backend locally)

## Installation

This repository uses [pnpm workspaces](https://pnpm.io/workspaces) to manage multiple packages within a monorepo structure.

### Clone the Repository

```bash
git clone https://github.com/goby35/SF.git
cd SF
```

### Install NVM and pnpm

On macOS, you can install both with Homebrew:

```bash
brew install nvm pnpm
```

### Install Node.js

Use `nvm` to install the required Node.js version:

```bash
nvm install
```

### Install Dependencies

From the repository root, install dependencies with pnpm:

```bash
pnpm install
```

### Set up Environment Variables

Copy the `.env.example` file to `.env` for each package or application that requires configuration:

```bash
cp .env.example .env
```

Repeat this process for all relevant packages and applications in the monorepo.

### Environment Variables

The example environment files define the following variables:

#### Web (`apps/web/.env.example`)

- `VITE_LENS_NETWORK` – Lens network used by the web app (`mainnet`, `testnet`, or `staging`)
- `VITE_SLICE_API_URL` – Backend API URL (e.g., `https://slice-api-indol.vercel.app`)
- `VITE_WALLETCONNECT_PROJECT_ID` – WalletConnect project ID for Web3 wallet connections

For detailed API integration, see [TASK_BACKEND_INTEGRATION.md](./apps/web/TASK_BACKEND_INTEGRATION.md).

### Start the Development Server

To run the application in development mode:

```bash
pnpm dev
```

## Build

### Build the application

Compile the application:

```bash
pnpm build
```

### Type-check the project

Validate the codebase with the TypeScript type checker:

```bash
pnpm typecheck
```

### Lint and Format Code

Check code quality and formatting with Biome:

```bash
pnpm biome:check
```

Automatically fix linting and formatting issues:

```bash
pnpm biome:fix
```

### Maintenance Scripts

Convenient Node.js helpers are in the `script` directory:

- `node script/clean.mjs` - removes all `node_modules`, `.next` directories, `pnpm-lock.yaml`, and `tsconfig.tsbuildinfo` files
- `node script/update-dependencies.mjs` - updates packages across the monorepo, removes old installs and commits changes in a new branch
- `node script/sort-package-json.mjs` - sorts all `package.json` files in the repository
- `node script/clean-branches.mjs` - cleans up local git branches

## Project Structure

```
SF/
├── apps/
│   └── web/              # React 19 + Vite frontend application
│       ├── src/
│       │   ├── components/    # React components (Tasks, Escrow, Notifications)
│       │   ├── hooks/         # Custom hooks (useEscrow, useWallet)
│       │   ├── store/         # Zustand state management
│       │   └── lib/           # API client, utilities
│       └── TASK_BACKEND_INTEGRATION.md
├── packages/
│   ├── config/           # Shared TypeScript configs
│   ├── data/             # Constants, ABIs, contracts, chains
│   ├── helpers/          # Utility functions
│   ├── indexer/          # GraphQL operations & Apollo setup
│   └── types/            # Shared TypeScript types
├── docs/                 # 📚 Technical documentation
│   ├── README.md         # Documentation index
│   ├── BACKEND_RELEASE_AFTER_DEADLINE_IMPLEMENTATION.md
│   └── RELEASE_AFTER_DEADLINE_API_REDESIGN.md
├── script/               # Maintenance scripts
└── TECHNICAL_DOCUMENTATION.md  # Complete system architecture
```

## Key Features

### 🎯 Task Management
- Create, browse, and apply for freelance tasks
- Application workflow (submit, accept, reject, request revision)
- Task status tracking (open, in_progress, completed, cancelled)

### 💰 Escrow Smart Contract
- Secure fund deposits using TaskEscrowPool contract
- Permissionless release after deadline
- Admin-controlled release on approval
- Full transaction history

### 🔔 Notification System
- Real-time polling for unread count
- Task notifications (application received, work submitted, approved, etc.)
- Mark as read functionality
- Page-based pagination

### 🔗 Lens Protocol Integration
- Built on Lens social graph
- SIWE authentication
- Profile management
- Decentralized storage (IPFS/Arweave)

## Smart Contracts

| Network | Contract | Address |
|---------|----------|---------|
| Lens Testnet | TaskEscrowPool | `0x95207816564EB34b13De560a4F572b45e3001bc2` |
| Lens Testnet | Token (tRYF) | `0x7326D8584c6b891B2f4B194CDF5ba746dD0D4080` |
| Lens Mainnet | TaskEscrowPool | TBD |
| Lens Mainnet | Token (RYF) | `0x6bDc36E20D267Ff0dd6097799f82e78907105e2F` |

See [packages/data/contracts.ts](./packages/data/contracts.ts) for complete contract addresses.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand, React Query
- **Web3:** Wagmi 2.17, Viem 2.37
- **GraphQL:** Apollo Client, GraphQL Codegen
- **Blockchain:** Lens Protocol (Testnet/Mainnet)
- **Formatting:** Biome

## Contributing

See [AGENTS.md](./AGENTS.md) for repository guidelines, coding style, and commit conventions.

## License

This project is released under the **GNU AGPL-3.0** license. See the [LICENSE](./LICENSE) file for details.
