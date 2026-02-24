import { z } from "zod";
import { isAddress, parseUnits } from "viem";
import { TOKENS } from "../contracts/addresses.js";

/**
 * Zod schema for an Ethereum address.
 */
export const addressSchema = z
  .string()
  .refine((val) => isAddress(val), {
    message: "Invalid Ethereum address",
  })
  .transform((val) => val as `0x${string}`);

/**
 * Zod schema for a positive bigint ID.
 */
export const idSchema = z
  .union([z.string(), z.number()])
  .transform((val) => BigInt(val))
  .refine((val) => val > 0n, { message: "ID must be positive" });

/**
 * Zod schema for a token amount string (e.g., "1.5").
 */
export const amountSchema = z
  .string()
  .refine(
    (val) => {
      try {
        const num = parseFloat(val);
        return num > 0 && isFinite(num);
      } catch {
        return false;
      }
    },
    { message: "Amount must be a positive number" }
  );

/**
 * Zod schema for limit parameter.
 */
export const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20);

/**
 * Zod schema for expiry hours.
 */
export const expiryHoursSchema = z
  .number()
  .min(0.1)
  .max(720) // 30 days max
  .default(24);

/**
 * Zod schema for offer status filter.
 */
export const offerStatusSchema = z
  .enum(["open", "filled", "cancelled", "expired", "countered"])
  .optional();

/**
 * Resolve a token identifier (symbol or address) to an address.
 * Accepts: "USDC", "usdc", or a raw 0x address.
 */
export function resolveToken(tokenInput: string): `0x${string}` {
  // If it's already an address
  if (isAddress(tokenInput)) {
    return tokenInput as `0x${string}`;
  }

  // Try symbol lookup (case-insensitive)
  const upper = tokenInput.toUpperCase();
  const address = TOKENS[upper];
  if (address) {
    return address;
  }

  throw new Error(
    `Unknown token: "${tokenInput}". Use an address or one of: ${Object.keys(TOKENS).join(", ")}`
  );
}

/**
 * Parse a human-readable token amount to raw units.
 * Default decimals: 18
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Convert hours to seconds (for on-chain expiry duration).
 */
export function hoursToSeconds(hours: number): bigint {
  return BigInt(Math.floor(hours * 3600));
}

/**
 * Validate that a wallet is configured (for write operations).
 */
export function requireWallet(address: `0x${string}` | undefined): asserts address is `0x${string}` {
  if (!address) {
    throw new Error(
      "No wallet configured. Set BROKER_PRIVATE_KEY environment variable to use write operations."
    );
  }
}
