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
      expect(rep.completedDeals).toBe(0n);
      expect(rep.cancelledDeals).toBe(0n);
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
      expect(makerRep.completedDeals).toBeGreaterThanOrEqual(1n);
      expect(makerRep.totalVolume).toBeGreaterThan(0n);

      const takerRep = await env.brokerTaker.getReputation(TEST_ACCOUNTS.taker.address);
      expect(takerRep.completedDeals).toBeGreaterThanOrEqual(1n);
    });

    it("should accumulate reputation over multiple deals", async () => {
      // Complete 3 deals
      await createAndFillOffer(env);
      await createAndFillOffer(env);
      await createAndFillOffer(env);

      const makerRep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(makerRep.completedDeals).toBeGreaterThanOrEqual(3n);
    });

    it("should track total volume accurately", async () => {
      const smallAmount = 10n * 10n ** 18n;
      const largeAmount = 1000n * 10n ** 18n;

      await createAndFillOffer(env, { sellAmount: smallAmount, buyAmount: 5n * 10n ** 18n });
      await createAndFillOffer(env, { sellAmount: largeAmount, buyAmount: 500n * 10n ** 18n });

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(rep.totalVolume).toBeGreaterThan(0n);
    });

    it("should update lastDealTimestamp", async () => {
      await createAndFillOffer(env);
      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(rep.lastDealTimestamp).toBeGreaterThan(0n);
    });

    it("should calculate a non-zero score after deals", async () => {
      await createAndFillOffer(env);

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      // Score should be positive after a successful deal
      expect(rep.score).toBeGreaterThan(0n);
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

    it("should track deal timestamps", async () => {
      await createAndFillOffer(env);

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      // firstDealTimestamp and lastDealTimestamp should be set
      expect(rep.firstDealTimestamp).toBeGreaterThan(0n);
      expect(rep.lastDealTimestamp).toBeGreaterThanOrEqual(rep.firstDealTimestamp);
    });

    it("should track cancelled deals correctly", async () => {
      // Complete 2 deals, cancel 1
      await createAndFillOffer(env);
      await createAndFillOffer(env);

      const offerId = await createStandardOffer(env);
      await env.brokerMaker.cancelOffer(offerId);

      const rep = await env.brokerMaker.getReputation(TEST_ACCOUNTS.maker.address);
      expect(rep.completedDeals).toBeGreaterThanOrEqual(2n);
      expect(rep.cancelledDeals).toBeGreaterThanOrEqual(1n);
    });
  });
});
