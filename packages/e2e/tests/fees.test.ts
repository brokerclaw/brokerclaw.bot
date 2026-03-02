import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { type TestEnvironment, setupTestEnvironment, snapshot, revert } from "../src/setup.js";
import { createStandardOffer, getBalance, calculateExpectedFee, splitFee, assertApproxEqual } from "../src/helpers.js";
import { AMOUNTS, TEST_ACCOUNTS, FEE_CONFIG } from "../src/fixtures.js";

describe("Fee System", () => {
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

  describe("Fee Configuration", () => {
    it("should return the fee configuration", async () => {
      const feeConfig = await env.brokerMaker.getFeeConfig();

      expect(typeof feeConfig.feeBps).toBe("bigint");
      expect(typeof feeConfig.burnBps).toBe("bigint");
      expect(typeof feeConfig.treasuryBps).toBe("bigint");
      expect(feeConfig.treasury).toBeDefined();
    });

    it("should have fee BPS <= 10000", async () => {
      const feeConfig = await env.brokerMaker.getFeeConfig();
      expect(feeConfig.feeBps).toBeLessThanOrEqual(10000n);
    });

    it("should have burn + treasury = 10000 (100%)", async () => {
      const feeConfig = await env.brokerMaker.getFeeConfig();
      expect(feeConfig.burnBps + feeConfig.treasuryBps).toBe(10000n);
    });
  });

  describe("Fee Collection on Fill", () => {
    it("should deduct fees from the fill amount", async () => {
      const offerId = await createStandardOffer(env, {
        sellAmount: AMOUNTS.large,
        buyAmount: AMOUNTS.standard,
      });

      const takerBalanceBefore = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.taker.address
      );

      await env.brokerTaker.fillOffer({ offerId });

      const takerBalanceAfter = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.taker.address
      );

      // Taker receives sellToken minus fees
      const received = takerBalanceAfter - takerBalanceBefore;
      const expectedFee = calculateExpectedFee(AMOUNTS.large);
      const expectedReceived = AMOUNTS.large - expectedFee;

      // Allow for small rounding differences
      assertApproxEqual(received, expectedReceived, 10n, "Taker received incorrect amount after fees");
    });

    it("should send fees to treasury", async () => {
      const treasuryBalanceBefore = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.treasury.address
      );

      const offerId = await createStandardOffer(env, {
        sellAmount: AMOUNTS.large,
        buyAmount: AMOUNTS.standard,
      });

      await env.brokerTaker.fillOffer({ offerId });

      const treasuryBalanceAfter = await getBalance(
        env.publicClient,
        env.tokenA,
        TEST_ACCOUNTS.treasury.address
      );

      const fee = calculateExpectedFee(AMOUNTS.large);
      const { treasuryAmount } = splitFee(fee);

      const treasuryReceived = treasuryBalanceAfter - treasuryBalanceBefore;
      assertApproxEqual(treasuryReceived, treasuryAmount, 10n, "Treasury received incorrect fee");
    });

    it("should calculate fees correctly for different amounts", async () => {
      const amounts = [
        10n * 10n ** 18n,
        100n * 10n ** 18n,
        1000n * 10n ** 18n,
        123456789n * 10n ** 10n, // Odd amount
      ];

      for (const amount of amounts) {
        const fee = calculateExpectedFee(amount);
        expect(fee).toBe((amount * 30n) / 10000n);

        // Fee should always be less than the amount
        expect(fee).toBeLessThan(amount);

        // Fee should be positive for non-zero amounts
        if (amount > 0n) {
          expect(fee).toBeGreaterThanOrEqual(0n);
        }
      }
    });
  });

  describe("Fee Split", () => {
    it("should split fees between burn and treasury correctly", async () => {
      const fee = calculateExpectedFee(AMOUNTS.large);
      const { burnAmount, treasuryAmount } = splitFee(fee);

      // Burn + treasury should approximately equal the total fee
      // (might be slightly less due to rounding)
      expect(burnAmount + treasuryAmount).toBeLessThanOrEqual(fee);
      expect(burnAmount + treasuryAmount).toBeGreaterThan(fee - 2n);
    });

    it("should split proportionally according to BPS", async () => {
      const testFee = 10000n; // Nice round number for easy math
      const { burnAmount, treasuryAmount } = splitFee(testFee);

      // burnBps = 3333, so burn should be ~33.33% of fee
      expect(burnAmount).toBe((testFee * 3333n) / 10000n);

      // treasuryBps = 6667, so treasury should be ~66.67% of fee
      expect(treasuryAmount).toBe((testFee * 6667n) / 10000n);
    });
  });

  describe("Fee Edge Cases", () => {
    it("should handle very small amounts (no fee underflow)", async () => {
      const tinyAmount = 1n; // 1 wei
      const fee = calculateExpectedFee(tinyAmount);

      // Fee should be 0 for very small amounts (rounding down)
      expect(fee).toBe(0n);
    });

    it("should handle very large amounts without overflow", async () => {
      const hugeAmount = 10n ** 30n; // Very large amount
      const fee = calculateExpectedFee(hugeAmount);

      expect(fee).toBe((hugeAmount * 30n) / 10000n);
      expect(fee).toBeGreaterThan(0n);
      expect(fee).toBeLessThan(hugeAmount);
    });

    it("should correctly calculate fees on exact BPS boundaries", async () => {
      // Amount of 10000 tokens — fee should be exactly 3 tokens (30 bps)
      const amount = 10000n * 10n ** 18n;
      const fee = calculateExpectedFee(amount);
      expect(fee).toBe(3n * 10n ** 18n); // Exactly 3 tokens
    });
  });

  describe("Cumulative Fees", () => {
    it("should accumulate fees in protocol stats", async () => {
      const statsBefore = await env.brokerMaker.getStats();

      // Execute multiple deals
      for (let i = 0; i < 3; i++) {
        const offerId = await createStandardOffer(env, {
          sellAmount: AMOUNTS.standard,
          buyAmount: AMOUNTS.half,
        });
        await env.brokerTaker.fillOffer({ offerId });
      }

      const statsAfter = await env.brokerMaker.getStats();
      expect(statsAfter.totalFees).toBeGreaterThan(statsBefore.totalFees);
    });
  });
});
