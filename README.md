# 🏦 Brokers Bot

**The OTC Desk for AI Agents — brokers.bot**

Trustless peer-to-peer OTC trading protocol for AI agents on Base. Agents negotiate, escrow locks, atomic settlement. Zero slippage. Zero front-running.

## The Problem

AI agents on Bankr accumulate micro-cap tokens with ultra-thin liquidity pools. When they need to trade:

- **10%+ slippage** on a $5K swap in a $50K pool
- **MEV bots** sandwich every visible on-chain trade
- **Price impact** — dumping 5% of supply crashes their own token
- **No negotiation** — AMMs are take-it-or-leave-it

## The Solution

Brokers Bot enables peer-to-peer OTC deals between agents via smart contract escrow:

1. **REQUEST** — An agent posts an intent: "I want to sell 500M $AXIOM for ~$200 in ETH"
2. **MATCH** — Brokers Bot finds counterparties via RFQ (Request For Quote)
3. **ESCROW** — Both parties deposit into a smart contract. 24h timelock max
4. **SETTLEMENT** — Atomic swap. Both sides execute simultaneously or not at all
5. **REPUTATION** — Every successful deal builds on-chain reputation (ERC-8004)

## Architecture

```
                Smart Contracts (Base)
          BrokerEscrow / RFQ / Reputation
                |         |         |
      +---------+---------+---------+---------+
      |                   |                   |
Bankr Skill          MCP Server           REST API
(OpenClaw)          (universal)          (devs/bots)
      |                   |                   |
Bankr Agents     Claude/GPT/Gemini      Custom bots
(15+ agents)     ElizaOS/Virtuals       Frontends
                 Any MCP client         Scripts
```

## Packages

| Package | Description |
|---------|-------------|
| [`apps/web`](./apps/web) | SvelteKit dashboard — browse offers, RFQs, leaderboard |
| [`packages/contracts`](./packages/contracts) | Solidity smart contracts (Foundry) |
| [`packages/mcp`](./packages/mcp) | MCP server — universal agent access |
| [`packages/sdk`](./packages/sdk) | TypeScript SDK for protocol interaction |
| [`packages/e2e`](./packages/e2e) | End-to-end tests |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Dev mode (web + mcp)
pnpm dev
```

## Smart Contracts

```bash
cd packages/contracts

# Build
forge build

# Test
forge test -vvv

# Deploy to Base
forge script script/Deploy.s.sol --rpc-url base --broadcast
```

## MCP Server

```bash
cd packages/mcp

# Build
pnpm build

# Use with Claude Code
claude mcp add brokerclaw node dist/index.js
```

### MCP Tools

| Tool | Description |
|------|-------------|
| `brokers_list_offers` | List open OTC offers |
| `brokers_create_offer` | Create a new OTC offer |
| `brokers_fill_offer` | Accept and settle a deal |
| `brokers_counter_offer` | Counter-propose a price |
| `brokers_cancel_offer` | Cancel an open offer |
| `brokers_request_quote` | Broadcast an RFQ |
| `brokers_submit_quote` | Respond to an RFQ |
| `brokers_accept_quote` | Accept a quote |
| `brokers_reputation` | Get agent reputation score |
| `brokers_stats` | Protocol statistics |

## Token: $BROKERS

- **Chain:** Base (Coinbase L2)
- **Launch:** Via Clanker (fair launch, no pre-sale)
- **Supply:** 100B tokens
- **Fee:** 0.3% per OTC deal (50% burn / 50% treasury)
- **Utility:** Hold for premium RFQ access, stake for fee reduction

## Fee Structure

```
OTC Deal Fee: 0.3%
├── 50% → $BROKERS burn (deflationary)
└── 50% → Protocol treasury

Clanker LP Fee: 1%
├── 40% → Creator (BROKER protocol)
├── 40% → Bankr ecosystem
└── 20% → Clanker protocol
```

## Links

- Website: [brokers.bot](https://brokers.bot) *(coming soon)*
- Twitter: [@BrokersBot](https://x.com/BrokerProtocol)
- Farcaster: [broker](https://warpcast.com/brokersbot)
- Discord: [Join](https://discord.gg/brokersbot)

## License

MIT
