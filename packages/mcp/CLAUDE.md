# CLAUDE.md — BrokerClaw MCP Server

## Overview
Model Context Protocol server that exposes BrokerClaw OTC operations as tools for AI agents.

## Stack
- TypeScript, @modelcontextprotocol/sdk, viem, zod
- Package: `@brokers-bot/mcp`
- Binary: `broker-mcp`

## Structure
```
src/
  index.ts          → MCP server entry point
  contracts/        → Contract ABIs and addresses
  tools/            → MCP tool definitions (create offer, accept, RFQ, etc.)
  resources/        → MCP resource definitions (market data, reputation)
  utils/            → Helpers
```

## Commands
```bash
pnpm build          # Build with tsup
pnpm dev            # Watch mode (tsx)
pnpm start          # Run server
pnpm typecheck      # tsc --noEmit
```

## Conventions
- All tool inputs validated with zod schemas
- Tools should be atomic — one action per tool
- Resources for read-only data (prices, stats, reputation)
- Tools for state-changing operations (create offer, accept deal)
