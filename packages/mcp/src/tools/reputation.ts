import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { REPUTATION_ABI } from "../contracts/abi.js";
import { formatReputation, abbreviateAddress, formatTokenAmount } from "../utils/format.js";

export function registerReputationTools(server: McpServer): void {
  /**
   * brokers_reputation — Get an agent's reputation score and stats
   */
  server.tool(
    "brokers_reputation",
    "Get the reputation score and trading stats for a specific agent address on the Brokers Bot protocol.",
    {
      agentAddress: z.string().describe("Ethereum address of the agent to look up"),
    },
    async ({ agentAddress }) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const rep = (await client.readContract({
          address: addresses.reputation,
          abi: REPUTATION_ABI,
          functionName: "getReputation",
          args: [agentAddress as `0x${string}`],
        })) as any;

        return {
          content: [
            {
              type: "text",
              text: formatReputation(rep),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching reputation: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_my_deals — Get deal history for an agent
   */
  server.tool(
    "brokers_my_deals",
    "Get the trade/deal history for a specific agent on the Brokers Bot protocol.",
    {
      agentAddress: z.string().describe("Ethereum address of the agent"),
      limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of deals to return"),
    },
    async ({ agentAddress, limit }) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        // Fetch OfferFilled events where the agent is maker or taker
        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
        const addr = agentAddress.toLowerCase() as `0x${string}`;

        const logs = await client.getLogs({
          address: addresses.otcMarket,
          event: {
            type: "event",
            name: "OfferFilled",
            inputs: [
              { name: "offerId", type: "uint256", indexed: true },
              { name: "taker", type: "address", indexed: true },
              { name: "feeA", type: "uint256", indexed: false },
              { name: "feeB", type: "uint256", indexed: false },
            ],
          },
          fromBlock,
          toBlock: "latest",
        });

        // Filter for deals involving the agent and fetch offer details
        const deals: any[] = [];
        for (const log of logs.reverse()) {
          if (deals.length >= limit) break;
          const args = log.args as any;
          try {
            const offer = (await client.readContract({
              address: addresses.otcMarket,
              abi: [{
                type: "function",
                name: "getOffer",
                stateMutability: "view",
                inputs: [{ name: "offerId", type: "uint256" }],
                outputs: [{
                  type: "tuple",
                  components: [
                    { name: "maker", type: "address" },
                    { name: "taker", type: "address" },
                    { name: "tokenA", type: "address" },
                    { name: "tokenB", type: "address" },
                    { name: "amountA", type: "uint256" },
                    { name: "amountB", type: "uint256" },
                    { name: "expiry", type: "uint256" },
                    { name: "status", type: "uint8" },
                    { name: "originalOfferId", type: "uint256" },
                  ],
                }],
              }] as const,
              functionName: "getOffer",
              args: [args.offerId],
            })) as any;

            if (offer.maker.toLowerCase() === addr || offer.taker.toLowerCase() === addr) {
              deals.push({ offerId: args.offerId, ...offer, block: log.blockNumber });
            }
          } catch {
            continue;
          }
        }

        if (deals.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No deals found for ${abbreviateAddress(agentAddress)}.`,
              },
            ],
          };
        }

        const formatted = deals
          .map((d: any) =>
            [
              `Deal (Offer #${d.offerId})`,
              `  Maker: ${abbreviateAddress(d.maker)}`,
              `  Taker: ${abbreviateAddress(d.taker)}`,
              `  ${formatTokenAmount(d.amountA)} ↔ ${formatTokenAmount(d.amountB)}`,
              `  Block: ${d.block}`,
            ].join("\n")
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Deals for ${abbreviateAddress(agentAddress)} (${deals.length}):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching deals: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
