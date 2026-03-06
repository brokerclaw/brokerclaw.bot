import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert, getBlockTimestamp } from "../src/setup.js";
import { getBalance, futureTimestamp } from "../src/helpers.js";
import { BrokerClient, OfferStatus, RFQStatus } from "@brokerclaw/sdk";
import type { Address } from "viem";
import { AMOUNTS, TEST_ACCOUNTS, MCP_TOOLS } from "../src/fixtures.js";

/**
 * Mock MCP Server that simulates the BROKER MCP tools.
 * Each tool delegates to the BrokerClient SDK.
 */
class MockMCPServer {
  private tools: Map<string, (args: Record<string, string>) => Promise<unknown>>;

  constructor(private client: BrokerClient, private tokenA: Address, private tokenB: Address) {
    this.tools = new Map();
    this.registerTools();
  }

  private registerTools(): void {
    this.tools.set("brokers_create_offer", async (args) => {
      const sellToken = (args.sellToken ?? this.tokenA) as Address;
      const buyToken = (args.buyToken ?? this.tokenB) as Address;
      const sellAmount = BigInt(args.sellAmount);
      const buyAmount = BigInt(args.buyAmount);
      const deadline = args.deadline ? BigInt(args.deadline) : undefined;
      const minFillPercent = args.minFillPercent ? BigInt(args.minFillPercent) : undefined;

      const result = await this.client.createOffer({
        sellToken,
        buyToken,
        sellAmount,
        buyAmount,
        deadline,
        minFillPercent,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              offerId: result.offerId.toString(),
              hash: result.hash,
            }),
          },
        ],
      };
    });

    this.tools.set("brokers_fill_offer", async (args) => {
      const offerId = BigInt(args.offerId);
      const fillAmount = args.fillAmount ? BigInt(args.fillAmount) : undefined;

      const result = await this.client.fillOffer({ offerId, fillAmount });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              offerId: result.offerId.toString(),
              hash: result.hash,
            }),
          },
        ],
      };
    });

    this.tools.set("brokers_get_offer", async (args) => {
      const offerId = BigInt(args.offerId);
      const offer = await this.client.getOffer(offerId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: offer.id.toString(),
              maker: offer.maker,
              sellToken: offer.sellToken,
              buyToken: offer.buyToken,
              sellAmount: offer.sellAmount.toString(),
              buyAmount: offer.buyAmount.toString(),
              status: offer.status,
              deadline: offer.deadline.toString(),
            }),
          },
        ],
      };
    });

    this.tools.set("brokers_list_offers", async (args) => {
      const offers = await this.client.listOffers({
        maker: args.maker as Address | undefined,
        status: args.status !== undefined ? Number(args.status) as OfferStatus : undefined,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              offers.map((o) => ({
                id: o.id.toString(),
                maker: o.maker,
                status: o.status,
                sellAmount: o.sellAmount.toString(),
                buyAmount: o.buyAmount.toString(),
              }))
            ),
          },
        ],
      };
    });

    this.tools.set("brokers_request_quote", async (args) => {
      const sellToken = (args.sellToken ?? this.tokenA) as Address;
      const buyToken = (args.buyToken ?? this.tokenB) as Address;
      const sellAmount = BigInt(args.sellAmount);
      const deadline = args.deadline ? BigInt(args.deadline) : undefined;

      const result = await this.client.requestQuote({
        sellToken,
        buyToken,
        sellAmount,
        deadline,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              rfqId: result.rfqId.toString(),
              hash: result.hash,
            }),
          },
        ],
      };
    });

    this.tools.set("brokers_get_reputation", async (args) => {
      const agent = args.agent as Address;
      const rep = await this.client.getReputation(agent);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              agent: rep.agent,
              totalDeals: rep.totalDeals.toString(),
              successfulDeals: rep.successfulDeals.toString(),
              score: rep.score.toString(),
              totalVolume: rep.totalVolume.toString(),
            }),
          },
        ],
      };
    });
  }

  /** List available tools (simulates MCP tools/list) */
  listTools() {
    return {
      tools: MCP_TOOLS,
    };
  }

  /** Call a tool (simulates MCP tools/call) */
  async callTool(name: string, args: Record<string, string>): Promise<unknown> {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return handler(args);
  }
}

