// ── BrokerEscrow ABI ───────────────────────────────────────────

export const BrokerEscrowABI = [
  // Events
  {
    type: "event",
    name: "OfferCreated",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "sellToken", type: "address", indexed: false },
      { name: "buyToken", type: "address", indexed: false },
      { name: "sellAmount", type: "uint256", indexed: false },
      { name: "buyAmount", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OfferFilled",
    inputs: [
      { name: "offerId", type: "uint256", indexed: true },
      { name: "filler", type: "address", indexed: true },
      { name: "fillAmount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
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
    name: "CounterOffer",
    inputs: [
      { name: "originalOfferId", type: "uint256", indexed: true },
      { name: "counterOfferId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
    ],
  },

  // Read functions
  {
    type: "function",
    name: "offers",
    stateMutability: "view",
    inputs: [{ name: "offerId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "maker", type: "address" },
      { name: "sellToken", type: "address" },
      { name: "buyToken", type: "address" },
      { name: "sellAmount", type: "uint256" },
      { name: "buyAmount", type: "uint256" },
      { name: "minFillPercent", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "filler", type: "address" },
      { name: "filledAt", type: "uint256" },
      { name: "createdAt", type: "uint256" },
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
    name: "getOffersByMaker",
    stateMutability: "view",
    inputs: [
      { name: "maker", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "offerIds", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "getOffersByToken",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "offerIds", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "feeConfig",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "feeBps", type: "uint256" },
      { name: "burnBps", type: "uint256" },
      { name: "treasuryBps", type: "uint256" },
      { name: "treasury", type: "address" },
    ],
  },

  // Write functions
  {
    type: "function",
    name: "createOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sellToken", type: "address" },
      { name: "buyToken", type: "address" },
      { name: "sellAmount", type: "uint256" },
      { name: "buyAmount", type: "uint256" },
      { name: "minFillPercent", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "offerId", type: "uint256" }],
  },
  {
    type: "function",
    name: "fillOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "offerId", type: "uint256" },
      { name: "fillAmount", type: "uint256" },
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
  {
    type: "function",
    name: "counterOffer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "originalOfferId", type: "uint256" },
      { name: "sellToken", type: "address" },
      { name: "buyToken", type: "address" },
      { name: "sellAmount", type: "uint256" },
      { name: "buyAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "counterOfferId", type: "uint256" }],
  },
] as const;

// ── BrokerReputation ABI ───────────────────────────────────────

export const BrokerReputationABI = [
  // Events
  {
    type: "event",
    name: "ReputationUpdated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "newScore", type: "uint256", indexed: false },
      { name: "totalDeals", type: "uint256", indexed: false },
    ],
  },

  // Read functions
  {
    type: "function",
    name: "getReputation",
    stateMutability: "view",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      { name: "agent", type: "address" },
      { name: "totalDeals", type: "uint256" },
      { name: "successfulDeals", type: "uint256" },
      { name: "totalVolume", type: "uint256" },
      { name: "avgSettlementTime", type: "uint256" },
      { name: "score", type: "uint256" },
      { name: "lastUpdated", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getLeaderboard",
    stateMutability: "view",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      { name: "agents", type: "address[]" },
      { name: "scores", type: "uint256[]" },
      { name: "deals", type: "uint256[]" },
      { name: "volumes", type: "uint256[]" },
    ],
  },
  {
    type: "function",
    name: "getStats",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "totalOffers", type: "uint256" },
      { name: "totalFills", type: "uint256" },
      { name: "totalRFQs", type: "uint256" },
      { name: "totalVolume", type: "uint256" },
      { name: "totalFees", type: "uint256" },
      { name: "uniqueAgents", type: "uint256" },
    ],
  },

  // Write functions (called by escrow/rfq contracts)
  {
    type: "function",
    name: "recordDeal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "maker", type: "address" },
      { name: "taker", type: "address" },
      { name: "volume", type: "uint256" },
      { name: "settlementTime", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// ── BrokerRFQ ABI ──────────────────────────────────────────────

export const BrokerRFQABI = [
  // Events
  {
    type: "event",
    name: "RFQCreated",
    inputs: [
      { name: "rfqId", type: "uint256", indexed: true },
      { name: "requester", type: "address", indexed: true },
      { name: "sellToken", type: "address", indexed: false },
      { name: "buyToken", type: "address", indexed: false },
      { name: "sellAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "QuoteSubmitted",
    inputs: [
      { name: "quoteId", type: "uint256", indexed: true },
      { name: "rfqId", type: "uint256", indexed: true },
      { name: "quoter", type: "address", indexed: true },
      { name: "buyAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "QuoteAccepted",
    inputs: [
      { name: "quoteId", type: "uint256", indexed: true },
      { name: "rfqId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "RFQCancelled",
    inputs: [
      { name: "rfqId", type: "uint256", indexed: true },
      { name: "requester", type: "address", indexed: true },
    ],
  },

  // Read functions
  {
    type: "function",
    name: "rfqs",
    stateMutability: "view",
    inputs: [{ name: "rfqId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "requester", type: "address" },
      { name: "sellToken", type: "address" },
      { name: "buyToken", type: "address" },
      { name: "sellAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "quotes",
    stateMutability: "view",
    inputs: [{ name: "quoteId", type: "uint256" }],
    outputs: [
      { name: "id", type: "uint256" },
      { name: "rfqId", type: "uint256" },
      { name: "quoter", type: "address" },
      { name: "buyAmount", type: "uint256" },
      { name: "expiry", type: "uint256" },
      { name: "accepted", type: "bool" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "rfqCount",
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
  {
    type: "function",
    name: "getQuotesByRFQ",
    stateMutability: "view",
    inputs: [
      { name: "rfqId", type: "uint256" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ name: "quoteIds", type: "uint256[]" }],
  },

  // Write functions
  {
    type: "function",
    name: "requestQuote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sellToken", type: "address" },
      { name: "buyToken", type: "address" },
      { name: "sellAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "rfqId", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitQuote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "rfqId", type: "uint256" },
      { name: "buyAmount", type: "uint256" },
      { name: "expiry", type: "uint256" },
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
  {
    type: "function",
    name: "cancelRFQ",
    stateMutability: "nonpayable",
    inputs: [{ name: "rfqId", type: "uint256" }],
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
