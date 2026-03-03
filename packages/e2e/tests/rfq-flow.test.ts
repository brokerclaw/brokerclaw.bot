import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert, getBlockTimestamp } from "../src/setup.js";
import { createStandardRFQ, getBalance, futureTimestamp } from "../src/helpers.js";
import { RFQStatus } from "@brokers-bot/sdk";
import { AMOUNTS, TEST_ACCOUNTS } from "../src/fixtures.js";

describe("RFQ Flow", () => {
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

  describe("Request Quote", () => {
    it("should create an RFQ with correct parameters", async () => {
      const now = await getBlockTimestamp(env.publicClient);
      const deadline = now + 3600n;

      const result = await env.brokerMaker.requestQuote({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        deadline,
      });

      expect(result.hash).toBeDefined();
      expect(result.rfqId).toBeGreaterThan(0n);

      const rfq = await env.brokerMaker.getRFQ(result.rfqId);
      expect(rfq.requester.toLowerCase()).toBe(TEST_ACCOUNTS.maker.address.toLowerCase());
      expect(rfq.sellToken.toLowerCase()).toBe(env.tokenA.toLowerCase());
      expect(rfq.buyToken.toLowerCase()).toBe(env.tokenB.toLowerCase());
      expect(rfq.sellAmount).toBe(AMOUNTS.standard);
      expect(rfq.status).toBe(RFQStatus.Pending);
    });

    it("should increment RFQ counter", async () => {
      const rfq1 = await createStandardRFQ(env);
      const rfq2 = await createStandardRFQ(env);
      expect(rfq2).toBe(rfq1 + 1n);
    });

    it("should auto-approve sellToken for the RFQ contract", async () => {
      const deadline = await futureTimestamp(env.publicClient, 3600n);
      const result = await env.brokerMaker.requestQuote({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        deadline,
      });
      expect(result.rfqId).toBeGreaterThan(0n);
    });
  });

  describe("Submit Quote", () => {
    it("should submit a quote for an open RFQ", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const result = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      expect(result.hash).toBeDefined();
      expect(result.quoteId).toBeGreaterThan(0n);

      const quote = await env.brokerTaker.getQuote(result.quoteId);
      expect(quote.rfqId).toBe(rfqId);
      expect(quote.quoter.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
      expect(quote.buyAmount).toBe(AMOUNTS.half);
      expect(quote.accepted).toBe(false);
    });

    it("should allow multiple quotes for the same RFQ", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const quote1 = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      const quote2 = await env.brokerAgent3.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half + 10n * 10n ** 18n, // Better price
        expiry,
      });

      expect(quote1.quoteId).not.toBe(quote2.quoteId);

      const quotes = await env.brokerMaker.listQuotes({ rfqId });
      expect(quotes.length).toBe(2);
    });

    it("should auto-approve buyToken for quote submission", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const result = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      expect(result.quoteId).toBeGreaterThan(0n);
    });
  });

  describe("Accept Quote", () => {
    it("should accept a submitted quote", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      const result = await env.brokerMaker.acceptQuote({ quoteId });
      expect(result.hash).toBeDefined();

      const quote = await env.brokerMaker.getQuote(quoteId);
      expect(quote.accepted).toBe(true);

      const rfq = await env.brokerMaker.getRFQ(rfqId);
      expect(rfq.status).toBe(RFQStatus.Accepted);
    });

    it("should settle tokens on quote acceptance", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const makerBalanceB_before = await getBalance(
        env.publicClient,
        env.tokenB,
        TEST_ACCOUNTS.maker.address
      );

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      await env.brokerMaker.acceptQuote({ quoteId });

      // Maker should receive buyToken (tokenB)
      const makerBalanceB_after = await getBalance(
        env.publicClient,
        env.tokenB,
        TEST_ACCOUNTS.maker.address
      );
      expect(makerBalanceB_after).toBeGreaterThan(makerBalanceB_before);
    });

    it("should not allow accepting an already-accepted quote", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      await env.brokerMaker.acceptQuote({ quoteId });

      await expect(
        env.brokerMaker.acceptQuote({ quoteId })
      ).rejects.toThrow();
    });

    it("should only allow the RFQ requester to accept", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      const { quoteId } = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: AMOUNTS.half,
        expiry,
      });

      // Agent3 is NOT the requester — should fail
      await expect(
        env.brokerAgent3.acceptQuote({ quoteId })
      ).rejects.toThrow();
    });
  });

  describe("Full RFQ Flow", () => {
    it("should complete: request → quote → accept → verify settlement", async () => {
      // 1. Maker requests a quote: wants to sell 100 tokenA for tokenB
      const now = await getBlockTimestamp(env.publicClient);
      const rfqResult = await env.brokerMaker.requestQuote({
        sellToken: env.tokenA,
        buyToken: env.tokenB,
        sellAmount: AMOUNTS.standard,
        deadline: now + 3600n,
      });

      // 2. Verify RFQ is pending
      let rfq = await env.brokerMaker.getRFQ(rfqResult.rfqId);
      expect(rfq.status).toBe(RFQStatus.Pending);

      // 3. Taker submits a quote: offering 50 tokenB
      const quoteResult = await env.brokerTaker.submitQuote({
        rfqId: rfqResult.rfqId,
        buyAmount: AMOUNTS.half,
        expiry: now + 1800n,
      });

      // 4. Verify quote exists
      const quote = await env.brokerMaker.getQuote(quoteResult.quoteId);
      expect(quote.rfqId).toBe(rfqResult.rfqId);
      expect(quote.accepted).toBe(false);

      // 5. Maker accepts the quote
      await env.brokerMaker.acceptQuote({ quoteId: quoteResult.quoteId });

      // 6. Verify settlement
      rfq = await env.brokerMaker.getRFQ(rfqResult.rfqId);
      expect(rfq.status).toBe(RFQStatus.Accepted);

      const acceptedQuote = await env.brokerMaker.getQuote(quoteResult.quoteId);
      expect(acceptedQuote.accepted).toBe(true);
    });

    it("should handle competitive quoting (best price wins)", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      // Taker offers 50 tokenB
      const quote1 = await env.brokerTaker.submitQuote({
        rfqId,
        buyAmount: 50n * 10n ** 18n,
        expiry,
      });

      // Agent3 offers 55 tokenB (better price for requester)
      const quote2 = await env.brokerAgent3.submitQuote({
        rfqId,
        buyAmount: 55n * 10n ** 18n,
        expiry,
      });

      // Maker picks the better quote
      await env.brokerMaker.acceptQuote({ quoteId: quote2.quoteId });

      const q1 = await env.brokerMaker.getQuote(quote1.quoteId);
      const q2 = await env.brokerMaker.getQuote(quote2.quoteId);
      expect(q1.accepted).toBe(false);
      expect(q2.accepted).toBe(true);
    });
  });

  describe("Cancel RFQ", () => {
    it("should cancel a pending RFQ", async () => {
      const rfqId = await createStandardRFQ(env);

      const result = await env.brokerMaker.cancelRFQ(rfqId);
      expect(result.hash).toBeDefined();

      const rfq = await env.brokerMaker.getRFQ(rfqId);
      expect(rfq.status).toBe(RFQStatus.Cancelled);
    });

    it("should not allow non-requester to cancel", async () => {
      const rfqId = await createStandardRFQ(env);

      await expect(
        env.brokerTaker.cancelRFQ(rfqId)
      ).rejects.toThrow();
    });

    it("should not allow submitting quotes on a cancelled RFQ", async () => {
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
  });

  describe("List Quotes", () => {
    it("should list quotes by RFQ", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      await env.brokerTaker.submitQuote({ rfqId, buyAmount: AMOUNTS.half, expiry });
      await env.brokerAgent3.submitQuote({ rfqId, buyAmount: AMOUNTS.standard, expiry });

      const quotes = await env.brokerMaker.listQuotes({ rfqId });
      expect(quotes.length).toBe(2);
      expect(quotes.every((q) => q.rfqId === rfqId)).toBe(true);
    });

    it("should filter quotes by quoter", async () => {
      const rfqId = await createStandardRFQ(env);
      const expiry = await futureTimestamp(env.publicClient, 1800n);

      await env.brokerTaker.submitQuote({ rfqId, buyAmount: AMOUNTS.half, expiry });
      await env.brokerAgent3.submitQuote({ rfqId, buyAmount: AMOUNTS.standard, expiry });

      const quotes = await env.brokerMaker.listQuotes({
        rfqId,
        quoter: TEST_ACCOUNTS.taker.address,
      });

      expect(quotes.length).toBe(1);
      expect(quotes[0].quoter.toLowerCase()).toBe(TEST_ACCOUNTS.taker.address.toLowerCase());
    });
  });
});
