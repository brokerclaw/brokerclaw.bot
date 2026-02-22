import type { Address, PublicClient, Chain, Transport } from "viem";
import { BrokerReputationABI } from "./contracts/abi.js";
import type { BrokerAddresses } from "./contracts/addresses.js";
import type { Reputation, LeaderboardEntry, ProtocolStats } from "./types.js";
import { validateAddress } from "./utils/validation.js";

export class ReputationManager {
  constructor(
    private publicClient: PublicClient<Transport, Chain>,
    private addresses: BrokerAddresses
  ) {}

  /** Get the reputation profile of a specific agent */
  async getReputation(agent: Address): Promise<Reputation> {
    validateAddress(agent, "agent");

    const result = await this.publicClient.readContract({
      address: this.addresses.reputation,
      abi: BrokerReputationABI,
      functionName: "getReputation",
      args: [agent],
    });

    const r = result as readonly [Address, bigint, bigint, bigint, bigint, bigint, bigint];

    return {
      agent: r[0],
      totalDeals: r[1],
      successfulDeals: r[2],
      totalVolume: r[3],
      avgSettlementTime: r[4],
      score: r[5],
      lastUpdated: r[6],
    };
  }

  /** Get the leaderboard of top agents by score */
  async getLeaderboard(
    offset: bigint = 0n,
    limit: bigint = 10n
  ): Promise<LeaderboardEntry[]> {
    const result = await this.publicClient.readContract({
      address: this.addresses.reputation,
      abi: BrokerReputationABI,
      functionName: "getLeaderboard",
      args: [offset, limit],
    });

    const r = result as readonly [
      readonly Address[],
      readonly bigint[],
      readonly bigint[],
      readonly bigint[]
    ];

    const agents = r[0];
    const scores = r[1];
    const deals = r[2];
    const volumes = r[3];

    return agents.map((agent, i) => ({
      agent,
      score: scores[i],
      totalDeals: deals[i],
      totalVolume: volumes[i],
    }));
  }

  /** Get protocol-wide statistics */
  async getStats(): Promise<ProtocolStats> {
    const result = await this.publicClient.readContract({
      address: this.addresses.reputation,
      abi: BrokerReputationABI,
      functionName: "getStats",
    });

    const r = result as readonly [bigint, bigint, bigint, bigint, bigint, bigint];

    return {
      totalOffers: r[0],
      totalFills: r[1],
      totalRFQs: r[2],
      totalVolume: r[3],
      totalFees: r[4],
      uniqueAgents: r[5],
    };
  }
}
