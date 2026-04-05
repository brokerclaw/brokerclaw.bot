import type { Address, PublicClient, WalletClient, Chain, Transport, Account } from "viem";
import { BrokerEscrowABI, ERC20ABI } from "./contracts/abi.js";
import type { BrokerAddresses } from "./contracts/addresses.js";
import type {
  Offer,
  CreateOfferParams,
  CreateOfferResult,
  FillOfferParams,
  FillOfferResult,
  CounterOfferParams,
  CounterOfferResult,
  ListOffersParams,
  TransactionResult,
  FeeConfig,
  OfferStatus,
} from "./types.js";
import {
  validateCreateOfferParams,
  validateOfferId,
  validatePositiveAmount,
} from "./utils/validation.js";
import { defaultDeadline } from "./utils/format.js";

export class OfferManager {
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

  /** Create a new OTC offer. Tokens must be approved beforehand. */
  async createOffer(params: CreateOfferParams): Promise<CreateOfferResult> {
    validateCreateOfferParams(params);
    const wallet = this.requireWallet();

    const expiry = params.deadline ?? defaultDeadline();

    // Ensure approval
    const allowance = await this.publicClient.readContract({
      address: params.sellToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.escrow],
    });

    if ((allowance as bigint) < params.sellAmount) {
      const approveHash = await wallet.writeContract({
        address: params.sellToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.escrow, params.sellAmount],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "createOffer",
      args: [
        params.sellToken,   // tokenA
        params.sellAmount,   // amountA
        params.buyToken,     // tokenB
        params.buyAmount,    // amountB
        expiry,
      ],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    // Parse OfferCreated event for the offerId
    let offerId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.escrow.toLowerCase()) {
          // The first topic is the event signature, second is the indexed offerId
          if (log.topics[1]) {
            offerId = BigInt(log.topics[1]);
          }
        }
      } catch {
        // skip non-matching logs
      }
    }

    return { hash, offerId };
  }

  /** Fill an existing offer by providing buyToken */
  async fillOffer(params: FillOfferParams): Promise<FillOfferResult> {
    validateOfferId(params.offerId);
    const wallet = this.requireWallet();

    // Read the offer to know buyToken and amount for approval
    const offer = await this.getOffer(params.offerId);

    // Ensure approval of buyToken
    const allowance = await this.publicClient.readContract({
      address: offer.buyToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.escrow],
    });

    if ((allowance as bigint) < offer.buyAmount) {
      const approveHash = await wallet.writeContract({
        address: offer.buyToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.escrow, offer.buyAmount],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "fillOffer",
      args: [params.offerId],
      chain: wallet.chain,
      account: wallet.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash, offerId: params.offerId };
  }

  /** Cancel an open offer (only the maker can cancel) */
  async cancelOffer(offerId: bigint): Promise<TransactionResult> {
    validateOfferId(offerId);
    const wallet = this.requireWallet();

    const hash = await wallet.writeContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "cancelOffer",
      args: [offerId],
      chain: wallet.chain,
      account: wallet.account,
    });

    await this.publicClient.waitForTransactionReceipt({ hash });
    return { hash };
  }

  /** Create a counter-offer referencing an existing offer */
  async counterOffer(params: CounterOfferParams): Promise<CounterOfferResult> {
    validateOfferId(params.originalOfferId);
    validatePositiveAmount(params.newAmountB, "newAmountB");
    const wallet = this.requireWallet();

    // Get original offer to find which token to approve (counter-offerer deposits tokenB)
    const offer = await this.getOffer(params.originalOfferId);

    const allowance = await this.publicClient.readContract({
      address: offer.buyToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.escrow],
    });

    if ((allowance as bigint) < params.newAmountB) {
      const approveHash = await wallet.writeContract({
        address: offer.buyToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.escrow, params.newAmountB],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "counterOffer",
      args: [
        params.originalOfferId,
        params.newAmountB,
      ],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let offerId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.escrow.toLowerCase()) {
          // CounterOfferCreated has 4 topics: [sig, originalOfferId, counterOfferId, counterParty]
          // OfferCreated has 3 topics: [sig, offerId, maker] — topics[2] is maker address, not an ID
          if (log.topics.length === 4 && log.topics[2]) {
            offerId = BigInt(log.topics[2]);
          }
        }
      } catch {
        // skip
      }
    }

    return { hash, offerId };
  }

  /** Read a single offer by ID */
  async getOffer(offerId: bigint): Promise<Offer> {
    validateOfferId(offerId);

    const result = await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "getOffer",
      args: [offerId],
    });

    const r = result as {
      maker: Address;
      taker: Address;
      tokenA: Address;
      tokenB: Address;
      amountA: bigint;
      amountB: bigint;
      expiry: bigint;
      status: number;
      originalOfferId: bigint;
    };

    return {
      id: offerId,
      maker: r.maker,
      taker: r.taker,
      sellToken: r.tokenA,
      buyToken: r.tokenB,
      sellAmount: r.amountA,
      buyAmount: r.amountB,
      deadline: r.expiry,
      status: r.status as OfferStatus,
      originalOfferId: r.originalOfferId,
    };
  }

  /** List offers with optional filters. Iterates from 1 to offerCount. */
  async listOffers(params: ListOffersParams = {}): Promise<Offer[]> {
    const offset = params.offset ?? 0n;
    const limit = params.limit ?? 20n;

    // Fetch all offers by iterating from offset
    const totalCount = (await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "offerCount",
    })) as bigint;

    const start = Number(offset) + 1; // offers are 1-indexed
    const end = Math.min(start + Number(limit), Number(totalCount) + 1);
    const offerIds = Array.from({ length: Math.max(0, end - start) }, (_, i) => BigInt(start + i));

    const offers = await Promise.all(
      offerIds.map((id) => this.getOffer(id))
    );

    // Apply filters client-side
    let filtered = offers;

    if (params.maker) {
      filtered = filtered.filter(
        (o) => o.maker.toLowerCase() === params.maker!.toLowerCase()
      );
    }

    if (params.sellToken) {
      filtered = filtered.filter(
        (o) => o.sellToken.toLowerCase() === params.sellToken!.toLowerCase()
      );
    }

    if (params.buyToken) {
      filtered = filtered.filter(
        (o) => o.buyToken.toLowerCase() === params.buyToken!.toLowerCase()
      );
    }

    if (params.status !== undefined) {
      filtered = filtered.filter((o) => o.status === params.status);
    }

    return filtered;
  }

  /** Get the protocol fee configuration */
  async getFeeConfig(): Promise<FeeConfig> {
    const [feeBps, treasury] = await Promise.all([
      this.publicClient.readContract({
        address: this.addresses.escrow,
        abi: BrokerEscrowABI,
        functionName: "feeBps",
      }) as Promise<bigint>,
      this.publicClient.readContract({
        address: this.addresses.escrow,
        abi: BrokerEscrowABI,
        functionName: "treasury",
      }) as Promise<Address>,
    ]);

    return {
      feeBps,
      treasury,
    };
  }
}
