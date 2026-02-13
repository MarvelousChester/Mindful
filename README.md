# Mindful App

A monorepo for the Mindful guided meditation platform, built with React, Express, TypeScript, and managed by pnpm workspaces.

## Prerequisites

- **Node.js** (v20 or later)
- **pnpm** (v10 or later)

### Install pnpm (if not installed)

```bash
npm install -g pnpm
```

## Setup

1. Clone the repository
```bash
git clone <repository-url>
cd mindful-app
```

2. Install dependencies
```bash
pnpm install
```

3. Approve build scripts (one-time setup)
```bash
pnpm approve-builds
```

## Development

### Start all services (frontend + backend)
```bash
pnpm dev
```
- Frontend runs on http://localhost:5173
- Backend runs on http://localhost:3001

### Start services individually

Frontend only:
```bash
pnpm dev:frontend
```

Backend only:
```bash
pnpm dev:backend
```

## Build

Build all packages:
```bash
pnpm build
```

## Clean

Remove all node_modules, build outputs, and prune pnpm store:
```bash
pnpm clean
```

## Project Structure

```
mindful-app/
├── apps/
│   ├── frontend/        # React + Vite + TypeScript
│   └── backend/         # Express + TypeScript
├── packages/
│   └── shared/          # Shared utilities and types
├── .gitignore
├── package.json         # Root workspace scripts
├── pnpm-workspace.yaml  # Workspace definition
└── vercel.json          # Deployment configuration
```

## Available Scripts

- `pnpm dev` - Start both frontend and backend in parallel
- `pnpm dev:frontend` - Start frontend dev server
- `pnpm dev:backend` - Start backend dev server
- `pnpm build` - Build all packages
- `pnpm clean` - Clean all dependencies and build outputs

## Deployment

This project is configured for Vercel deployment:

- Frontend deploys to the root
- Backend API routes are proxied under `/api/*`

## Environment Variables

Create `.env.local` files in respective app directories for local development (these files are gitignored).