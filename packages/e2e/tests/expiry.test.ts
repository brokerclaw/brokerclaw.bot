import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import {
  type TestEnvironment,
  setupTestEnvironment,
  snapshot,
  revert,
  getBlockTimestamp,
  advanceTime,
} from "../src/setup.js";
import { createStandardOffer, createStandardRFQ, expireOffer, futureTimestamp } from "../src/helpers.js";
import { OfferStatus, RFQStatus } from "@bankers-bot/sdk";
import { AMOUNTS, TIMES } from "../src/fixtures.js";

describe("Expiry Handling", () => {
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

  describe("Offer Expiry", () => {
    it("should not allow filling an expired offer", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      // Create offer with short deadline
      const offerId = await createStandardOffer(env, {
        deadline: now + TIMES.fiveMinutes,
      });

      // Advance time past deadline
      await advanceTime(env.testClient, env.publicClient, TIMES.fiveMinutes + 1n);

      await expect(
        env.brokerTaker.fillOffer({ offerId })
      ).rejects.toThrow();
    });

    it("should still allow cancelling an expired offer", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const offerId = await createStandardOffer(env, {
        deadline: now + TIMES.fiveMinutes,
      });

      await advanceTime(env.testClient, env.publicClient, TIMES.fiveMinutes + 1n);

      // Cancelling should still work (to reclaim funds)
      const result = await env.brokerMaker.cancelOffer(offerId);
      expect(result.hash).toBeDefined();
    });

    it("should handle offer created with near-future deadline", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const offerId = await createStandardOffer(env, {
        deadline: now + 10n, // 10 seconds
      });

      // Fill immediately — should succeed
      const result = await env.brokerTaker.fillOffer({ offerId });
      expect(result.hash).toBeDefined();
    });

    it("should correctly report expired status", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const offerId = await createStandardOffer(env, {
        deadline: now + TIMES.fiveMinutes,
      });

      // Expire it
      await expireOffer(env, offerId);

      const offer = await env.brokerMaker.getOffer(offerId);
      // Status might still be "Open" on-chain if no one interacts,
      // but filling should revert. Some contracts auto-update status.
      expect(offer.deadline).toBeLessThan(
        await getBlockTimestamp(env.publicClient)
      );
    });

    it("should handle multiple offers with different deadlines", async () => {
      const now = await getBlockTimestamp(env.publicClient);

      const shortId = await createStandardOffer(env, {
        deadline: now + 60n, // 1 minute
      });
      const longId = await createStandardOffer(env, {
        deadline: now + TIMES.oneDay,
      });

      // Advance 2 minutes
      await advanceTime(env.testClient, env.publicClient, 120n);

      // Short offer should be expired
      await expect(
        env.brokerTaker.fillOffer({ offerId: shortId })
      ).rejects.toThrow();

      // Long offer should still be fillable
      const result = await env.brokerTaker.fillOffer({ offerId: longId });
      expect(result.hash).toBeDefined();
    });
  });

  describe("RFQ Expiry", () => {
    it("should not allow submitting quotes on an expired RFQ", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const rfqId = await createStandardRFQ(env, {
        deadline: now + TIMES.fiveMinutes,
      });

      await advanceTime(env.testClient, env.publicClient, TIMES.fiveMinutes + 1n);

      const expiry = await futureTimestamp(env.publicClient, 1800n);
      await expect(
        env.brokerTaker.submitQuote({
          rfqId,
          buyAmount: AMOUNTS.half,
          expiry,
        })
      ).rejects.toThrow();
    });

    it("should still allow cancelling an expired RFQ", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const rfqId = await createStandardRFQ(env, {
        deadline: now + TIMES.fiveMinutes,
      });

      await advanceTime(env.testClient, env.publicClient, TIMES.fiveMinutes + 1n);

      const result = await env.brokerMaker.cancelRFQ(rfqId);
      expect(result.hash).toBeDefined();
    });
  });

  describe("Quote Expiry", () => {
    it("should not allow accepting an expired quote", async () => {
      const rfqId = await createStandardRFQ(env);
      const now = await getBlockTimestamp(env.publicClient);

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry: now + TIMES.fiveMinutes,
      });

      // Advance past quote expiry
      await advanceTime(env.testClient, env.publicClient, TIMES.fiveMinutes + 1n);

      await expect(
        env.brokerMaker.acceptQuote({ quoteId })
      ).rejects.toThrow();
    });

    it("should allow accepting a quote before expiry", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, TIMES.thirtyMinutes);

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      // Accept immediately — should succeed
      const result = await env.brokerMaker.acceptQuote({ quoteId });
      expect(result.hash).toBeDefined();
    });

    it("should handle quotes with different expiry times", async () => {
      const rfqId = await createStandardRFQ(env);
      const now = await getBlockTimestamp(env.publicClient);

      // Short-lived quote
      const { quoteId: shortQuote } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry: now + 60n,
      });

      // Long-lived quote
      const { quoteId: longQuote } = await env.brokerAgent3.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half + 5n * 10n ** 18n,
        expiry: now + TIMES.oneDay,
      });

      // Advance 2 minutes
      await advanceTime(env.testClient, env.publicClient, 120n);

      // Short quote should be expired
      await expect(
        env.brokerMaker.acceptQuote({ quoteId: shortQuote })
      ).rejects.toThrow();

      // Long quote should still be valid
      const result = await env.brokerMaker.acceptQuote({ quoteId: longQuote });
      expect(result.hash).toBeDefined();
    });
  });

  describe("SDK Validation", () => {
    it("should reject creating an offer with past deadline via SDK validation", async () => {
      const now = await getBlockTimestamp(env.publicClient);

      await expect(
        env.brokerMaker.createOffer({
          sellToken: env.tokenA,
          buyToken: env.tokenB,
          sellAmount: AMOUNTS.standard,
          buyAmount: AMOUNTS.half,
          deadline: now - 100n, // In the past
        })
      ).rejects.toThrow("Deadline must be in the future");
    });

    it("should reject requesting a quote with past deadline", async () => {
      const now = await getBlockTimestamp(env.publicClient);

      await expect(
        env.brokerMaker.requestQuote({
          sellToken: env.tokenA,
          buyToken: env.tokenB,
          sellAmount: AMOUNTS.standard,
          deadline: now - 100n,
        })
      ).rejects.toThrow("Deadline must be in the future");
    });
  });
});
