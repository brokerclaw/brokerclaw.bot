# CLAUDE.md — BrokerClaw Monorepo

## Project Overview
BrokerClaw (brokerclaw.bot) — Decentralized OTC trading protocol for AI agents on Base L2.
Agents negotiate peer-to-peer trades, escrow locks funds, atomic settlement. Zero slippage, zero front-running.

## Architecture
```
apps/
  web/          → SvelteKit 5 frontend (Svelte 5 runes, Tailwind, viem)
packages/
  contracts/    → Solidity smart contracts (Foundry, Solc 0.8.28)
  sdk/          → TypeScript SDK (@brokers-bot/sdk, viem)
  mcp/          → MCP server for AI agent integration
  e2e/          → End-to-end tests (vitest)
```

## Tech Stack
- **Monorepo:** pnpm workspaces + Turborepo
- **Chain:** Base L2 (EVM, chain ID 8453)
- **Contracts:** Solidity 0.8.28, Foundry, OpenZeppelin
- **Frontend:** SvelteKit 2, Svelte 5 (runes syntax: `$state`, `$derived`, `$props`), Tailwind CSS 3
- **SDK/MCP:** TypeScript, viem, tsup
- **Tests:** vitest (e2e), forge test (contracts)
- **Node:** >=20, pnpm 9.15

## Key Commands
```bash
pnpm install          # Install all dependencies
pnpm dev              # Dev all packages (turbo)
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm test:e2e         # Run e2e tests only

# Contracts (from packages/contracts/)
forge build           # Compile contracts
forge test            # Run contract tests
forge fmt             # Format Solidity

# Web (from apps/web/)
pnpm dev              # SvelteKit dev server
pnpm build            # Static build
pnpm check            # Svelte type checking
```

## Smart Contracts
- **BrokerEscrow.sol** — Escrow & atomic settlement (ERC20 + ETH)
- **BrokerRFQ.sol** — Request For Quote matching system
- **BrokerReputation.sol** — On-chain reputation (ERC-8004 inspired)
- Uses OpenZeppelin via Foundry remapping: `@openzeppelin/contracts/`

## Conventions
- Commit as `captainclaw-bot` (configured globally)
- Remote: `git@github.com:brokerclaw/brokerclaw.bot.git`
- Svelte 5 runes syntax — no `export let`, use `let { x } = $props()`
- UI theme: retro neon synthwave (deep purple, neon pink/cyan/orange)
- Fonts: Orbitron (display), Rajdhani (body), JetBrains Mono (code)
- Package names still use `@brokers-bot/*` scope (legacy, may rename)

## Important Notes
- Contracts use Foundry submodules for deps (forge-std, openzeppelin) — run `forge install` after clone
- Frontend uses static adapter — no SSR
- All contract ABIs are mirrored in `apps/web/src/lib/contracts/abi.ts`
- SDK is a workspace dependency of e2e tests
