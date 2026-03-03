import type { Address, PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { OfferManager } from "./offers.js";
import { RFQManager } from "./rfq.js";
import { ReputationManager } from "./reputation.js";
import { getAddresses, type BrokerAddresses } from "./contracts/addresses.js";
import type {
  BrokerClientConfig,
  CreateOfferParams,
  CreateOfferResult,
  FillOfferParams,
  FillOfferResult,
  CounterOfferParams,
  CounterOfferResult,
  ListOffersParams,
  Offer,
  TransactionResult,
  RequestQuoteParams,
  RequestQuoteResult,
  SubmitQuoteParams,
  SubmitQuoteResult,
  AcceptQuoteParams,
  AcceptQuoteResult,
  ListQuotesParams,
  Quote,
  RFQRequest,
  Reputation,
  LeaderboardEntry,
  ProtocolStats,
  FeeConfig,
} from "./types.js";

/**
 * BrokerClient — main entry point for the BROKER OTC protocol SDK.
 *
 * @example
 * ```ts
 * import { BrokerClient } from "@brokers-bot/sdk";
 * import { createPublicClient, createWalletClient, http } from "viem";
 * import { base } from "viem/chains";
 *
 * const publicClient = createPublicClient({ chain: base, transport: http() });
 * const walletClient = createWalletClient({ chain: base, transport: http(), account });
 *
 * const broker = new BrokerClient({ publicClient, walletClient });
 * const { offerId, hash } = await broker.createOffer({ ... });
 * ```
 */
export class BrokerClient {
  readonly publicClient: PublicClient<Transport, Chain>;
  readonly walletClient: WalletClient<Transport, Chain, Account> | undefined;
  readonly addresses: BrokerAddresses;

  private offerManager: OfferManager;
  private rfqManager: RFQManager;
  private reputationManager: ReputationManager;

  constructor(config: BrokerClientConfig) {
    this.publicClient = config.publicClient;
    this.walletClient = config.walletClient;

    const chainId = config.publicClient.chain?.id ?? 8453;
    this.addresses = getAddresses(chainId);

    this.offerManager = new OfferManager(
      this.publicClient,
      this.walletClient,
      this.addresses
    );
    this.rfqManager = new RFQManager(
      this.publicClient,
      this.walletClient,
      this.addresses
    );
    this.reputationManager = new ReputationManager(
      this.publicClient,
      this.addresses
    );
  }

  /**
   * Override the default contract addresses.
   * Useful for testing or custom deployments.
   */
  withAddresses(addresses: BrokerAddresses): BrokerClient {
    const client = new BrokerClient({
      publicClient: this.publicClient,
      walletClient: this.walletClient,
    });
    (client as { addresses: BrokerAddresses }).addresses = addresses;
    (client as any).offerManager = new OfferManager(
      this.publicClient,
      this.walletClient,
      addresses
    );
    (client as any).rfqManager = new RFQManager(
      this.publicClient,
      this.walletClient,
      addresses
    );
    (client as any).reputationManager = new ReputationManager(
      this.publicClient,
      addresses
    );
    return client;
  }

  // ── Offer Methods ──────────────────────────────────────────

  /** Create a new OTC offer */
  async createOffer(params: CreateOfferParams): Promise<CreateOfferResult> {
    return this.offerManager.createOffer(params);
  }

  /** Fill an existing offer */
  async fillOffer(params: FillOfferParams): Promise<FillOfferResult> {
    return this.offerManager.fillOffer(params);
  }

  /** Cancel an open offer */
  async cancelOffer(offerId: bigint): Promise<TransactionResult> {
    return this.offerManager.cancelOffer(offerId);
  }

  /** Create a counter-offer */
  async counterOffer(params: CounterOfferParams): Promise<CounterOfferResult> {
    return this.offerManager.counterOffer(params);
  }

  /** List offers with optional filters */
  async listOffers(params?: ListOffersParams): Promise<Offer[]> {
    return this.offerManager.listOffers(params);
  }

  /** Get a single offer by ID */
  async getOffer(offerId: bigint): Promise<Offer> {
    return this.offerManager.getOffer(offerId);
  }

  /** Get the protocol fee configuration */
  async getFeeConfig(): Promise<FeeConfig> {
    return this.offerManager.getFeeConfig();
  }

  // ── RFQ Methods ────────────────────────────────────────────

  /** Create a new Request for Quote */
  async requestQuote(params: RequestQuoteParams): Promise<RequestQuoteResult> {
    return this.rfqManager.requestQuote(params);
  }

  /** Submit a quote for an existing RFQ */
  async submitQuote(params: SubmitQuoteParams): Promise<SubmitQuoteResult> {
    return this.rfqManager.submitQuote(params);
  }

  /** Accept a submitted quote */
  async acceptQuote(params: AcceptQuoteParams): Promise<AcceptQuoteResult> {
    return this.rfqManager.acceptQuote(params);
  }

  /** Cancel an RFQ */
  async cancelRFQ(rfqId: bigint): Promise<TransactionResult> {
    return this.rfqManager.cancelRFQ(rfqId);
  }

  /** Get a single RFQ by ID */
  async getRFQ(rfqId: bigint): Promise<RFQRequest> {
    return this.rfqManager.getRFQ(rfqId);
  }

  /** Get a single quote by ID */
  async getQuote(quoteId: bigint): Promise<Quote> {
    return this.rfqManager.getQuote(quoteId);
  }

  /** List quotes with optional filters */
  async listQuotes(params?: ListQuotesParams): Promise<Quote[]> {
    return this.rfqManager.listQuotes(params);
  }

  // ── Reputation Methods ─────────────────────────────────────

  /** Get reputation for a specific agent */
  async getReputation(agent: Address): Promise<Reputation> {
    return this.reputationManager.getReputation(agent);
  }

  /** Get the leaderboard of top agents */
  async getLeaderboard(offset?: bigint, limit?: bigint): Promise<LeaderboardEntry[]> {
    return this.reputationManager.getLeaderboard(offset, limit);
  }

  /** Get protocol-wide statistics */
  async getStats(): Promise<ProtocolStats> {
    return this.reputationManager.getStats();
  }
}
