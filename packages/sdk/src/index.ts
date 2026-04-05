// ── Main Client ────────────────────────────────────────────────
export { BrokerClient } from "./client.js";

// ── Types ──────────────────────────────────────────────────────
export type {
  BrokerClientConfig,
  Offer,
  CreateOfferParams,
  CreateOfferResult,
  FillOfferParams,
  FillOfferResult,
  CounterOfferParams,
  CounterOfferResult,
  ListOffersParams,
  RFQRequest,
  Quote,
  RequestQuoteParams,
  RequestQuoteResult,
  SubmitQuoteParams,
  SubmitQuoteResult,
  AcceptQuoteParams,
  AcceptQuoteResult,
  ListQuotesParams,
  Reputation,
  LeaderboardEntry,
  ProtocolStats,
  TransactionResult,
  FeeConfig,
} from "./types.js";

export { OfferStatus, RFQStatus, QuoteStatus } from "./types.js";

// ── Contracts ──────────────────────────────────────────────────
export { BrokerEscrowABI, BrokerReputationABI, BrokerRFQABI, ERC20ABI } from "./contracts/abi.js";

// Legacy aliases — consumers migrating from local ABI copies
export { BrokerEscrowABI as ESCROW_ABI } from "./contracts/abi.js";
export { BrokerRFQABI as RFQ_ABI } from "./contracts/abi.js";
export { BrokerReputationABI as REPUTATION_ABI } from "./contracts/abi.js";
export { BrokerEscrowABI as OTC_MARKET_ABI } from "./contracts/abi.js";
export { BrokerRFQABI as RFQ_ENGINE_ABI } from "./contracts/abi.js";
export { ERC20ABI as ERC20_ABI } from "./contracts/abi.js";
export {
  getAddresses,
  BASE_MAINNET_ADDRESSES,
  BASE_TESTNET_ADDRESSES,
  type BrokerAddresses,
} from "./contracts/addresses.js";

// ── Utilities ──────────────────────────────────────────────────
export {
  formatTokenAmount,
  parseTokenAmount,
  formatBps,
  calculateFee,
  formatTimestamp,
  isExpired,
  offerStatusLabel,
  formatOfferSummary,
  formatReputationScore,
  calculateRate,
  defaultDeadline,
  defaultRFQDeadline,
  defaultQuoteExpiry,
} from "./utils/format.js";

export {
  ValidationError,
  validateAddress,
  validatePositiveAmount,
  validateDeadline,
  validateBasisPoints,
  validateCreateOfferParams,
  validateRequestQuoteParams,
  validateSubmitQuoteParams,
  validateOfferId,
} from "./utils/validation.js";

// ── Sub-managers (for advanced usage) ──────────────────────────
export { OfferManager } from "./offers.js";
export { RFQManager } from "./rfq.js";
export { ReputationManager } from "./reputation.js";
