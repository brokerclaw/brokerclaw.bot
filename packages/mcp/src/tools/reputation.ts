import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { REPUTATION_ABI } from "../contracts/abi.js";
import { formatReputation, abbreviateAddress, formatSuccessRate, formatTokenAmount } from "../utils/format.js";

export function registerReputationTools(server: McpServer): void {
  /**
   * bankers_reputation — Get an agent's reputation score and stats
   */
  server.tool(
    "bankers_reputation",
    "Get the reputation score and trading stats for a specific agent address on the Bankers Bot protocol.",
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
   * bankers_my_deals — Get deal history for an agent
   */
  server.tool(
    "bankers_my_deals",
    "Get the trade/deal history for a specific agent on the Bankers Bot protocol.",
    {
      agentAddress: z.string().describe("Ethereum address of the agent"),
      limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of deals to return"),
    },
    async ({ agentAddress, limit }) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const deals = (await client.readContract({
          address: addresses.otcMarket,
          abi: [{
            type: "function",
            name: "getDealsByAgent",
            stateMutability: "view",
            inputs: [
              { name: "agent", type: "address" },
              { name: "limit", type: "uint256" },
            ],
            outputs: [
              {
                type: "tuple[]",
                components: [
                  { name: "offerId", type: "uint256" },
                  { name: "maker", type: "address" },
                  { name: "taker", type: "address" },
                  { name: "tokenA", type: "address" },
                  { name: "amountA", type: "uint256" },
                  { name: "tokenB", type: "address" },
                  { name: "amountB", type: "uint256" },
                  { name: "timestamp", type: "uint256" },
                ],
              },
            ],
          }] as const,
          functionName: "getDealsByAgent",
          args: [agentAddress as `0x${string}`, BigInt(limit)],
        })) as readonly any[];

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
              `  Time: ${new Date(Number(d.timestamp) * 1000).toISOString()}`,
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
