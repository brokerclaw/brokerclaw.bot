# @brokerclaw/sdk

TypeScript SDK for the **Brokers Bot OTC Protocol** on Base.

## Installation

```bash
pnpm add @brokerclaw/sdk viem
```

## Quick Start

```typescript
import { BrokerClient } from "@brokerclaw/sdk";
import { createPublicClient, createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// Read-only client
const publicClient = createPublicClient({ chain: base, transport: http() });
const broker = new BrokerClient({ publicClient });

// Read+write client
const account = privateKeyToAccount("0x...");
const walletClient = createWalletClient({
  chain: base,
  transport: http(),
  account,
});
const brokerRW = new BrokerClient({ publicClient, walletClient });
```

## Offers

```typescript
// Create an offer
const { offerId, hash } = await broker.createOffer({
  sellToken: "0x...",
  buyToken: "0x...",
  sellAmount: parseEther("100"),
  buyAmount: parseEther("50"),
});

// Fill an offer
await broker.fillOffer({ offerId: 1n });

// Cancel an offer
await broker.cancelOffer(1n);

// Counter-offer
await broker.counterOffer({
  originalOfferId: 1n,
  sellToken: "0x...",
  buyToken: "0x...",
  sellAmount: parseEther("60"),
  buyAmount: parseEther("100"),
});

// List & filter offers
const offers = await broker.listOffers({ maker: "0x..." });
const offer = await broker.getOffer(1n);
```

## RFQ (Request for Quote)

```typescript
// Request a quote
const { rfqId } = await broker.requestQuote({
  sellToken: "0x...",
  buyToken: "0x...",
  sellAmount: parseEther("100"),
});

// Submit a quote
const { quoteId } = await broker.submitQuote({
  rfqId: 1n,
  buyAmount: parseEther("50"),
});

// Accept a quote
await broker.acceptQuote({ quoteId: 1n });
```

## Reputation

```typescript
const rep = await broker.getReputation("0x...");
const leaderboard = await broker.getLeaderboard(0n, 10n);
const stats = await broker.getStats();
```

## Utilities

```typescript
import {
  formatTokenAmount,
  parseTokenAmount,
  calculateFee,
  formatBps,
  isExpired,
  formatOfferSummary,
} from "@brokerclaw/sdk";

formatTokenAmount(1000000000000000000n); // "1.0"
calculateFee(1000n, 30n); // 3n (0.3%)
formatBps(250n); // "2.50%"
```

## Custom Addresses

```typescript
const broker = new BrokerClient({ publicClient, walletClient }).withAddresses({
  escrow: "0x...",
  reputation: "0x...",
  rfq: "0x...",
});
```

## License

MIT
