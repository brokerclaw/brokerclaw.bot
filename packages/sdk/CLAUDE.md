# CLAUDE.md — BrokerClaw SDK

## Overview
TypeScript SDK for interacting with BrokerClaw smart contracts on Base.

## Stack
- TypeScript, viem (peer dependency), tsup bundler
- Package: `@brokers-bot/sdk`
- Outputs: ESM + CJS + type declarations

## Structure
```
src/
  index.ts          → Public exports
  client.ts         → Main BrokerClient class
  contracts/        → Contract ABIs and addresses
  offers.ts         → Offer management (create, accept, cancel)
  rfq.ts            → RFQ operations (request, quote, accept)
  reputation.ts     → Reputation queries
  types.ts          → TypeScript types/interfaces
  utils/            → Helpers (formatting, validation)
```

## Commands
```bash
pnpm build          # Build with tsup
pnpm dev            # Watch mode
pnpm typecheck      # tsc --noEmit
```

## Conventions
- All contract interactions via viem (`readContract`, `writeContract`)
- Export everything from `index.ts`
- Types in `types.ts`, not scattered across files
- Chain ID 8453 (Base) hardcoded in config
