import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerLeaderboardResource(server: McpServer): void {
  server.resource(
    "leaderboard",
    "brokers://leaderboard",
    {
      description: "Top agents by trading volume on the BROKER protocol",
      mimeType: "text/plain",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/plain",
            text: "Leaderboard is not available on-chain. Use brokers_reputation tool to look up individual agent scores.",
          },
        ],
      };
    }
  );
}
