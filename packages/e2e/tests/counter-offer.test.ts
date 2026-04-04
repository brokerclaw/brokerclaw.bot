import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert, getBlockTimestamp } from "../src/setup.js";
import { createStandardOffer, getBalance } from "../src/helpers.js";
import { OfferStatus } from "@brokerclaw/sdk";
import { AMOUNTS, TEST_ACCOUNTS } from "../src/fixtures.js";

describe("Counter-Offer Negotiation", () => {
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

  describe("Create Counter-Offer", () => {
    it("should create a counter-offer referencing the original", async () => {
      // Maker creates: sell 100 tokenA for 50 tokenB
      const originalId = await createStandardOffer(env);

      // Taker counter-offers with a new amountB (contract reverses tokens internally)
      const result = await env.brokerTaker.counterOffer({
        originalOfferId: originalId,
        newAmountB: 40n * 10n ** 18n,
      });

      expect(result.hash).toBeDefined();
      expect(result.offerId).toBeGreaterThan(0n);
      expect(result.offerId).not.toBe(originalId);

      // Counter-offer should be a valid open offer
      const counterOffer = await env.brokerTaker.getOffer(result.offerId);
      expect(counterOffer.status).toBe(OfferStatus.Open);
      expect(counterOffer.maker.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
      expect(counterOffer.originalOfferId).toBe(originalId);
    });

    it("should allow counter-offer on an already-open offer", async () => {
      const originalId = await createStandardOffer(env);

      // Both should succeed -- original stays open, counter is new
      const counter = await env.brokerTaker.counterOffer({
        originalOfferId: originalId,
        newAmountB: 45n * 10n ** 18n,
      });

      const original = await env.brokerMaker.getOffer(originalId);
      expect(original.status).toBe(OfferStatus.Open);

      const counterOffer = await env.brokerTaker.getOffer(counter.offerId);
      expect(counterOffer.status).toBe(OfferStatus.Open);
    });

    it("should auto-approve tokens for counter-offer", async () => {
      const originalId = await createStandardOffer(env);

      const result = await env.brokerTaker.counterOffer({
        originalOfferId: originalId,
        newAmountB: 45n * 10n ** 18n,
      });

      expect(result.offerId).toBeGreaterThan(0n);
    });

    it("should deduct tokens from counter-offerer's balance", async () => {
      const originalId = await createStandardOffer(env);

      const balanceBefore = await getBalance(
        env.publicClient,
        env.tokenB,
        TEST_ACCOUNTS.taker.address
      );

      await env.brokerTaker.counterOffer({
        originalOfferId: originalId,
        newAmountB: 45n * 10n ** 18n,
      });

      const balanceAfter = await getBalance(
        env.publicClient,
        env.tokenB,
        TEST_ACCOUNTS.taker.address
      );

      // Balance should have decreased (contract handles the exact token amounts)
      expect(balanceBefore).toBeGreaterThan(balanceAfter);
    });
  });

  describe("Negotiation Flow", () => {
    it("should support a back-and-forth negotiation", async () => {
      // Step 1: Maker offers 100 tokenA for 50 tokenB
      const offer1Id = await createStandardOffer(env, {
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
      });

      // Step 2: Taker counter-offers with newAmountB of 40 tokenB
      const counter1 = await env.brokerTaker.counterOffer({
        originalOfferId: offer1Id,
        newAmountB: 40n * 10n ** 18n,
      });

      // Step 3: Maker counter-offers again with 45 tokenB (compromise)
      const counter2 = await env.brokerMaker.counterOffer({
        originalOfferId: counter1.offerId,
        newAmountB: 45n * 10n ** 18n,
      });

      // Step 4: Taker accepts by filling the latest counter-offer
      await env.brokerTaker.fillOffer({ offerId: counter2.offerId });

      // Verify final state
      const finalOffer = await env.brokerMaker.getOffer(counter2.offerId);
      expect(finalOffer.status).toBe(OfferStatus.Filled);
      expect(finalOffer.taker.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
    });

    it("should allow filling the original after counter-offer", async () => {
      const originalId = await createStandardOffer(env);

      // Taker creates a counter, but another agent fills the original
      await env.brokerTaker.counterOffer({
        originalOfferId: originalId,
        newAmountB: 40n * 10n ** 18n,
      });

      // Agent3 fills the original offer at the original terms
      await env.brokerAgent3.fillOffer({ offerId: originalId });

      const original = await env.brokerMaker.getOffer(originalId);
      expect(original.status).toBe(OfferStatus.Filled);
      expect(original.taker.toLowerCase()).toBe(TEST_ACCOUNTS.agent3.address.toLowerCase());
    });

    it("should allow cancelling a counter-offer", async () => {
      const originalId = await createStandardOffer(env);

      const counter = await env.brokerTaker.counterOffer({
        originalOfferId: originalId,
        newAmountB: 40n * 10n ** 18n,
      });

      await env.brokerTaker.cancelOffer(counter.offerId);

      const cancelled = await env.brokerTaker.getOffer(counter.offerId);
      expect(cancelled.status).toBe(OfferStatus.Cancelled);

      // Original should still be open
      const original = await env.brokerMaker.getOffer(originalId);
      expect(original.status).toBe(OfferStatus.Open);
    });
  });

  describe("Edge Cases", () => {
    it("should reject counter-offer with zero newAmountB", async () => {
      const originalId = await createStandardOffer(env);

      await expect(
        env.brokerTaker.counterOffer({
          originalOfferId: originalId,
          newAmountB: 0n,
        })
      ).rejects.toThrow();
    });
  });
});
