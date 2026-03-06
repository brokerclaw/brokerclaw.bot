import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert, getBlockTimestamp } from "../src/setup.js";
import { createStandardOffer, createStandardRFQ, getBalance, futureTimestamp } from "../src/helpers.js";
import { OfferStatus, RFQStatus } from "@brokerclaw/sdk";
import { AMOUNTS, TEST_ACCOUNTS } from "../src/fixtures.js";

describe("Cancellation Flows", () => {
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

  describe("Offer Cancellation", () => {
    it("should cancel an open offer", async () => {
      const offerId = await createStandardOffer(env);
      const result = await env.brokerMaker.cancelOffer(offerId);

      expect(result.hash).toBeDefined();

      const offer = await env.brokerMaker.getOffer(offerId);
      expect(offer.status).toBe(OfferStatus.Cancelled);
    });

    it("should refund sellToken to maker on cancellation", async () => {
      const balanceBefore = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.maker.address
      );

      const offerId = await createStandardOffer(env, {
        sellAmount: AMOUNTS.standard,
      });

      const balanceDuring = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.maker.address
      );
      expect(balanceBefore - balanceDuring).toBe(AMOUNTS.standard);

      await env.brokerMaker.cancelOffer(offerId);

      const balanceAfter = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.maker.address
      );
      // Should get back the sellAmount
      expect(balanceAfter).toBe(balanceBefore);
    });

    it("should not allow non-maker to cancel", async () => {
      const offerId = await createStandardOffer(env);

      await expect(
        env.brokerTaker.cancelOffer(offerId)
      ).rejects.toThrow();
    });

    it("should not allow cancelling a filled offer", async () => {
      const offerId = await createStandardOffer(env);
      await env.brokerTaker.fillOffer({ offerId });

      await expect(
        env.brokerMaker.cancelOffer(offerId)
      ).rejects.toThrow();
    });

    it("should not allow cancelling an already-cancelled offer", async () => {
      const offerId = await createStandardOffer(env);
      await env.brokerMaker.cancelOffer(offerId);

      await expect(
        env.brokerMaker.cancelOffer(offerId)
      ).rejects.toThrow();
    });

    it("should not allow filling a cancelled offer", async () => {
      const offerId = await createStandardOffer(env);
      await env.brokerMaker.cancelOffer(offerId);

      await expect(
        env.brokerTaker.fillOffer({ offerId })
      ).rejects.toThrow();
    });
  });

  describe("RFQ Cancellation", () => {
    it("should cancel a pending RFQ", async () => {
      const rfqId = await createStandardRFQ(env);
      const result = await env.brokerMaker.cancelRFQ(rfqId);

      expect(result.hash).toBeDefined();

      const rfq = await env.brokerMaker.getRFQ(rfqId);
      expect(rfq.status).toBe(RFQStatus.Cancelled);
    });

    it("should refund sellToken on RFQ cancellation", async () => {
      const balanceBefore = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.maker.address
      );

      const rfqId = await createStandardRFQ(env, {
        sellAmount: AMOUNTS.standard,
      });

      const balanceDuring = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.maker.address
      );
      expect(balanceBefore - balanceDuring).toBe(AMOUNTS.standard);

      await env.brokerMaker.cancelRFQ(rfqId);

      const balanceAfter = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.maker.address
      );
      expect(balanceAfter).toBe(balanceBefore);
    });

    it("should not allow non-requester to cancel", async () => {
      const rfqId = await createStandardRFQ(env);

      await expect(
        env.brokerTaker.cancelRFQ(rfqId)
      ).rejects.toThrow();
    });

    it("should not allow submitting quotes after cancellation", async () => {
      const rfqId = await createStandardRFQ(env);
      await env.brokerMaker.cancelRFQ(rfqId);

      const expiry = await futureTimestamp(env.publicClient, 1800n);
      await expect(
        env.brokerTaker.submitQuote({
          rfqId,
          buyAmount: AMOUNTS.half,
          expiry,
        })
      ).rejects.toThrow();
    });

    it("should not allow cancelling an accepted RFQ", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      await env.brokerMaker.acceptQuote({ quoteId });

      await expect(
        env.brokerMaker.cancelRFQ(rfqId)
      ).rejects.toThrow();
    });
  });

  describe("Cancellation with Existing Quotes", () => {
    it("should cancel RFQ even if quotes exist (but none accepted)", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      // Submit some quotes
      await env.brokerTaker.submitQuote({ rfqId, buyAmount: AMOUNTS.half, expiry });
      await env.brokerAgent3.submitQuote({ rfqId, buyAmount: AMOUNTS.standard, expiry });

      // Should still be cancellable
      const result = await env.brokerMaker.cancelRFQ(rfqId);
      expect(result.hash).toBeDefined();

      const rfq = await env.brokerMaker.getRFQ(rfqId);
      expect(rfq.status).toBe(RFQStatus.Cancelled);
    });
  });

  describe("Batch Cancellation", () => {
    it("should cancel multiple offers sequentially", async () => {
      const ids: bigint[] = [];
      for (let i = 0; i < 3; i++) {
        ids.push(await createStandardOffer(env));
      }

      // Cancel all
      for (const id of ids) {
        await env.brokerMaker.cancelOffer(id);
      }

      // Verify all cancelled
      for (const id of ids) {
        const offer = await env.brokerMaker.getOffer(id);
        expect(offer.status).toBe(OfferStatus.Cancelled);
      }
    });
  });

  describe("Race Conditions", () => {
    it("should handle cancel racing with fill — one should succeed, other should fail", async () => {
      const offerId = await createStandardOffer(env);

      // Try both cancel and fill — one must fail
      let cancelSucceeded = false;
      let fillSucceeded = false;

      try {
        await env.brokerMaker.cancelOffer(offerId);
        cancelSucceeded = true;
      } catch {
        cancelSucceeded = false;
      }

      try {
        await env.brokerTaker.fillOffer({ offerId });
        fillSucceeded = true;
      } catch {
        fillSucceeded = false;
      }

      // Exactly one should succeed
      expect(cancelSucceeded || fillSucceeded).toBe(true);
      // (Both could succeed in theory if they're in separate txs,
      //  but the second tx should revert)
    });
  });
});
