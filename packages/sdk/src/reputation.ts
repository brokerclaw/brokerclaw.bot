import type { Address, PublicClient, Chain, Transport } from "viem";
import { BrokerReputationABI } from "./contracts/abi.js";
import type { BrokerAddresses } from "./contracts/addresses.js";
import type { Reputation } from "./types.js";
import { validateAddress } from "./utils/validation.js";

export class ReputationManager {
  constructor(
    private publicClient: PublicClient<Transport, Chain>,
    private addresses: BrokerAddresses
  ) {}

  /** Get the reputation profile of a specific agent */
  async getReputation(agent: Address): Promise<Reputation> {
    validateAddress(agent, "agent");

    const [statsResult, score] = await Promise.all([
      this.publicClient.readContract({
        address: this.addresses.reputation,
        abi: BrokerReputationABI,
        functionName: "getAgentStats",
        args: [agent],
      }),
      this.publicClient.readContract({
        address: this.addresses.reputation,
        abi: BrokerReputationABI,
        functionName: "getScore",
        args: [agent],
      }) as Promise<bigint>,
    ]);

    const stats = statsResult as {
      completedDeals: bigint;
      cancelledDeals: bigint;
      totalVolume: bigint;
      firstDealTimestamp: bigint;
      lastDealTimestamp: bigint;
    };

    return {
      agent,
      score,
      completedDeals: stats.completedDeals,
      cancelledDeals: stats.cancelledDeals,
      totalVolume: stats.totalVolume,
      firstDealTimestamp: stats.firstDealTimestamp,
      lastDealTimestamp: stats.lastDealTimestamp,
    };
  }
}