describe("MCP Integration", () => {
  let env: TestEnvironment;
  let snapshotId: `0x${string}`;
  let mcpServer: MockMCPServer;

  beforeAll(async () => {
    env = await setupTestEnvironment();
    mcpServer = new MockMCPServer(env.brokerMaker, env.tokenA, env.tokenB);
  });

  beforeEach(async () => {
    snapshotId = await snapshot(env.testClient);
  });

  afterEach(async () => {
    await revert(env.testClient, snapshotId);
  });

  describe("Tool Discovery", () => {
    it("should list all available broker tools", () => {
      const result = mcpServer.listTools();
      expect(result.tools.length).toBeGreaterThanOrEqual(6);

      const names = result.tools.map((t) => t.name);
      expect(names).toContain("brokers_create_offer");
      expect(names).toContain("brokers_fill_offer");
      expect(names).toContain("brokers_get_offer");
      expect(names).toContain("brokers_list_offers");
      expect(names).toContain("brokers_request_quote");
      expect(names).toContain("brokers_get_reputation");
    });

    it("should have correct input schemas for each tool", () => {
      const result = mcpServer.listTools();

      const createOffer = result.tools.find((t) => t.name === "brokers_create_offer");
      expect(createOffer).toBeDefined();
      expect(createOffer!.inputSchema.required).toContain("sellToken");
      expect(createOffer!.inputSchema.required).toContain("buyToken");
      expect(createOffer!.inputSchema.required).toContain("sellAmount");
      expect(createOffer!.inputSchema.required).toContain("buyAmount");
    });
  });

  describe("Create Offer via MCP", () => {
    it("should create an offer through the MCP tool", async () => {
      const now = await getBlockTimestamp(env.publicClient);

      const result = (await mcpServer.callTool("brokers_create_offer", {
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard.toString(),
        buyAmount: AMOUNTS.half.toString(),
        deadline: (now + 86400n).toString(),
      })) as { content: Array<{ type: string; text: string }> };

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");

      const data = JSON.parse(result.content[0].text);
      expect(data.offerId).toBeDefined();
      expect(data.hash).toBeDefined();
      expect(BigInt(data.offerId)).toBeGreaterThan(0n);
    });

    it("should create an offer and verify it on-chain via MCP", async () => {
      const now = await getBlockTimestamp(env.publicClient);

      // Create via MCP
      const createResult = (await mcpServer.callTool("brokers_create_offer", {
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard.toString(),
        buyAmount: AMOUNTS.half.toString(),
        deadline: (now + 86400n).toString(),
      })) as { content: Array<{ type: string; text: string }> };

      const createData = JSON.parse(createResult.content[0].text);

      // Get via MCP
      const getResult = (await mcpServer.callTool("brokers_get_offer", {
        offerId: createData.offerId,
      })) as { content: Array<{ type: string; text: string }> };

      const offerData = JSON.parse(getResult.content[0].text);
      expect(offerData.maker.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(offerData.sellToken.toLowerCase()).toBe(env.tokenA.toLowerCase());
      expect(offerData.buyToken.toLowerCase()).toBe(env.tokenB.toLowerCase());
      expect(offerData.status).toBe(OfferStatus.Open);
    });
  });

  describe("Fill Offer via MCP", () => {
    it("should fill an offer through the MCP tool", async () => {
      // Create offer with SDK
      const now = await getBlockTimestamp(env.publicClient);
      const { offerId } = await env.brokerMaker.createOffer({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
        deadline: now + 86400n,
      });

      // Fill via MCP (using taker's client)
      const takerMCP = new MockMCPServer(env.brokerTaker, env.tokenA, env.tokenB);
      const result = (await takerMCP.callTool("brokers_fill_offer", {
        offerId: offerId.toString(),
      })) as { content: Array<{ type: string; text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.hash).toBeDefined();

      // Verify filled
      const getResult = (await mcpServer.callTool("brokers_get_offer", {
        offerId: offerId.toString(),
      })) as { content: Array<{ type: string; text: string }> };

      const offerData = JSON.parse(getResult.content[0].text);
      expect(offerData.status).toBe(OfferStatus.Filled);
    });
  });

  describe("List Offers via MCP", () => {
    it("should list offers through the MCP tool", async () => {
      // Create a few offers
      const now = await getBlockTimestamp(env.publicClient);
      for (let i = 0; i < 3; i++) {
        await env.brokerMaker.createOffer({
          sellToken: env.tokenA,
          buyToken: env.tokenB,
          sellAmount: AMOUNTS.small,
          buyAmount: AMOUNTS.small / 2n,
          deadline: now + 86400n,
        });
      }

      const result = (await mcpServer.callTool("brokers_list_offers", {
        maker: TEST_ACCOUNTS.maker.address,
      })) as { content: Array<{ type: string; text: string }> };

      const offers = JSON.parse(result.content[0].text);
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Request Quote via MCP", () => {
    it("should create an RFQ through the MCP tool", async () => {
      const now = await getBlockTimestamp(env.publicClient);

      const result = (await mcpServer.callTool("brokers_request_quote", {
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard.toString(),
        deadline: (now + 3600n).toString(),
      })) as { content: Array<{ type: string; text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.rfqId).toBeDefined();
      expect(BigInt(data.rfqId)).toBeGreaterThan(0n);
    });
  });

  describe("Get Reputation via MCP", () => {
    it("should return reputation data through the MCP tool", async () => {
      const result = (await mcpServer.callTool("brokers_get_reputation", {
        agent: TEST_ACCOUNTS.maker.address,
      })) as { content: Array<{ type: string; text: string }> };

      const data = JSON.parse(result.content[0].text);
      expect(data.agent.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(data.totalDeals).toBeDefined();
      expect(data.score).toBeDefined();
    });

    it("should reflect reputation changes after deals", async () => {
      // Get initial reputation
      const beforeResult = (await mcpServer.callTool("brokers_get_reputation", {
        agent: TEST_ACCOUNTS.maker.address,
      })) as { content: Array<{ type: string; text: string }> };
      const before = JSON.parse(beforeResult.content[0].text);

      // Create and fill an offer
      const now = await getBlockTimestamp(env.publicClient);
      const { offerId } = await env.brokerMaker.createOffer({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
        deadline: now + 86400n,
      });
      await env.brokerTaker.fillOffer({ offerId });

      // Check updated reputation
      const afterResult = (await mcpServer.callTool("brokers_get_reputation", {
        agent: TEST_ACCOUNTS.maker.address,
      })) as { content: Array<{ type: string; text: string }> };
      const after = JSON.parse(afterResult.content[0].text);

      expect(BigInt(after.totalDeals)).toBeGreaterThanOrEqual(BigInt(before.totalDeals));
    });
  });

  describe("Error Handling", () => {
    it("should throw for unknown tools", async () => {
      await expect(
        mcpServer.callTool("brokers_nonexistent", {})
      ).rejects.toThrow("Unknown tool: brokers_nonexistent");
    });

    it("should propagate contract errors through MCP", async () => {
      // Try to fill a non-existent offer
      await expect(
        mcpServer.callTool("brokers_fill_offer", {
          offerId: "999999",
        })
      ).rejects.toThrow();
    });

    it("should handle invalid arguments gracefully", async () => {
      await expect(
        mcpServer.callTool("brokers_create_offer", {
          sellToken: "not-an-address",
          buyToken: env.tokenB,
          sellAmount: AMOUNTS.standard.toString(),
          buyAmount: AMOUNTS.half.toString(),
        })
      ).rejects.toThrow();
    });
  });

  describe("Full MCP Workflow", () => {
    it("should complete a full trade via MCP tools only", async () => {
      const takerMCP = new MockMCPServer(env.brokerTaker, env.tokenA, env.tokenB);
      const now = await getBlockTimestamp(env.publicClient);

      // 1. Create offer via MCP
      const createResult = (await mcpServer.callTool("brokers_create_offer", {
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard.toString(),
        buyAmount: AMOUNTS.half.toString(),
        deadline: (now + 86400n).toString(),
      })) as { content: Array<{ type: string; text: string }> };

      const { offerId } = JSON.parse(createResult.content[0].text);

      // 2. Verify offer via MCP
      const getResult = (await mcpServer.callTool("brokers_get_offer", {
        offerId,
      })) as { content: Array<{ type: string; text: string }> };
      const offerBefore = JSON.parse(getResult.content[0].text);
      expect(offerBefore.status).toBe(OfferStatus.Open);

      // 3. Fill offer via MCP (taker)
      const fillResult = (await takerMCP.callTool("brokers_fill_offer", {
        offerId,
      })) as { content: Array<{ type: string; text: string }> };
      const fillData = JSON.parse(fillResult.content[0].text);
      expect(fillData.hash).toBeDefined();

      // 4. Verify filled via MCP
      const verifyResult = (await mcpServer.callTool("brokers_get_offer", {
        offerId,
      })) as { content: Array<{ type: string; text: string }> };
      const offerAfter = JSON.parse(verifyResult.content[0].text);
      expect(offerAfter.status).toBe(OfferStatus.Filled);

      // 5. Check reputation via MCP
      const repResult = (await mcpServer.callTool("brokers_get_reputation", {
        agent: TEST_ACCOUNTS.maker.address,
      })) as { content: Array<{ type: string; text: string }> };
      const rep = JSON.parse(repResult.content[0].text);
      expect(BigInt(rep.totalDeals)).toBeGreaterThanOrEqual(1n);
    });
  });
});
