import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Tools
import { registerOfferTools } from "./tools/offers.js";
import { registerRfqTools } from "./tools/rfq.js";
import { registerReputationTools } from "./tools/reputation.js";
import { registerMarketTools } from "./tools/market.js";

// Resources
import { registerOffersResource } from "./resources/offers.js";
import { registerRfqResource } from "./resources/rfq.js";
import { registerDealsResource } from "./resources/deals.js";
import { registerLeaderboardResource } from "./resources/leaderboard.js";

/**
 * Brokers Bot MCP Server
 *
 * Provides AI agents with tools and resources to interact with the
 * Brokers Bot OTC trading protocol on Base.
 *
 * Environment variables:
 *   BROKER_PRIVATE_KEY  — Hex private key for signing transactions (required for write ops)
 *   BROKER_RPC_URL      — Custom RPC endpoint (defaults to public Base RPC)
 *   BROKER_CHAIN        — "mainnet" | "testnet" (defaults to "mainnet")
 */
async function main(): Promise<void> {
  const server = new McpServer({
    name: "brokers-bot-protocol",
    version: "0.1.0",
  });

  // Register all tools
  registerOfferTools(server);
  registerRfqTools(server);
  registerReputationTools(server);
  registerMarketTools(server);

  // Register all resources
  registerOffersResource(server);
  registerRfqResource(server);
  registerDealsResource(server);
  registerLeaderboardResource(server);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol messages)
  console.error("Brokers Bot MCP server started (stdio transport)");
}

main().catch((error) => {
  console.error("Fatal error starting Brokers Bot MCP server:", error);
  process.exit(1);
});
