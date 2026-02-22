import { formatUnits, parseUnits } from "viem";
import type { Offer, Reputation, OfferStatus } from "../types.js";

/** Format a token amount from raw bigint to human-readable string */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  return formatUnits(amount, decimals);
}

/** Parse a human-readable amount to raw bigint */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

/** Format basis points to percentage string (e.g., 250 -> "2.50%") */
export function formatBps(bps: bigint): string {
  const percent = Number(bps) / 100;
  return `${percent.toFixed(2)}%`;
}

/** Calculate fee amount from a given amount and fee in basis points */
export function calculateFee(amount: bigint, feeBps: bigint): bigint {
  return (amount * feeBps) / 10000n;
}

/** Format Unix timestamp to ISO string */
export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toISOString();
}

/** Check if a deadline has passed */
export function isExpired(deadline: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return deadline <= now;
}

/** Get the status label from an OfferStatus enum value */
export function offerStatusLabel(status: OfferStatus): string {
  const labels: Record<number, string> = {
    0: "Open",
    1: "Filled",
    2: "Cancelled",
    3: "Expired",
  };
  return labels[status] ?? "Unknown";
}

/** Format an offer into a human-readable summary */
export function formatOfferSummary(
  offer: Offer,
  sellDecimals: number = 18,
  buyDecimals: number = 18
): string {
  const sell = formatTokenAmount(offer.sellAmount, sellDecimals);
  const buy = formatTokenAmount(offer.buyAmount, buyDecimals);
  const status = offerStatusLabel(offer.status);
  const deadline = formatTimestamp(offer.deadline);
  return `Offer #${offer.id} [${status}]: ${sell} -> ${buy} (deadline: ${deadline})`;
}

/** Format a reputation score as a percentage (score is 0-10000) */
export function formatReputationScore(rep: Reputation): string {
  const pct = Number(rep.score) / 100;
  return `${pct.toFixed(1)}% (${rep.successfulDeals}/${rep.totalDeals} deals)`;
}

/** Calculate an exchange rate from offer amounts */
export function calculateRate(
  sellAmount: bigint,
  buyAmount: bigint,
  sellDecimals: number = 18,
  buyDecimals: number = 18
): number {
  const sell = Number(formatUnits(sellAmount, sellDecimals));
  const buy = Number(formatUnits(buyAmount, buyDecimals));
  if (sell === 0) return 0;
  return buy / sell;
}

/** Default deadline: 24 hours from now */
export function defaultDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 86400);
}

/** Default RFQ deadline: 1 hour from now */
export function defaultRFQDeadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 3600);
}

/** Default quote expiry: 30 minutes from now */
export function defaultQuoteExpiry(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 1800);
}
