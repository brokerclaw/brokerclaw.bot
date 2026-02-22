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
  validateAddress,
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

    const deadline = params.deadline ?? defaultDeadline();
    const minFillPercent = params.minFillPercent ?? 10000n;

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
        params.sellToken,
        params.buyToken,
        params.sellAmount,
        params.buyAmount,
        minFillPercent,
        deadline,
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

    // Read the offer to know buyToken and amount
    const offer = await this.getOffer(params.offerId);
    const fillAmount = params.fillAmount ?? offer.buyAmount;
    validatePositiveAmount(fillAmount, "fillAmount");

    // Ensure approval of buyToken
    const allowance = await this.publicClient.readContract({
      address: offer.buyToken,
      abi: ERC20ABI,
      functionName: "allowance",
      args: [wallet.account.address, this.addresses.escrow],
    });

    if ((allowance as bigint) < fillAmount) {
      const approveHash = await wallet.writeContract({
        address: offer.buyToken,
        abi: ERC20ABI,
        functionName: "approve",
        args: [this.addresses.escrow, fillAmount],
        chain: wallet.chain,
        account: wallet.account,
      });
      await this.publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await wallet.writeContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "fillOffer",
      args: [params.offerId, fillAmount],
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
    validateAddress(params.sellToken, "sellToken");
    validateAddress(params.buyToken, "buyToken");
    validatePositiveAmount(params.sellAmount, "sellAmount");
    validatePositiveAmount(params.buyAmount, "buyAmount");
    const wallet = this.requireWallet();

    const deadline = params.deadline ?? defaultDeadline();

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
      functionName: "counterOffer",
      args: [
        params.originalOfferId,
        params.sellToken,
        params.buyToken,
        params.sellAmount,
        params.buyAmount,
        deadline,
      ],
      chain: wallet.chain,
      account: wallet.account,
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

    let offerId = 0n;
    for (const log of receipt.logs) {
      try {
        if (log.address.toLowerCase() === this.addresses.escrow.toLowerCase()) {
          // CounterOffer event: topics[2] is the counterOfferId
          if (log.topics[2]) {
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
      functionName: "offers",
      args: [offerId],
    });

    const r = result as readonly [
      bigint, Address, Address, Address, bigint, bigint, bigint, bigint, number, Address, bigint, bigint
    ];

    return {
      id: r[0],
      maker: r[1],
      sellToken: r[2],
      buyToken: r[3],
      sellAmount: r[4],
      buyAmount: r[5],
      minFillPercent: r[6],
      deadline: r[7],
      status: r[8] as OfferStatus,
      filler: r[9],
      filledAt: r[10],
      createdAt: r[11],
    };
  }

  /** List offers with optional filters */
  async listOffers(params: ListOffersParams = {}): Promise<Offer[]> {
    const offset = params.offset ?? 0n;
    const limit = params.limit ?? 20n;

    let offerIds: readonly bigint[];

    if (params.maker) {
      validateAddress(params.maker, "maker");
      offerIds = (await this.publicClient.readContract({
        address: this.addresses.escrow,
        abi: BrokerEscrowABI,
        functionName: "getOffersByMaker",
        args: [params.maker, offset, limit],
      })) as readonly bigint[];
    } else if (params.sellToken) {
      validateAddress(params.sellToken, "sellToken");
      offerIds = (await this.publicClient.readContract({
        address: this.addresses.escrow,
        abi: BrokerEscrowABI,
        functionName: "getOffersByToken",
        args: [params.sellToken, offset, limit],
      })) as readonly bigint[];
    } else {
      // Fetch all offers by iterating from offset
      const totalCount = (await this.publicClient.readContract({
        address: this.addresses.escrow,
        abi: BrokerEscrowABI,
        functionName: "offerCount",
      })) as bigint;

      const start = Number(offset) + 1; // offers are 1-indexed
      const end = Math.min(start + Number(limit), Number(totalCount) + 1);
      offerIds = Array.from({ length: end - start }, (_, i) => BigInt(start + i));
    }

    const offers = await Promise.all(
      offerIds.map((id) => this.getOffer(id))
    );

    // Apply status filter if provided
    if (params.status !== undefined) {
      return offers.filter((o) => o.status === params.status);
    }

    return offers;
  }

  /** Get the protocol fee configuration */
  async getFeeConfig(): Promise<FeeConfig> {
    const result = await this.publicClient.readContract({
      address: this.addresses.escrow,
      abi: BrokerEscrowABI,
      functionName: "feeConfig",
    });

    const r = result as readonly [bigint, bigint, bigint, Address];
    return {
      feeBps: r[0],
      burnBps: r[1],
      treasuryBps: r[2],
      treasury: r[3],
    };
  }
}
