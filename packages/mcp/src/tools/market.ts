import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { OTC_MARKET_ABI } from "../contracts/abi.js";
import { formatTokenAmount, tokenSymbol } from "../utils/format.js";
import { resolveToken } from "../utils/validation.js";

/**
 * Uniswap V3 Quoter ABI (for AMM price reference on Base)
 */
const UNISWAP_QUOTER_ABI = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        type: "tuple",
        name: "params",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
  },
] as const;

/** Uniswap V3 QuoterV2 on Base */
const UNISWAP_QUOTER_ADDRESS = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a" as const;

/** Common fee tiers to try */
const FEE_TIERS = [500, 3000, 10000] as const;

export function registerMarketTools(server: McpServer): void {
  /**
   * brokers_market_price — Get AMM reference price for a token pair
   */
  server.tool(
    "brokers_market_price",
    "Get the current AMM (Uniswap V3) reference price for a token pair on Base. Useful for evaluating OTC offers.",
    {
      tokenA: z.string().describe("Input token (address or symbol, e.g., 'WETH')"),
      tokenB: z.string().describe("Output token (address or symbol, e.g., 'USDC')"),
    },
    async ({ tokenA, tokenB }) => {
      const client = getPublicClient();

      try {
        const tokenAAddr = await resolveToken(tokenA);
        const tokenBAddr = await resolveToken(tokenB);
        const amountIn = 1000000000000000000n; // 1 token (18 decimals)

        let bestQuote: bigint | null = null;
        let bestFee = 0;

        // Try each fee tier and take the best quote
        for (const fee of FEE_TIERS) {
          try {
            const result = await client.simulateContract({
              address: UNISWAP_QUOTER_ADDRESS,
              abi: UNISWAP_QUOTER_ABI,
              functionName: "quoteExactInputSingle",
              args: [
                {
                  tokenIn: tokenAAddr,
                  tokenOut: tokenBAddr,
                  amountIn,
                  fee,
                  sqrtPriceLimitX96: 0n,
                },
              ],
            });
            const amountOut = result.result[0];
            if (bestQuote === null || amountOut > bestQuote) {
              bestQuote = amountOut;
              bestFee = fee;
            }
          } catch {
            // This fee tier doesn't have a pool, skip
          }
        }

        if (bestQuote === null) {
          return {
            content: [
              {
                type: "text",
                text: `No Uniswap V3 pool found for ${tokenSymbol(tokenAAddr)}/${tokenSymbol(tokenBAddr)} on Base.`,
              },
            ],
          };
        }

        const symbolA = tokenSymbol(tokenAAddr);
        const symbolB = tokenSymbol(tokenBAddr);
        const price = formatTokenAmount(bestQuote);

        return {
          content: [
            {
              type: "text",
              text: [
                `AMM Reference Price (Uniswap V3 on Base):`,
                `  1 ${symbolA} = ${price} ${symbolB}`,
                `  Pool fee tier: ${bestFee / 10000}%`,
                `  Source: Uniswap V3 QuoterV2`,
                "",
                "Note: This is an indicative price. Actual execution may differ due to slippage.",
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching market price: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_stats — Get protocol-level statistics
   */
  server.tool(
    "brokers_stats",
    "Get overall Brokers Bot protocol statistics: total volume, deal count, and top agents.",
    {},
    async () => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const [offerCount, feeBps] = await Promise.all([
          client.readContract({
            address: addresses.otcMarket,
            abi: OTC_MARKET_ABI,
            functionName: "offerCount",
          }) as Promise<bigint>,
          client.readContract({
            address: addresses.otcMarket,
            abi: OTC_MARKET_ABI,
            functionName: "feeBps",
          }) as Promise<bigint>,
        ]);

        return {
          content: [
            {
              type: "text",
              text: [
                "Brokers Bot Stats",
                "═══════════════════════",
                `  Total Offers: ${offerCount}`,
                `  Fee: ${Number(feeBps) / 100}%`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching stats: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
