import { formatUnits, type Address } from "viem";
import { TOKENS } from "../contracts/addresses.js";

/**
 * Reverse lookup: address → token symbol
 */
const ADDRESS_TO_SYMBOL: Record<string, string> = {};
for (const [symbol, address] of Object.entries(TOKENS)) {
  ADDRESS_TO_SYMBOL[address.toLowerCase()] = symbol;
}

/**
 * Get a human-readable token symbol for an address.
 * Falls back to abbreviated address if unknown.
 */
export function tokenSymbol(address: Address): string {
  return ADDRESS_TO_SYMBOL[address.toLowerCase()] || abbreviateAddress(address);
}

/**
 * Abbreviate an address to 0x1234…abcd format.
 */
export function abbreviateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Format a token amount from raw units.
 * Default decimals: 18
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const formatted = formatUnits(amount, decimals);
  // Remove trailing zeros after decimal
  if (formatted.includes(".")) {
    const trimmed = formatted.replace(/\.?0+$/, "");
    return trimmed || "0";
  }
  return formatted;
}

/**
 * Format a USD value.
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Unix timestamp as ISO 8601 date string.
 */
export function formatTimestamp(timestamp: bigint | number): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  return new Date(ts * 1000).toISOString();
}

/**
 * Format an offer status enum to string.
 */
export function formatOfferStatus(status: number): string {
  const statuses = ["Open", "Filled", "Cancelled", "Expired", "Countered"];
  return statuses[status] || `Unknown(${status})`;
}

/**
 * Format an RFQ status enum to string.
 */
export function formatRfqStatus(status: number): string {
  const statuses = ["Active", "Quoted", "Accepted", "Expired", "Cancelled"];
  return statuses[status] || `Unknown(${status})`;
}

/**
 * Format a quote status enum to string.
 */
export function formatQuoteStatus(status: number): string {
  const statuses = ["Pending", "Accepted", "Rejected", "Expired"];
  return statuses[status] || `Unknown(${status})`;
}

/**
 * Format a success rate from basis points (10000 = 100%).
 */
export function formatSuccessRate(bps: bigint | number): string {
  const rate = typeof bps === "bigint" ? Number(bps) : bps;
  return `${(rate / 100).toFixed(1)}%`;
}

/**
 * Format an offer for display.
 */
export function formatOffer(offer: {
  id: bigint;
  maker: Address;
  tokenA: Address;
  amountA: bigint;
  tokenB: Address;
  amountB: bigint;
  expiry: bigint;
  status: number;
}): string {
  const lines = [
    `Offer #${offer.id}`,
    `  Maker: ${abbreviateAddress(offer.maker)}`,
    `  Selling: ${formatTokenAmount(offer.amountA)} ${tokenSymbol(offer.tokenA)}`,
    `  Wanting: ${formatTokenAmount(offer.amountB)} ${tokenSymbol(offer.tokenB)}`,
    `  Status: ${formatOfferStatus(offer.status)}`,
    `  Expires: ${formatTimestamp(offer.expiry)}`,
  ];
  return lines.join("\n");
}

/**
 * Format a deal for display.
 */
export function formatDeal(deal: {
  offerId: bigint;
  maker: Address;
  taker: Address;
  tokenA: Address;
  amountA: bigint;
  tokenB: Address;
  amountB: bigint;
  timestamp: bigint;
}): string {
  const lines = [
    `Deal (Offer #${deal.offerId})`,
    `  Maker: ${abbreviateAddress(deal.maker)}`,
    `  Taker: ${abbreviateAddress(deal.taker)}`,
    `  ${formatTokenAmount(deal.amountA)} ${tokenSymbol(deal.tokenA)} ↔ ${formatTokenAmount(deal.amountB)} ${tokenSymbol(deal.tokenB)}`,
    `  Completed: ${formatTimestamp(deal.timestamp)}`,
  ];
  return lines.join("\n");
}

/**
 * Format a reputation entry for display.
 */
export function formatReputation(rep: {
  agent: Address;
  score: bigint;
  totalDeals: bigint;
  totalVolume: bigint;
  successRate: bigint;
  lastActive: bigint;
}): string {
  const lines = [
    `Agent: ${abbreviateAddress(rep.agent)}`,
    `  Score: ${rep.score}`,
    `  Deals: ${rep.totalDeals}`,
    `  Volume: ${formatTokenAmount(rep.totalVolume)} (raw units)`,
    `  Success Rate: ${formatSuccessRate(rep.successRate)}`,
    `  Last Active: ${formatTimestamp(rep.lastActive)}`,
  ];
  return lines.join("\n");
}
