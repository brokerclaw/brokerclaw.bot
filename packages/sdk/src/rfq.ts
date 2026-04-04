import type { Address, PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { BrokerRFQABI, ERC20ABI } from "./contracts/abi.js";
import type { BrokerAddresses } from "./contracts/addresses.js";
import type {
  RFQRequest,
  Quote,
  RequestQuoteParams,
  RequestQuoteResult,
  SubmitQuoteParams,
  SubmitQuoteResult,
  AcceptQuoteParams,
  AcceptQuoteResult,
  ListQuotesParams,
  TransactionResult,
  RFQStatus,
} from "./types.js";
import {
  validateRequestQuoteParams,
  validateSubmitQuoteParams,
  validateOfferId,
} from "./utils/validation.js";
import { defaultRFQDeadline, defaultQuoteExpiry } from "./utils/format.js";

export class RFQManager {
  constructor(
    private publicClient: PublicClient<Transport, Chain>,
    private walletClient: WalletClient<Transport, Chain, Account> | undefined,
    private addresses: BrokerAddresses
  ) {}

  private requireWallet(): WalletClient<Transport, Chain, Account> {
    if (!this.walletClient) {
      throw new Error("WalletClient required for write operations");
    }
    return this.walletClient;
  }

  /** Create a new Request for Quote */
  async requestQuote(params: RequestQuoteParams): Promise<RequestQuoteResult> {
    validateRequestQuoteParams(params);
    const wallet = this.requireWallet();

    const expiry = params.deadline ?? defaultRFQDeadline();

    // Approve sellToken for the RFQ contract
    const allowance = await this.publicClient.readContract({
      address: params.sellToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.rfq],
    });

    if ((allowance as bigint) < params.sellAmount) {
      const approveHash = await wallet.writeContract({
        address: params.sellToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.rfq, params.sellAmount],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "requestQuote",
      args: [params.sellToken, params.sellAmount, params.buyToken, expiry],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let rfqId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.rfq.toLowerCase()) {
          if (log.topics[1]) {
            rfqId = BigInt(log.topics[1]);
          }
        }
      } catch {
        // skip
      }
    }

    return { hash, rfqId };
  }

  /** Submit a quote for an existing RFQ */
  async submitQuote(params: SubmitQuoteParams): Promise<SubmitQuoteResult> {
    validateSubmitQuoteParams(params);
    validateOfferId(params.requestId);
    const wallet = this.requireWallet();

    const expiry = params.expiry ?? defaultQuoteExpiry();

    // Read the request to know the buyToken and approve it
    const request = await this.getRequest(params.requestId);

    const allowance = await this.publicClient.readContract({
      address: request.buyToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.rfq],
    });

    if ((allowance as bigint) < params.amountB) {
      const approveHash = await wallet.writeContract({
        address: request.buyToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.rfq, params.amountB],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "submitQuote",
      args: [params.requestId, params.amountB, expiry],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let quoteId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.rfq.toLowerCase()) {
          // QuoteSubmitted: topics[2] is quoteId
          if (log.topics[2]) {
            quoteId = BigInt(log.topics[2]);
          }
        }
      } catch {
        // skip
      }
    }

    return { hash, quoteId };
  }

  /** Accept a submitted quote, triggering settlement */
  async acceptQuote(params: AcceptQuoteParams): Promise<AcceptQuoteResult> {
    const wallet = this.requireWallet();

    const hash = await wallet.writeContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "acceptQuote",
      args: [params.quoteId],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Parse escrowOfferId from QuoteAccepted event logs
    let escrowOfferId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.rfq.toLowerCase()) {
          // QuoteAccepted has escrowOfferId as non-indexed data
          // topics[1] = requestId, topics[2] = quoteId
          if (log.data && log.data !== "0x") {
            escrowOfferId = BigInt(log.data.slice(0, 66));
          }
        }
      } catch {
        // skip
      }
    }

    return { hash, quoteId: params.quoteId, escrowOfferId };
  }

  /** Cancel an active request (only the requester can cancel) */
  async cancelRequest(requestId: bigint): Promise<TransactionResult> {
    validateOfferId(requestId);
    const wallet = this.requireWallet();

    const hash = await wallet.writeContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "cancelRequest",
      args: [requestId],
      chain: wallet.chain,
      account: wallet.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash };
  }

  /** @deprecated Use cancelRequest instead */
  async cancelRFQ(rfqId: bigint): Promise<TransactionResult> {
    return this.cancelRequest(rfqId);
  }

  /** Get a single request by ID */
  async getRequest(requestId: bigint): Promise<RFQRequest> {
    const result = await this.publicClient.readContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "getRequest",
      args: [requestId],
    });

    const r = result as {
      requester: Address;
      tokenA: Address;
      amountA: bigint;
      tokenB: Address;
      expiry: bigint;
      status: number;
      acceptedQuoteId: bigint;
    };

    return {
      id: requestId,
      requester: r.requester,
      sellToken: r.tokenA,
      buyToken: r.tokenB,
      sellAmount: r.amountA,
      deadline: r.expiry,
      status: r.status as RFQStatus,
      acceptedQuoteId: r.acceptedQuoteId,
    };
  }

  /** @deprecated Use getRequest instead */
  async getRFQ(rfqId: bigint): Promise<RFQRequest> {
    return this.getRequest(rfqId);
  }

  /** Get a single quote by ID */
  async getQuote(quoteId: bigint): Promise<Quote> {
    const result = await this.publicClient.readContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "getQuote",
      args: [quoteId],
    });

    const r = result as {
      requestId: bigint;
      quoter: Address;
      amountB: bigint;
      quoteExpiry: bigint;
      status: number;
    };

    return {
      id: quoteId,
      requestId: r.requestId,
      quoter: r.quoter,
      amountB: r.amountB,
      quoteExpiry: r.quoteExpiry,
      status: r.status,
    };
  }

  /** Get all quote IDs for a given request */
  async getRequestQuotes(requestId: bigint): Promise<readonly bigint[]> {
    const result = await this.publicClient.readContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "getRequestQuotes",
      args: [requestId],
    });

    return result as readonly bigint[];
  }

  /** List quotes, optionally filtered by request ID or quoter */
  async listQuotes(params: ListQuotesParams = {}): Promise<Quote[]> {
    let quoteIds: readonly bigint[];

    if (params.requestId !== undefined) {
      quoteIds = await this.getRequestQuotes(params.requestId);
    } else {
      const totalCount = (await this.publicClient.readContract({
        address: this.addresses.rfq,
        abi: BrokerRFQABI,
        functionName: "quoteCount",
      })) as bigint;

      const offset = params.offset ?? 0n;
      const limit = params.limit ?? 20n;
      const start = Number(offset) + 1;
      const end = Math.min(start + Number(limit), Number(totalCount) + 1);
      quoteIds = Array.from({ length: Math.max(0, end - start) }, (_, i) => BigInt(start + i));
    }

    const quotes = await Promise.all(quoteIds.map((id) => this.getQuote(id)));

    if (params.quoter) {
      return quotes.filter(
        (q) => q.quoter.toLowerCase() === params.quoter!.toLowerCase()
      );
    }

    return quotes;
  }
}
