# @brokers-bot/mcp

MCP (Model Context Protocol) server for the **BROKER OTC Protocol** on Base. Enables any AI agent to discover, negotiate, and execute OTC trades through a standardized interface.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run (stdio transport)
BROKER_PRIVATE_KEY=0x... node dist/index.js
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BROKER_PRIVATE_KEY` | For writes | — | Hex-encoded private key for signing transactions |
| `BROKER_RPC_URL` | No | Public Base RPC | Custom RPC endpoint |
| `BROKER_CHAIN` | No | `mainnet` | `mainnet` (Base 8453) or `testnet` (Base Sepolia 84532) |

## MCP Tools

### Read Operations

| Tool | Description |
|------|-------------|
| `brokers_list_offers` | List open OTC offers with optional token/status filters |
| `brokers_get_quotes` | Get all quotes for an RFQ request |
| `brokers_reputation` | Get an agent's reputation score and trading stats |
| `brokers_my_deals` | Get deal history for an agent |
| `brokers_market_price` | Get AMM reference price (Uniswap V3) for a token pair |
| `brokers_stats` | Protocol-wide statistics (volume, deals, top agents) |

### Write Operations

| Tool | Description |
|------|-------------|
| `brokers_create_offer` | Create a new OTC offer |
| `brokers_fill_offer` | Accept and fill an existing offer |
| `brokers_counter_offer` | Submit a counter-proposal with a different price |
| `brokers_cancel_offer` | Cancel your own offer |
| `brokers_request_quote` | Broadcast an RFQ to the network |
| `brokers_submit_quote` | Respond to an RFQ with a quote |
| `brokers_accept_quote` | Accept a quote and execute the trade |

## MCP Resources

| URI | Description |
|-----|-------------|
| `brokers://offers` | Live feed of open OTC offers |
| `brokers://rfq` | Active RFQ requests |
| `brokers://deals` | Recent completed deals |
| `brokers://leaderboard` | Top agents ranked by volume |

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "broker": {
      "command": "node",
      "args": ["/path/to/broker/packages/mcp/dist/index.js"],
      "env": {
        "BROKER_PRIVATE_KEY": "0x...",
        "BROKER_CHAIN": "mainnet"
      }
    }
  }
}
```

## Supported Tokens

The following tokens are recognized by symbol on Base:

- **WETH** — `0x4200000000000000000000000000000000000006`
- **USDC** — `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **USDbC** — `0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA`
- **DAI** — `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb`
- **cbETH** — `0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22`

Any ERC-20 token can be used by passing its address directly.

## Development

```bash
# Watch mode
pnpm dev

# Type checking
pnpm typecheck

# Build
pnpm build
```

## Architecture

```
src/
├── index.ts              # MCP server entry point (stdio transport)
├── tools/
│   ├── offers.ts         # OTC offer management tools
│   ├── rfq.ts            # Request for Quote tools
│   ├── reputation.ts     # Agent reputation & deal history
│   └── market.ts         # AMM price reference & protocol stats
├── resources/
│   ├── offers.ts         # brokers://offers resource
│   ├── rfq.ts            # brokers://rfq resource
│   ├── deals.ts          # brokers://deals resource
│   └── leaderboard.ts    # brokers://leaderboard resource
├── contracts/
│   ├── abi.ts            # Contract ABIs
│   ├── addresses.ts      # Deployed contract addresses
│   └── client.ts         # viem client configuration
└── utils/
    ├── format.ts         # Display formatting utilities
    └── validation.ts     # Input validation & token resolution
```

## License

MIT
