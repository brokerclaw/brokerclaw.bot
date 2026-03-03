import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { REPUTATION_ABI } from "../contracts/abi.js";
import { abbreviateAddress, formatTokenAmount, formatSuccessRate } from "../utils/format.js";

export function registerLeaderboardResource(server: McpServer): void {
  server.resource(
    "leaderboard",
    "brokers://leaderboard",
    {
      description: "Top agents by trading volume on the BROKER protocol",
      mimeType: "text/plain",
    },
    async (uri) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const leaderboard = (await client.readContract({
          address: addresses.reputation,
          abi: REPUTATION_ABI,
          functionName: "getLeaderboard",
          args: [25n],
        })) as readonly any[];

        if (leaderboard.length === 0) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "text/plain",
                text: "No agents on the leaderboard yet.",
              },
            ],
          };
        }

        const header = [
          "🏆 Brokers Bot Leaderboard",
          "═══════════════════════════════",
          "",
          "Rank | Agent          | Score | Deals | Volume           | Success",
          "─────┼────────────────┼───────┼───────┼──────────────────┼────────",
        ].join("\n");

        const rows = leaderboard
          .map((entry: any, i: number) => {
            const rank = String(i + 1).padStart(4);
            const agent = abbreviateAddress(entry.agent).padEnd(14);
            const score = String(entry.score).padStart(5);
            const deals = String(entry.totalDeals).padStart(5);
            const volume = formatTokenAmount(entry.totalVolume).padStart(16);
            const success = formatSuccessRate(entry.successRate).padStart(6);
            return `${rank} | ${agent} | ${score} | ${deals} | ${volume} | ${success}`;
          })
          .join("\n");

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `${header}\n${rows}`,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error fetching leaderboard: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );
}
