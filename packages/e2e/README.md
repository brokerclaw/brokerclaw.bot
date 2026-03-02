# @bankers-bot/e2e

End-to-end tests for the **Bankers Bot OTC Protocol** on Base.

## Prerequisites

- Node.js >= 18
- [Anvil](https://book.getfoundry.sh/anvil/) from Foundry (for local chain fork)

## Setup

```bash
# From the monorepo root
pnpm install

# Start a local Anvil instance (forked from Base)
anvil --fork-url https://mainnet.base.org --chain-id 31337

# Or run without fork (for mock contract testing)
anvil
```

## Running Tests

```bash
# Run all e2e tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run a specific test file
pnpm vitest run tests/offer-lifecycle.test.ts
```

## Test Structure

| Test File | Description |
|-----------|-------------|
| `offer-lifecycle.test.ts` | Full offer flow: create → fill → verify |
| `rfq-flow.test.ts` | RFQ: request → quote → accept → settle |
| `counter-offer.test.ts` | Counter-offer negotiation flow |
| `reputation.test.ts` | Reputation scoring after deals |
| `cancellation.test.ts` | Cancel flows + edge cases |
| `fees.test.ts` | Fee collection, burn, treasury split |
| `expiry.test.ts` | Expired offers/quotes handling |
| `multi-agent.test.ts` | Multiple agents trading simultaneously |
| `mcp-integration.test.ts` | MCP server tool calls (mock server) |

## Architecture

Tests use:
- **viem** for blockchain interaction
- **Anvil** as the local test chain (Foundry)
- **vitest** as the test runner
- **@bankers-bot/sdk** for protocol interaction

### Test Accounts

The tests use Anvil's default accounts:

| Role | Address |
|------|---------|
| Deployer | `0xf39F...2266` |
| Maker | `0x7099...79C8` |
| Taker | `0x3C44...93BC` |
| Agent 3 | `0x90F7...3906` |
| Agent 4 | `0x15d3...6A65` |
| Treasury | `0x9965...A4dc` |

### Mock Contracts

The test setup deploys mock ERC-20 tokens and protocol contracts to Anvil.
For production testing, replace the mock bytecodes with actual compiled Solidity contracts.

## License

MIT
