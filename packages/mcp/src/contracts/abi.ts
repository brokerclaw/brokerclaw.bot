/**
 * Brokers Bot Contract ABIs
 *
 * These are placeholder ABIs matching the expected contract interfaces.
 * Replace with real ABIs from the contracts package after deployment.
 */

export const OTC_MARKET_ABI = [
  // Events
  {
    type: "event",
    name: "OfferCreated",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "tokenA", type: "address", indexed: false },
      { name: "amountA", type: "uint256", indexed: false },
      { name: "tokenB", type: "address", indexed: false },
      { name: "amountB", type: "uint256", indexed: false },
      { name: "expiry", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OfferFilled",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "taker", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "OfferCancelled",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "CounterOffer",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "counterParty", type: "address", indexed: true },
      { name: "newAmountB", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DealCompleted",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "taker", type: "address", indexed: true },
      { name: "tokenA", type: "address", indexed: false },
      { name: "amountA", type: "uint256", indexed: false },
      { name: "tokenB", type: "address", indexed: false },
      { name: "amountB", type: "uint256", indexed: false },
    ],
  },

  // Read functions
  {
    type: "function",
    name: "getOffer",
    stateMutability: "view",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "maker", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "amountB", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getOfferCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getOpenOffers",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "maker", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "amountB", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getOffersByToken",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "maker", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "amountB", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getDealsByAgent",
    stateMutability: "view",
    inputs: [
      { name: "agent", type: "address" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "offerId", type: "uint256" },
          { name: "maker", type: "address" },
          { name: "taker", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "amountB", type: "uint256" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "totalVolume",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalDeals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  // Write functions
  {
    type: "function",
    name: "createOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "amountA", type: "uint256" },
      { name: "tokenB", type: "address" },
      { name: "amountB", type: "uint256" },
      { name: "expiryDuration", type: "uint256" },
    ],
    outputs: [{ name: "offerId", type: "uint256" }],
  },
  {
    type: "function",
    name: "fillOffer",
    stateMutability: "nonpayable",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "counterOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "offerId", type: "uint256" },
      { name: "newAmountB", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelOffer",
    stateMutability: "nonpayable",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [],
  },
] as const;

export const RFQ_ENGINE_ABI = [
  // Events
  {
    type: "event",
    name: "QuoteRequested",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "requester", type: "address", indexed: true },
      { name: "tokenA", type: "address", indexed: false },
      { name: "amountA", type: "uint256", indexed: false },
      { name: "tokenB", type: "address", indexed: false },
      { name: "expiry", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "QuoteSubmitted",
    inputs: [
      { name: "quoteId", type: "uint256", indexed: true },
      { name: "requestId", type: "uint256", indexed: true },
      { name: "quoter", type: "address", indexed: true },
      { name: "amountB", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "QuoteAccepted",
    inputs: [
      { name: "quoteId", type: "uint256", indexed: true },
      { name: "requestId", type: "uint256", indexed: true },
    ],
  },

  // Read functions
  {
    type: "function",
    name: "getRequest",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "requester", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getQuotesForRequest",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "requestId", type: "uint256" },
          { name: "quoter", type: "address" },
          { name: "amountB", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getActiveRequests",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "requester", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getRequestCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  // Write functions
  {
    type: "function",
    name: "requestQuote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "amountA", type: "uint256" },
      { name: "tokenB", type: "address" },
      { name: "expiryDuration", type: "uint256" },
    ],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitQuote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "requestId", type: "uint256" },
      { name: "amountB", type: "uint256" },
      { name: "expiryDuration", type: "uint256" },
    ],
    outputs: [{ name: "quoteId", type: "uint256" }],
  },
  {
    type: "function",
    name: "acceptQuote",
    stateMutability: "nonpayable",
    inputs: [{ name: "quoteId", type: "uint256" }],
    outputs: [],
  },
] as const;

export const REPUTATION_ABI = [
  // Events
  {
    type: "event",
    name: "ReputationUpdated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },

  // Read functions
  {
    type: "function",
    name: "getReputation",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "agent", type: "address" },
          { name: "score", type: "uint256" },
          { name: "totalDeals", type: "uint256" },
          { name: "totalVolume", type: "uint256" },
          { name: "successRate", type: "uint256" },
          { name: "lastActive", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getLeaderboard",
    stateMutability: "view",
    inputs: [{ name: "limit", type: "uint256" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "agent", type: "address" },
          { name: "score", type: "uint256" },
          { name: "totalDeals", type: "uint256" },
          { name: "totalVolume", type: "uint256" },
          { name: "successRate", type: "uint256" },
          { name: "lastActive", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTopAgents",
    stateMutability: "view",
    inputs: [{ name: "limit", type: "uint256" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "agent", type: "address" },
          { name: "score", type: "uint256" },
          { name: "totalDeals", type: "uint256" },
          { name: "totalVolume", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
