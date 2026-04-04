import type {
  Address,
  Hash,
  PublicClient,
  WalletClient,
  Chain,
  Transport,
  Account,
} from "viem";

// ── Client Config ──────────────────────────────────────────────

export interface BrokerClientConfig {
  /** viem PublicClient (read-only operations) */
  publicClient: PublicClient<Transport, Chain>;
  /** viem WalletClient (write operations — optional for read-only usage) */
  walletClient?: WalletClient<Transport, Chain, Account>;
}

// ── Enums ──────────────────────────────────────────────────────

export enum OfferStatus {
  Open = 0,
  Filled = 1,
  Cancelled = 2,
  Expired = 3,
}

export enum RFQStatus {
  Pending = 0,
  Quoted = 1,
  Accepted = 2,
  Settled = 3,
  Expired = 4,
  Cancelled = 5,
}

// ── Offer Types ────────────────────────────────────────────────

export interface Offer {
  id: bigint;
  maker: Address;
  taker: Address;
  sellToken: Address;
  buyToken: Address;
  sellAmount: bigint;
  buyAmount: bigint;
  deadline: bigint;
  status: OfferStatus;
  originalOfferId: bigint;
}

export interface CreateOfferParams {
  sellToken: Address;
  buyToken: Address;
  sellAmount: bigint;
  buyAmount: bigint;
  /** Unix timestamp deadline. Default: 24 hours from now */
  deadline?: bigint;
}

export interface FillOfferParams {
  offerId: bigint;
}

export interface CounterOfferParams {
  originalOfferId: bigint;
  newAmountB: bigint;
}

export interface ListOffersParams {
  maker?: Address;
  sellToken?: Address;
  buyToken?: Address;
  status?: OfferStatus;
  offset?: bigint;
  limit?: bigint;
}

// ── RFQ Types ──────────────────────────────────────────────────

export interface RFQRequest {
  id: bigint;
  requester: Address;
  sellToken: Address;
  buyToken: Address;
  sellAmount: bigint;
  deadline: bigint;
  status: RFQStatus;
  acceptedQuoteId: bigint;
}

export interface Quote {
  id: bigint;
  requestId: bigint;
  quoter: Address;
  amountB: bigint;
  quoteExpiry: bigint;
  status: number;
}

export interface RequestQuoteParams {
  sellToken: Address;
  buyToken: Address;
  sellAmount: bigint;
  /** Unix timestamp deadline for receiving quotes. Default: 1 hour */
  deadline?: bigint;
}

export interface SubmitQuoteParams {
  requestId: bigint;
  amountB: bigint;
  /** Quote expiry. Default: 30 minutes from now */
  expiry?: bigint;
}

export interface AcceptQuoteParams {
  quoteId: bigint;
}

export interface AcceptQuoteResult extends TransactionResult {
  quoteId: bigint;
  escrowOfferId: bigint;
}

export interface ListQuotesParams {
  requestId?: bigint;
  quoter?: Address;
  offset?: bigint;
  limit?: bigint;
}

// ── Reputation Types ───────────────────────────────────────────

export interface Reputation {
  agent: Address;
  score: bigint;
  completedDeals: bigint;
  cancelledDeals: bigint;
  totalVolume: bigint;
  firstDealTimestamp: bigint;
  lastDealTimestamp: bigint;
}

export interface LeaderboardEntry {
  agent: Address;
  score: bigint;
  totalDeals: bigint;
  totalVolume: bigint;
}

export interface ProtocolStats {
  totalOffers: bigint;
  totalFills: bigint;
  totalRFQs: bigint;
  totalVolume: bigint;
  totalFees: bigint;
  uniqueAgents: bigint;
}

// ── Transaction Results ────────────────────────────────────────

export interface TransactionResult {
  hash: Hash;
}

export interface CreateOfferResult extends TransactionResult {
  offerId: bigint;
}

export interface FillOfferResult extends TransactionResult {
  offerId: bigint;
}

export interface CounterOfferResult extends TransactionResult {
  offerId: bigint;
}

export interface RequestQuoteResult extends TransactionResult {
  rfqId: bigint;
}

export interface SubmitQuoteResult extends TransactionResult {
  quoteId: bigint;
}

// ── Fee Types ──────────────────────────────────────────────────

export interface FeeConfig {
  feeBps: bigint;
  treasury: Address;
}
