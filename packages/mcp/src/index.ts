import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
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
 *   PORT                — HTTP port (defaults to 3001)
 */

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "brokerclaw-protocol",
    version: "0.1.0",
  });

  registerOfferTools(server);
  registerRfqTools(server);
  registerReputationTools(server);
  registerMarketTools(server);

  registerOffersResource(server);
  registerRfqResource(server);
  registerDealsResource(server);
  registerLeaderboardResource(server);

  return server;
}

async function startStdio(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Brokers Bot MCP server running on stdio");
}

async function startHttp(): Promise<void> {
  const port = parseInt(process.env.PORT || "3001", 10);

  // Track transports by session ID for stateful mode
  const transports = new Map<string, StreamableHTTPServerTransport>();
  // Track SSE transports for legacy /sse endpoint
  const sseTransports = new Map<string, SSEServerTransport>();

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    // Health check
    if (url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Legacy SSE endpoint — GET /sse opens SSE stream, POST /messages sends messages
    if (url.pathname === "/sse") {
      const transport = new SSEServerTransport("/messages", res);
      const server = createMcpServer();
      sseTransports.set(transport.sessionId, transport);

      res.on("close", () => {
        sseTransports.delete(transport.sessionId);
      });

      await server.connect(transport);
      return;
    }

    if (url.pathname === "/messages") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId || !sseTransports.has(sessionId)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or missing session ID" }));
        return;
      }
      const transport = sseTransports.get(sessionId)!;
      await transport.handlePostMessage(req, res);
      return;
    }

    // Only handle /mcp endpoint for streamable HTTP
    if (url.pathname !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    // Handle POST (new session or existing session messages)
    if (req.method === "POST") {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        // Existing session
        transport = transports.get(sessionId)!;
      } else if (!sessionId) {
        // New session — create server + transport
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        const server = createMcpServer();
        await server.connect(transport);

        // Store by session ID once connected
        if (transport.sessionId) {
          transports.set(transport.sessionId, transport);
        }

        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
          }
        };
      } else {
        // Invalid session ID
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session not found" }));
        return;
      }

      await transport.handleRequest(req, res);
      return;
    }

    // Handle GET (SSE stream for server-initiated messages)
    if (req.method === "GET") {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (!sessionId || !transports.has(sessionId)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Session ID required" }));
        return;
      }
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res);
      return;
    }

    // Handle DELETE (close session)
    if (req.method === "DELETE") {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        await transport.close();
        transports.delete(sessionId);
      }
      res.writeHead(200);
      res.end();
      return;
    }

    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
  });

  httpServer.listen(port, () => {
    console.log(`Brokers Bot MCP server listening on http://0.0.0.0:${port}/mcp`);
  });
}

async function main(): Promise<void> {
  if (process.argv.includes("--stdio")) {
    await startStdio();
  } else {
    await startHttp();
  }
}

main().catch((error) => {
  console.error("Fatal error starting Brokers Bot MCP server:", error);
  process.exit(1);
});
