import { z } from "zod";
import { isAddress, parseUnits } from "viem";
import { TOKENS, TOKEN_DECIMALS } from "../contracts/addresses.js";
import { getPublicClient } from "../contracts/client.js";

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

/** In-memory cache of symbols resolved via DexScreener */
const dexScreenerCache: Record<string, `0x${string}`> = {};

/**
 * Resolve a token symbol to a Base address using the DexScreener API (free, no auth).
 */
async function resolveTokenViaDexScreener(symbol: string): Promise<`0x${string}` | undefined> {
  const upper = symbol.toUpperCase();
  if (dexScreenerCache[upper]) return dexScreenerCache[upper];

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(symbol)}`,
    );
    const data = (await res.json()) as {
      pairs: Array<{
        chainId: string;
        baseToken: { address: string; symbol: string };
      }> | null;
    };
    if (!data.pairs) return undefined;

    const match = data.pairs.find(
      (p) => p.chainId === "base" && p.baseToken.symbol.toUpperCase() === upper,
    );
    if (match) {
      const addr = match.baseToken.address as `0x${string}`;
      dexScreenerCache[upper] = addr;
      return addr;
    }
  } catch {
    // DexScreener unavailable
  }
  return undefined;
}

/**
 * Resolve a token identifier (symbol or address) to an address.
 * Accepts: "USDC", "usdc", a raw 0x address, or any symbol on Base (via DexScreener).
 */
export async function resolveToken(tokenInput: string): Promise<`0x${string}`> {
  // If it's already an address
  if (isAddress(tokenInput)) {
    return tokenInput as `0x${string}`;
  }

  // Try hardcoded symbol lookup first (case-insensitive)
  const upper = tokenInput.toUpperCase();
  const address = TOKENS[upper];
  if (address) {
    return address;
  }

  // Fallback: resolve via DexScreener (any token on Base)
  const dexAddr = await resolveTokenViaDexScreener(upper);
  if (dexAddr) {
    return dexAddr;
  }

  throw new Error(
    `Unknown token: "${tokenInput}". Use an address or one of: ${Object.keys(TOKENS).join(", ")}`,
  );
}

/**
 * Get decimals for a token address.
 * Checks known tokens first, then queries on-chain.
 */
export async function getTokenDecimals(address: `0x${string}`): Promise<number> {
  // ETH sentinel
  if (address === "0x0000000000000000000000000000000000000000") return 18;

  // Check known decimals
  const known = TOKEN_DECIMALS[address];
  if (known !== undefined) return known;

  // Query on-chain
  try {
    const client = getPublicClient();
    const decimals = await client.readContract({
      address,
      abi: [{ inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
      functionName: "decimals",
    });
    return Number(decimals);
  } catch {
    return 18; // fallback
  }
}

/**
 * Parse a human-readable token amount to raw units.
 * Default decimals: 18
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals);
}

/**
 * Convert hours to an absolute expiry timestamp (seconds since epoch).
 */
export function hoursToExpiry(hours: number): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + Math.floor(hours * 3600));
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
