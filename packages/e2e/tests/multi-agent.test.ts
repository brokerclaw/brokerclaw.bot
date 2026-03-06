import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert, getBlockTimestamp } from "../src/setup.js";
import { createStandardOffer, getBalance, futureTimestamp } from "../src/helpers.js";
import { OfferStatus } from "@brokerclaw/sdk";
import { AMOUNTS, TEST_ACCOUNTS } from "../src/fixtures.js";

describe("Multi-Agent Trading", () => {
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

  describe("Concurrent Offers", () => {
    it("should handle multiple agents creating offers simultaneously", async () => {
      const [id1, id2, id3] = await Promise.all([
        createStandardOffer(env, { maker: env.brokerMaker }),
        createStandardOffer(env, { maker: env.brokerTaker }),
        createStandardOffer(env, { maker: env.brokerAgent3 }),
      ]);

      // All offers should be created with unique IDs
      expect(new Set([id1, id2, id3]).size).toBe(3);

      // All should be open
      const [o1, o2, o3] = await Promise.all([
        env.brokerMaker.getOffer(id1),
        env.brokerMaker.getOffer(id2),
        env.brokerMaker.getOffer(id3),
      ]);

      expect(o1.status).toBe(OfferStatus.Open);
      expect(o2.status).toBe(OfferStatus.Open);
      expect(o3.status).toBe(OfferStatus.Open);

      // Verify different makers
      expect(o1.maker.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(o2.maker.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
      expect(o3.maker.toLowerCase()).toBe(TEST_ACCOUNTS.agent3.address.toLowerCase());
    });

    it("should allow different agents to fill different offers", async () => {
      // Agent3 and Agent4 create offers
      const offer1 = await createStandardOffer(env, { maker: env.brokerAgent3 });
      const offer2 = await createStandardOffer(env, { maker: env.brokerAgent4 });

      // Maker fills agent3's offer, taker fills agent4's offer
      await env.brokerMaker.fillOffer({ offerId: offer1 });
      await env.brokerTaker.fillOffer({ offerId: offer2 });

      const o1 = await env.brokerMaker.getOffer(offer1);
      const o2 = await env.brokerMaker.getOffer(offer2);

      expect(o1.status).toBe(OfferStatus.Filled);
      expect(o1.filler.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(o2.status).toBe(OfferStatus.Filled);
      expect(o2.filler.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
    });

    it("should handle an agent being both maker and taker in different offers", async () => {
      // Maker creates an offer
      const offer1 = await createStandardOffer(env, {
        maker: env.brokerMaker,
        sellToken: env.tokenA,
        buyToken: env.tokenB,
      });

      // Taker creates an offer in the opposite direction
      const offer2 = await createStandardOffer(env, {
        maker: env.brokerTaker,
        sellToken: env.tokenB,
        buyToken: env.tokenA,
      });

      // Each fills the other's offer
      await env.brokerTaker.fillOffer({ offerId: offer1 });
      await env.brokerMaker.fillOffer({ offerId: offer2 });

      const o1 = await env.brokerMaker.getOffer(offer1);
      const o2 = await env.brokerMaker.getOffer(offer2);

      expect(o1.status).toBe(OfferStatus.Filled);
      expect(o2.status).toBe(OfferStatus.Filled);
    });
  });

  describe("Competitive Filling", () => {
    it("should only allow the first filler to succeed", async () => {
      const offerId = await createStandardOffer(env);

      // Taker fills first
      await env.brokerTaker.fillOffer({ offerId });

      // Agent3 tries to fill the same offer — should fail
      await expect(
        env.brokerAgent3.fillOffer({ offerId })
      ).rejects.toThrow();

      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.filler.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
    });
  });

  describe("Multi-Agent RFQ", () => {
    it("should allow multiple agents to compete on an RFQ", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const deadline = now + 3600n;

      // Maker requests a quote
      const { rfqId } = await env.brokerMaker.requestQuote({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        deadline,
      });

      const expiry = await futureTimestamp(env.publicClient, 1800n);

      // Multiple agents submit quotes
      const quote1 = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: 50n * 10n ** 18n,
        expiry,
      });

      const quote2 = await env.brokerAgent3.submitQuote({
        rfqId,
        buyAmount: 55n * 10n ** 18n, // Better price
        expiry,
      });

      const quote3 = await env.brokerAgent4.submitQuote({
        rfqId,
        buyAmount: 52n * 10n ** 18n,
        expiry,
      });

      // All quotes should exist
      const quotes = await env.brokerMaker.listQuotes({ rfqId });
      expect(quotes.length).toBe(3);

      // Maker accepts the best quote (quote2)
      await env.brokerMaker.acceptQuote({ quoteId: quote2.quoteId });

      const q2 = await env.brokerMaker.getQuote(quote2.quoteId);
      expect(q2.accepted).toBe(true);
    });
  });

  describe("Cross-Token Trading", () => {
    it("should handle agents trading different token pairs", async () => {
      // Offer 1: tokenA -> tokenB
      const offer1 = await createStandardOffer(env, {
        maker: env.brokerMaker,
        sellToken: env.tokenA,
        buyToken: env.tokenB,
      });

      // Offer 2: tokenB -> tokenA (reverse)
      const offer2 = await createStandardOffer(env, {
        maker: env.brokerAgent3,
        sellToken: env.tokenB,
        buyToken: env.tokenA,
      });

      // Offer 3: tokenA -> USDC
      const offer3 = await createStandardOffer(env, {
        maker: env.brokerAgent4,
        sellToken: env.tokenA,
        buyToken: env.usdc,
        buyAmount: 100n * 10n ** 6n, // 100 USDC
      });

      // Fill all offers
      await env.brokerTaker.fillOffer({ offerId: offer1 });
      await env.brokerAgent4.fillOffer({ offerId: offer2 });
      await env.brokerTaker.fillOffer({ offerId: offer3 });

      // Verify all filled
      const [o1, o2, o3] = await Promise.all([
        env.brokerMaker.getOffer(offer1),
        env.brokerMaker.getOffer(offer2),
        env.brokerMaker.getOffer(offer3),
      ]);

      expect(o1.status).toBe(OfferStatus.Filled);
      expect(o2.status).toBe(OfferStatus.Filled);
      expect(o3.status).toBe(OfferStatus.Filled);
    });
  });

  describe("High-Volume Scenario", () => {
    it("should handle 10 sequential offers from a single maker", async () => {
      const offerIds: bigint[] = [];

      for (let i = 0; i < 10; i++) {
        const id = await createStandardOffer(env, {
          sellAmount: AMOUNTS.small, // Use small amounts to avoid running out
        });
        offerIds.push(id);
      }

      expect(offerIds.length).toBe(10);

      // Fill half, cancel the rest
      for (let i = 0; i < 5; i++) {
        await env.brokerTaker.fillOffer({ offerId: offerIds[i] });
      }
      for (let i = 5; i < 10; i++) {
        await env.brokerMaker.cancelOffer(offerIds[i]);
      }

      // Verify states
      for (let i = 0; i < 10; i++) {
        const offer = await env.brokerMaker.getOffer(offerIds[i]);
        if (i < 5) {
          expect(offer.status).toBe(OfferStatus.Filled);
        } else {
          expect(offer.status).toBe(OfferStatus.Cancelled);
        }
      }
    });
  });

  describe("Balance Consistency", () => {
    it("should maintain correct balances across multiple operations", async () => {
      const makerA_start = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.maker.address);
      const makerB_start = await getBalance(env.publicClient, env.tokenB, TEST_ACCOUNTS.maker.address);
      const takerA_start = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.taker.address);
      const takerB_start = await getBalance(env.publicClient, env.tokenB, TEST_ACCOUNTS.taker.address);

      // Maker creates and taker fills an offer
      const offerId = await createStandardOffer(env, {
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
      });
      await env.brokerTaker.fillOffer({ offerId });

      const makerA_end = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.maker.address);
      const makerB_end = await getBalance(env.publicClient, env.tokenB, TEST_ACCOUNTS.maker.address);
      const takerA_end = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.taker.address);
      const takerB_end = await getBalance(env.publicClient, env.tokenB, TEST_ACCOUNTS.taker.address);

      // Maker lost tokenA
      expect(makerA_start - makerA_end).toBe(AMOUNTS.standard);
      // Maker gained some tokenB (minus any fees)
      expect(makerB_end).toBeGreaterThan(makerB_start);

      // Taker gained some tokenA (minus fees)
      expect(takerA_end).toBeGreaterThan(takerA_start);
      // Taker lost tokenB
      expect(takerB_start - takerB_end).toBeGreaterThanOrEqual(AMOUNTS.half);
    });
  });
});
