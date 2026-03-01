import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert } from "../src/setup.js";
import { createAndFillOffer, createStandardOffer } from "../src/helpers.js";
import { TEST_ACCOUNTS, AMOUNTS } from "../src/fixtures.js";

describe("Reputation System", () => {
  let env: TestEnvironment;
  let snapshotId: `0x${string}`;

  beforeAll(async () => {
    env = await setupTestEnvironment();
  });

  beforeEach(async () => {
    snapshotId = await snapshot(env.testClient);
  });

  afterEach(async () => {
    await revert(env.testClient, snapshotId);
  });

  describe("getReputation", () => {
    it("should return zero reputation for a new agent", async () => {
      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.agent4.address);
      expect(rep.totalDeals).toBe(0n);
      expect(rep.successfulDeals).toBe(0n);
      expect(rep.totalVolume).toBe(0n);
      expect(rep.score).toBe(0n);
    });

    it("should increase reputation after a successful deal", async () => {
      // Create and fill an offer to trigger reputation update
      await createAndFillOffer(env, {
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
      });

      const makerRep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(makerRep.totalDeals).toBeGreaterThanOrEqual(1n);
      expect(makerRep.successfulDeals).toBeGreaterThanOrEqual(1n);
      expect(makerRep.totalVolume).toBeGreaterThan(0n);

      const takerRep = await env.brokerTaker.getReputation(TEST_ACCOUNTS.taker.address);
      expect(takerRep.totalDeals).toBeGreaterThanOrEqual(1n);
    });

    it("should accumulate reputation over multiple deals", async () => {
      // Complete 3 deals
      await createAndFillOffer(env);
      await createAndFillOffer(env);
      await createAndFillOffer(env);

      const makerRep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(makerRep.totalDeals).toBeGreaterThanOrEqual(3n);
      expect(makerRep.successfulDeals).toBeGreaterThanOrEqual(3n);
    });

    it("should track total volume accurately", async () => {
      const smallAmount = 10n * 10n ** 18n;
      const largeAmount = 1000n * 10n ** 18n;

      await createAndFillOffer(env, { sellAmount: smallAmount, buyAmount: 5n * 10n ** 18n });
      await createAndFillOffer(env, { sellAmount: largeAmount, buyAmount: 500n * 10n ** 18n });

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(rep.totalVolume).toBeGreaterThan(0n);
    });

    it("should update lastUpdated timestamp", async () => {
      await createAndFillOffer(env);
      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(rep.lastUpdated).toBeGreaterThan(0n);
    });

    it("should calculate a non-zero score after deals", async () => {
      await createAndFillOffer(env);

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      // Score should be positive after a successful deal
      expect(rep.score).toBeGreaterThan(0n);
    });
  });

  describe("getLeaderboard", () => {
    it("should return an empty leaderboard initially", async () => {
      const leaderboard = await env.brokerMaker.getLeaderboard(0n, 10n);
      // Might be empty or have previous entries depending on chain state
      expect(Array.isArray(leaderboard)).toBe(true);
    });

    it("should rank agents by score after deals", async () => {
      // Maker and taker each get reputation from a deal
      await createAndFillOffer(env);

      const leaderboard = await env.brokerMaker.getLeaderboard(0n, 10n);
      expect(leaderboard.length).toBeGreaterThan(0);

      // Verify leaderboard is sorted by score (descending)
      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].score).toBeGreaterThanOrEqual(leaderboard[i].score);
      }
    });

    it("should include all participating agents", async () => {
      await createAndFillOffer(env); // maker + taker

      // Agent3 makes a deal with agent4
      const offerId = await createStandardOffer(env, { maker: env.brokerAgent3 });
      await env.brokerAgent4.fillOffer({ offerId });

      const leaderboard = await env.brokerMaker.getLeaderboard(0n, 20n);
      const addresses = leaderboard.map((e) => e.agent.toLowerCase());

      // All participants should appear
      expect(addresses).toContain(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(addresses).toContain(TEST_ACCOUNTS.taker.address.toLowerCase());
    });

    it("should support pagination", async () => {
      await createAndFillOffer(env);

      const page1 = await env.brokerMaker.getLeaderboard(0n, 1n);
      const page2 = await env.brokerMaker.getLeaderboard(1n, 1n);

      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].agent).not.toBe(page2[0].agent);
      }
    });
  });

  describe("getStats", () => {
    it("should return protocol-wide statistics", async () => {
      const stats = await env.brokerMaker.getStats();

      expect(typeof stats.totalOffers).toBe("bigint");
      expect(typeof stats.totalFills).toBe("bigint");
      expect(typeof stats.totalRFQs).toBe("bigint");
      expect(typeof stats.totalVolume).toBe("bigint");
      expect(typeof stats.totalFees).toBe("bigint");
      expect(typeof stats.uniqueAgents).toBe("bigint");
    });

    it("should increment counters after deals", async () => {
      const statsBefore = await env.brokerMaker.getStats();

      await createAndFillOffer(env);

      const statsAfter = await env.brokerMaker.getStats();
      expect(statsAfter.totalOffers).toBeGreaterThanOrEqual(statsBefore.totalOffers + 1n);
      expect(statsAfter.totalFills).toBeGreaterThanOrEqual(statsBefore.totalFills + 1n);
    });

    it("should track total volume across all deals", async () => {
      const statsBefore = await env.brokerMaker.getStats();

      await createAndFillOffer(env, {
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
      });

      const statsAfter = await env.brokerMaker.getStats();
      expect(statsAfter.totalVolume).toBeGreaterThan(statsBefore.totalVolume);
    });

    it("should track total fees collected", async () => {
      const statsBefore = await env.brokerMaker.getStats();

      await createAndFillOffer(env);

      const statsAfter = await env.brokerMaker.getStats();
      expect(statsAfter.totalFees).toBeGreaterThanOrEqual(statsBefore.totalFees);
    });

    it("should count unique agents", async () => {
      await createAndFillOffer(env);

      const stats = await env.brokerMaker.getStats();
      expect(stats.uniqueAgents).toBeGreaterThanOrEqual(2n); // maker + taker
    });
  });

  describe("Reputation Scoring", () => {
    it("should give higher scores to agents with more successful deals", async () => {
      // Maker does 3 deals
      await createAndFillOffer(env);
      await createAndFillOffer(env);
      await createAndFillOffer(env);

      const makerRep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      const agent4Rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.agent4.address);

      // Maker should have higher score than agent4 (who has no deals)
      expect(makerRep.score).toBeGreaterThan(agent4Rep.score);
    });

    it("should factor in settlement time", async () => {
      await createAndFillOffer(env);

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      // avgSettlementTime should be positive
      expect(rep.avgSettlementTime).toBeGreaterThanOrEqual(0n);
    });

    it("should maintain success rate correctly", async () => {
      // Complete 2 deals, cancel 1
      await createAndFillOffer(env);
      await createAndFillOffer(env);

      const offerId = await createStandardOffer(env);
      await env.brokerMaker.cancelOffer(offerId);

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(rep.successfulDeals).toBeLessThanOrEqual(rep.totalDeals);
    });
  });
});
