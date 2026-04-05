// ── BrokerEscrow ABI ───────────────────────────────────────────

export const BrokerEscrowABI = [
  // Events
  {
    type: "event",
    name: "OfferCreated",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "tokenA", type: "address", indexed: false },
      { name: "tokenB", type: "address", indexed: false },
      { name: "amountA", type: "uint256", indexed: false },
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
      { name: "feeA", type: "uint256", indexed: false },
      { name: "feeB", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OfferCancelled",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "CounterOfferCreated",
    inputs: [
      { name: "originalOfferId", type: "uint256", indexed: true },
      { name: "counterOfferId", type: "uint256", indexed: true },
      { name: "counterParty", type: "address", indexed: true },
      { name: "newAmountB", type: "uint256", indexed: false },
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
        name: "",
        type: "tuple",
        components: [
          { name: "maker", type: "address" },
          { name: "taker", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "tokenB", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "amountB", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "originalOfferId", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "offerCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "treasury",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },

  // Write functions
  {
    type: "function",
    name: "createOffer",
    stateMutability: "payable",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "amountA", type: "uint256" },
      { name: "tokenB", type: "address" },
      { name: "amountB", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ],
    outputs: [{ name: "offerId", type: "uint256" }],
  },
  {
    type: "function",
    name: "fillOffer",
    stateMutability: "payable",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelOffer",
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
    outputs: [{ name: "counterOfferId", type: "uint256" }],
  },
] as const;

// ── BrokerReputation ABI ───────────────────────────────────────

export const BrokerReputationABI = [
  // Read functions
  {
    type: "function",
    name: "getScore",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "score", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAgentStats",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "completedDeals", type: "uint256" },
          { name: "cancelledDeals", type: "uint256" },
          { name: "totalVolume", type: "uint256" },
          { name: "firstDealTimestamp", type: "uint256" },
          { name: "lastDealTimestamp", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "escrow",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },

  // Write functions (called by escrow contract)
  {
    type: "function",
    name: "recordDeal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "maker", type: "address" },
      { name: "taker", type: "address" },
      { name: "volume", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordCancellation",
    stateMutability: "nonpayable",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [],
  },
] as const;

// ── BrokerRFQ ABI ──────────────────────────────────────────────

export const BrokerRFQABI = [
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
      { name: "requestId", type: "uint256", indexed: true },
      { name: "quoteId", type: "uint256", indexed: true },
      { name: "quoter", type: "address", indexed: true },
      { name: "amountB", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "QuoteAccepted",
    inputs: [
      { name: "requestId", type: "uint256", indexed: true },
      { name: "quoteId", type: "uint256", indexed: true },
      { name: "escrowOfferId", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RequestCancelled",
    inputs: [
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
        name: "",
        type: "tuple",
        components: [
          { name: "requester", type: "address" },
          { name: "tokenA", type: "address" },
          { name: "amountA", type: "uint256" },
          { name: "tokenB", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "acceptedQuoteId", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getQuote",
    stateMutability: "view",
    inputs: [{ name: "quoteId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "requestId", type: "uint256" },
          { name: "quoter", type: "address" },
          { name: "amountB", type: "uint256" },
          { name: "quoteExpiry", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getRequestQuotes",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "requestCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "quoteCount",
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
      { name: "expiry", type: "uint256" },
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
      { name: "quoteExpiry", type: "uint256" },
    ],
    outputs: [{ name: "quoteId", type: "uint256" }],
  },
  {
    type: "function",
    name: "acceptQuote",
    stateMutability: "payable",
    inputs: [{ name: "quoteId", type: "uint256" }],
    outputs: [{ name: "escrowOfferId", type: "uint256" }],
  },
  {
    type: "function",
    name: "cancelRequest",
    stateMutability: "nonpayable",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [],
  },
] as const;

// ── ERC-20 ABI (minimal for token interactions) ────────────────

export const ERC20ABI = [
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
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
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
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;
