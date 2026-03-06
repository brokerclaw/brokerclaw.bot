import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert, getBlockTimestamp } from "../src/setup.js";
import { createStandardOffer, getBalance } from "../src/helpers.js";
import { OfferStatus } from "@brokerclaw/sdk";
import { AMOUNTS, TEST_ACCOUNTS } from "../src/fixtures.js";

describe("Offer Lifecycle", () => {
  let env: TestEnvironment;
  let snapshotId: `0x${string}`;

  beforeAll(async () => {
    env = await setupTestEnvironment();
  });

  beforeEach(async () => {
    snapshotId = await snapshot(env.testClient);
  });

  // afterEach would revert, but with singleFork we handle it per-test
  afterEach(async () => {
    await revert(env.testClient, snapshotId);
  });

  describe("Create Offer", () => {
    it("should create an offer with correct parameters", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const deadline = now + 86400n;

      const result = await env.brokerMaker.createOffer({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
        deadline,
      });

      expect(result.hash).toBeDefined();
      expect(result.offerId).toBeGreaterThan(0n);

      const offer = await env.brokerMaker.getOffer(result.offerId);
      expect(offer.maker.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(offer.sellToken.toLowerCase()).toBe(env.tokenA.toLowerCase());
      expect(offer.buyToken.toLowerCase()).toBe(env.tokenB.toLowerCase());
      expect(offer.sellAmount).toBe(AMOUNTS.standard);
      expect(offer.buyAmount).toBe(AMOUNTS.half);
      expect(offer.status).toBe(OfferStatus.Open);
      expect(offer.deadline).toBe(deadline);
    });

    it("should create an offer with default minFillPercent of 10000 (100%)", async () => {
      const offerId = await createStandardOffer(env);
      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.minFillPercent).toBe(10000n);
    });

    it("should create an offer with custom minFillPercent", async () => {
      const offerId = await createStandardOffer(env, { minFillPercent: 5000n });
      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.minFillPercent).toBe(5000n);
    });

    it("should deduct sellToken from maker's balance", async () => {
      const balanceBefore = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.maker.address);
      await createStandardOffer(env);
      const balanceAfter = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.maker.address);
      expect(balanceBefore - balanceAfter).toBe(AMOUNTS.standard);
    });

    it("should auto-approve tokens if allowance is insufficient", async () => {
      // This tests the SDK's automatic approval logic
      const result = await env.brokerMaker.createOffer({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
        deadline: (await getBlockTimestamp(env.publicClient)) + 86400n,
      });

      expect(result.hash).toBeDefined();
      expect(result.offerId).toBeGreaterThan(0n);
    });

    it("should increment the offer counter", async () => {
      const offerId1 = await createStandardOffer(env);
      const offerId2 = await createStandardOffer(env);
      expect(offerId2).toBe(offerId1 + 1n);
    });
  });

  describe("Fill Offer", () => {
    it("should fill an open offer", async () => {
      const offerId = await createStandardOffer(env);

      const result = await env.brokerTaker.fillOffer({ offerId });
      expect(result.hash).toBeDefined();
      expect(result.offerId).toBe(offerId);

      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.status).toBe(OfferStatus.Filled);
      expect(offer.filler.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
    });

    it("should transfer tokens correctly on fill", async () => {
      const makerBalanceA_before = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.maker.address);
      const takerBalanceB_before = await getBalance(env.publicClient, env.tokenB, TEST_ACCOUNTS.taker.address);

      const offerId = await createStandardOffer(env);
      await env.brokerTaker.fillOffer({ offerId });

      // Taker should have received sellToken (tokenA) minus fees
      const takerBalanceA_after = await getBalance(env.publicClient, env.tokenA, TEST_ACCOUNTS.taker.address);
      expect(takerBalanceA_after).toBeGreaterThan(0n);

      // Maker should have received buyToken (tokenB) minus fees
      const makerBalanceB_after = await getBalance(env.publicClient, env.tokenB, TEST_ACCOUNTS.maker.address);
      expect(makerBalanceB_after).toBeGreaterThan(0n);
    });

    it("should not allow double-filling", async () => {
      const offerId = await createStandardOffer(env);
      await env.brokerTaker.fillOffer({ offerId });

      await expect(
        env.brokerAgent3.fillOffer({ offerId })
      ).rejects.toThrow();
    });

    it("should not allow filling a cancelled offer", async () => {
      const offerId = await createStandardOffer(env);
      await env.brokerMaker.cancelOffer(offerId);

      await expect(
        env.brokerTaker.fillOffer({ offerId })
      ).rejects.toThrow();
    });

    it("should record the fill timestamp", async () => {
      const offerId = await createStandardOffer(env);
      await env.brokerTaker.fillOffer({ offerId });

      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.filledAt).toBeGreaterThan(0n);
    });
  });

  describe("List and Get Offers", () => {
    it("should list all offers", async () => {
      await createStandardOffer(env);
      await createStandardOffer(env);
      await createStandardOffer(env);

      const offers = await env.brokerMaker.listOffers({ limit: 10n });
      expect(offers.length).toBeGreaterThanOrEqual(3);
    });

    it("should filter offers by maker", async () => {
      await createStandardOffer(env, { maker: env.brokerMaker });
      await createStandardOffer(env, { maker: env.brokerTaker });

      const makerOffers = await env.brokerMaker.listOffers({
        maker: TEST_ACCOUNTS.maker.address,
      });

      for (const offer of makerOffers) {
        expect(offer.maker.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      }
    });

    it("should filter offers by status", async () => {
      const offerId1 = await createStandardOffer(env);
      const offerId2 = await createStandardOffer(env);
      await env.brokerTaker.fillOffer({ offerId: offerId1 });

      const openOffers = await env.brokerMaker.listOffers({
        status: OfferStatus.Open,
      });

      for (const offer of openOffers) {
        expect(offer.status).toBe(OfferStatus.Open);
      }
    });

    it("should return the correct offer by ID", async () => {
      const offerId = await createStandardOffer(env);
      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.id).toBe(offerId);
    });
  });

  describe("Full Lifecycle", () => {
    it("should complete a full offer lifecycle: create → fill → verify", async () => {
      // 1. Create offer: maker sells 100 tokenA for 50 tokenB
      const now = await getBlockTimestamp(env.publicClient);
      const result = await env.brokerMaker.createOffer({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        buyAmount: AMOUNTS.half,
        deadline: now + 86400n,
      });

      // 2. Verify offer is open
      let offer = await env.brokerMaker.getOffer(result.offerId);
      expect(offer.status).toBe(OfferStatus.Open);

      // 3. Taker fills the offer
      await env.brokerTaker.fillOffer({ offerId: result.offerId });

      // 4. Verify offer is filled
      offer = await env.brokerMaker.getOffer(result.offerId);
      expect(offer.status).toBe(OfferStatus.Filled);
      expect(offer.filler.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
      expect(offer.filledAt).toBeGreaterThan(0n);
    });

    it("should handle create → cancel flow", async () => {
      const offerId = await createStandardOffer(env);

      // Cancel
      const result = await env.brokerMaker.cancelOffer(offerId);
      expect(result.hash).toBeDefined();

      // Verify
      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.status).toBe(OfferStatus.Cancelled);
    });

    it("should handle multiple sequential offers from the same maker", async () => {
      const ids: bigint[] = [];
      for (let i = 0; i < 5; i++) {
        const id = await createStandardOffer(env);
        ids.push(id);
      }

      // All should be unique and sequential
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).toBe(ids[i - 1] + 1n);
      }

      // Fill some, cancel others
      await env.brokerTaker.fillOffer({ offerId: ids[0] });
      await env.brokerTaker.fillOffer({ offerId: ids[2] });
      await env.brokerMaker.cancelOffer(ids[4]);

      const statuses = await Promise.all(
        ids.map(async (id) => (await env.brokerMaker.getOffer(id)).status)
      );

      expect(statuses[0]).toBe(OfferStatus.Filled);
      expect(statuses[1]).toBe(OfferStatus.Open);
      expect(statuses[2]).toBe(OfferStatus.Filled);
      expect(statuses[3]).toBe(OfferStatus.Open);
      expect(statuses[4]).toBe(OfferStatus.Cancelled);
    });
  });
});
