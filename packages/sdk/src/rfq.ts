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

    const deadline = params.deadline ?? defaultRFQDeadline();

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
      args: [params.sellToken, params.buyToken, params.sellAmount, deadline],
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
    validateOfferId(params.rfqId);
    const wallet = this.requireWallet();

    const expiry = params.expiry ?? defaultQuoteExpiry();

    // Read the RFQ to know the buyToken and approve it
    const rfq = await this.getRFQ(params.rfqId);

    const allowance = await this.publicClient.readContract({
      address: rfq.buyToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.rfq],
    });

    if ((allowance as bigint) < params.buyAmount) {
      const approveHash = await wallet.writeContract({
        address: rfq.buyToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.rfq, params.buyAmount],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "submitQuote",
      args: [params.rfqId, params.buyAmount, expiry],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let quoteId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.rfq.toLowerCase()) {
          if (log.topics[1]) {
            quoteId = BigInt(log.topics[1]);
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

    await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, quoteId: params.quoteId };
  }

  /** Cancel an active RFQ (only the requester can cancel) */
  async cancelRFQ(rfqId: bigint): Promise<TransactionResult> {
    validateOfferId(rfqId);
    const wallet = this.requireWallet();

    const hash = await wallet.writeContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "cancelRFQ",
      args: [rfqId],
      chain: wallet.chain,
      account: wallet.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash };
  }

  /** Get a single RFQ by ID */
  async getRFQ(rfqId: bigint): Promise<RFQRequest> {
    const result = await this.publicClient.readContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "rfqs",
      args: [rfqId],
    });

    const r = result as readonly [bigint, Address, Address, Address, bigint, bigint, number, bigint];

    return {
      id: r[0],
      requester: r[1],
      sellToken: r[2],
      buyToken: r[3],
      sellAmount: r[4],
      deadline: r[5],
      status: r[6] as RFQStatus,
      createdAt: r[7],
    };
  }

  /** Get a single quote by ID */
  async getQuote(quoteId: bigint): Promise<Quote> {
    const result = await this.publicClient.readContract({
      address: this.addresses.rfq,
      abi: BrokerRFQABI,
      functionName: "quotes",
      args: [quoteId],
    });

    const r = result as readonly [bigint, bigint, Address, bigint, bigint, boolean, bigint];

    return {
      id: r[0],
      rfqId: r[1],
      quoter: r[2],
      buyAmount: r[3],
      expiry: r[4],
      accepted: r[5],
      createdAt: r[6],
    };
  }

  /** List quotes, optionally filtered by RFQ ID or quoter */
  async listQuotes(params: ListQuotesParams = {}): Promise<Quote[]> {
    const offset = params.offset ?? 0n;
    const limit = params.limit ?? 20n;

    let quoteIds: readonly bigint[];

    if (params.rfqId !== undefined) {
      quoteIds = (await this.publicClient.readContract({
        address: this.addresses.rfq,
        abi: BrokerRFQABI,
        functionName: "getQuotesByRFQ",
        args: [params.rfqId, offset, limit],
      })) as readonly bigint[];
    } else {
      const totalCount = (await this.publicClient.readContract({
        address: this.addresses.rfq,
        abi: BrokerRFQABI,
        functionName: "quoteCount",
      })) as bigint;

      const start = Number(offset) + 1;
      const end = Math.min(start + Number(limit), Number(totalCount) + 1);
      quoteIds = Array.from({ length: end - start }, (_, i) => BigInt(start + i));
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
