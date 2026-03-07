import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getWalletClient, getContractAddresses, getWalletAddress } from "../contracts/client.js";
import { OTC_MARKET_ABI, ERC20_ABI } from "../contracts/abi.js";
import { formatOffer, formatTokenAmount, tokenSymbol } from "../utils/format.js";
import {
  resolveToken,
  parseTokenAmount,
  getTokenDecimals,
  hoursToExpiry,
  requireWallet,
  limitSchema,
} from "../utils/validation.js";

export function registerOfferTools(server: McpServer): void {
  /**
   * brokers_list_offers — List open OTC offers
   */
  server.tool(
    "brokers_list_offers",
    "List open OTC offers on the Brokers Bot protocol. Optionally filter by token address/symbol and status.",
    {
      token: z.string().optional().describe("Token address or symbol to filter by (e.g., 'USDC' or '0x...')"),
      status: z.enum(["open", "filled", "cancelled", "expired", "countered"]).optional().describe("Filter by offer status"),
      limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of offers to return"),
    },
    async ({ token, status, limit }) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const totalOffers = (await client.readContract({
          address: addresses.escrow,
          abi: OTC_MARKET_ABI,
          functionName: "offerCount",
        })) as bigint;

        if (totalOffers === 0n) {
          return {
            content: [{ type: "text", text: "No offers found." }],
          };
        }

        const statusMap: Record<string, number> = {
          open: 0,
          filled: 1,
          cancelled: 2,
          expired: 3,
          countered: 4,
        };

        const tokenAddress = token ? await resolveToken(token) : undefined;
        const offers: any[] = [];

        // Iterate from most recent to oldest
        for (let i = Number(totalOffers); i >= 1 && offers.length < limit; i--) {
          try {
            const offer = (await client.readContract({
              address: addresses.escrow,
              abi: OTC_MARKET_ABI,
              functionName: "getOffer",
              args: [BigInt(i)],
            })) as any;

            const offerWithId = { ...offer, id: BigInt(i) };

            // Filter by status
            if (status && statusMap[status] !== undefined && offer.status !== statusMap[status]) {
              continue;
            }

            // Filter by token
            if (tokenAddress) {
              const matchA = offer.tokenA.toLowerCase() === tokenAddress.toLowerCase();
              const matchB = offer.tokenB.toLowerCase() === tokenAddress.toLowerCase();
              if (!matchA && !matchB) continue;
            }

            offers.push(offerWithId);
          } catch {
            // Skip invalid offer IDs
            continue;
          }
        }

        if (offers.length === 0) {
          return {
            content: [{ type: "text", text: "No offers found matching the criteria." }],
          };
        }

        const formatted = offers.map((o: any) => formatOffer(o)).join("\n\n");
        return {
          content: [
            {
              type: "text",
              text: `Found ${offers.length} offer(s) (out of ${totalOffers} total):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing offers: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_create_offer — Create a new OTC offer
   */
  server.tool(
    "brokers_create_offer",
    "Create a new OTC offer on the Brokers Bot protocol. You sell tokenA and want tokenB in return.",
    {
      tokenA: z.string().describe("Token you are selling (address or symbol, e.g., 'WETH')"),
      amountA: z.string().describe("Amount of tokenA to sell (human readable, e.g., '1.5')"),
      tokenB: z.string().describe("Token you want to receive (address or symbol, e.g., 'USDC')"),
      amountB: z.string().describe("Amount of tokenB you want (human readable, e.g., '3000')"),
      expiryHours: z.number().min(0.1).max(720).default(24).describe("Hours until the offer expires (default: 24)"),
    },
    async ({ tokenA, amountA, tokenB, amountB, expiryHours }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const tokenAAddr = await resolveToken(tokenA);
        const tokenBAddr = await resolveToken(tokenB);
        const [decimalsA, decimalsB] = await Promise.all([
          getTokenDecimals(tokenAAddr),
          getTokenDecimals(tokenBAddr),
        ]);
        const rawAmountA = parseTokenAmount(amountA, decimalsA);
        const rawAmountB = parseTokenAmount(amountB, decimalsB);
        const expiry = hoursToExpiry(expiryHours);

        const walletClient = getWalletClient();
        const addresses = getContractAddresses();

        // Check if selling ETH (need to send as msg.value)
        const isETH = tokenAAddr === "0x0000000000000000000000000000000000000000";
        const publicClient = getPublicClient();

        // Approve ERC-20 if needed
        if (!isETH) {
          const currentAllowance = await publicClient.readContract({
            address: tokenAAddr,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [walletAddress!, addresses.otcMarket],
          }) as bigint;

          if (currentAllowance < rawAmountA) {
            const approveTx = await walletClient.writeContract({
              address: tokenAAddr,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [addresses.otcMarket, rawAmountA],
            });
            await publicClient.waitForTransactionReceipt({ hash: approveTx });
          }
        }

        const hash = await walletClient.writeContract({
          address: addresses.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "createOffer",
          args: [tokenAAddr, rawAmountA, tokenBAddr, rawAmountB, expiry],
          ...(isETH ? { value: rawAmountA } : {}),
        });

        return {
          content: [
            {
              type: "text",
              text: [
                "✅ Offer created successfully!",
                `  Transaction: ${hash}`,
                `  Selling: ${amountA} ${tokenSymbol(tokenAAddr)}`,
                `  Wanting: ${amountB} ${tokenSymbol(tokenBAddr)}`,
                `  Expires in: ${expiryHours} hours`,
                "",
                "Note: The transaction has been submitted. Wait for confirmation before the offer is active.",
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error creating offer: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_fill_offer — Accept and fill an existing offer
   */
  server.tool(
    "brokers_fill_offer",
    "Accept and fill an existing OTC offer. You provide tokenB and receive tokenA.",
    {
      offerId: z.union([z.string(), z.number()]).describe("The offer ID to fill"),
    },
    async ({ offerId }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const id = BigInt(offerId);
        const walletClient = getWalletClient();
        const publicClient = getPublicClient();
        const addresses = getContractAddresses();

        // Fetch offer details first for confirmation
        const offer = (await publicClient.readContract({
          address: addresses.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "getOffer",
          args: [id],
        })) as any;

        // Approve tokenB if needed (taker pays tokenB)
        const isETH = offer.tokenB.toLowerCase() === "0x0000000000000000000000000000000000000000";
        if (!isETH) {
          const currentAllowance = await publicClient.readContract({
            address: offer.tokenB,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [walletAddress!, addresses.otcMarket],
          }) as bigint;

          if (currentAllowance < offer.amountB) {
            const approveTx = await walletClient.writeContract({
              address: offer.tokenB,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [addresses.otcMarket, offer.amountB],
            });
            await publicClient.waitForTransactionReceipt({ hash: approveTx });
          }
        }

        const hash = await walletClient.writeContract({
          address: addresses.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "fillOffer",
          args: [id],
          ...(isETH ? { value: offer.amountB } : {}),
        });

        return {
          content: [
            {
              type: "text",
              text: [
                "✅ Offer filled successfully!",
                `  Transaction: ${hash}`,
                `  Offer #${id}`,
                `  You receive: ${formatTokenAmount(offer.amountA)} ${tokenSymbol(offer.tokenA)}`,
                `  You pay: ${formatTokenAmount(offer.amountB)} ${tokenSymbol(offer.tokenB)}`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error filling offer: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_counter_offer — Submit a counter-proposal for an existing offer
   */
  server.tool(
    "brokers_counter_offer",
    "Submit a counter-proposal for an existing offer with a different tokenB amount.",
    {
      offerId: z.union([z.string(), z.number()]).describe("The offer ID to counter"),
      newAmountB: z.string().describe("Your proposed new amount of tokenB (human readable)"),
    },
    async ({ offerId, newAmountB }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const id = BigInt(offerId);
        // Fetch offer to get tokenB decimals
        const publicClient = getPublicClient();
        const addresses2 = getContractAddresses();
        const offer = (await publicClient.readContract({
          address: addresses2.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "getOffer",
          args: [id],
        })) as any;
        const decimalsB = await getTokenDecimals(offer.tokenB);
        const rawAmount = parseTokenAmount(newAmountB, decimalsB);
        const walletClient = getWalletClient();
        const addresses = getContractAddresses();

        // Counter-offer requires depositing tokenB — approve if needed
        const isETH = offer.tokenB.toLowerCase() === "0x0000000000000000000000000000000000000000";
        if (!isETH) {
          const currentAllowance = await publicClient.readContract({
            address: offer.tokenB,
            abi: ERC20_ABI,
            functionName: "allowance",
            args: [walletAddress!, addresses.otcMarket],
          }) as bigint;

          if (currentAllowance < rawAmount) {
            const approveTx = await walletClient.writeContract({
              address: offer.tokenB,
              abi: ERC20_ABI,
              functionName: "approve",
              args: [addresses.otcMarket, rawAmount],
            });
            await publicClient.waitForTransactionReceipt({ hash: approveTx });
          }
        }

        const hash = await walletClient.writeContract({
          address: addresses.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "counterOffer",
          args: [id, rawAmount],
          ...(isETH ? { value: rawAmount } : {}),
        });

        return {
          content: [
            {
              type: "text",
              text: [
                "✅ Counter-offer submitted!",
                `  Transaction: ${hash}`,
                `  Offer #${id}`,
                `  Proposed amount: ${newAmountB}`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error submitting counter-offer: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_cancel_offer — Cancel your own offer
   */
  server.tool(
    "brokers_cancel_offer",
    "Cancel an offer you created. Only the original maker can cancel.",
    {
      offerId: z.union([z.string(), z.number()]).describe("The offer ID to cancel"),
    },
    async ({ offerId }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const id = BigInt(offerId);
        const walletClient = getWalletClient();
        const addresses = getContractAddresses();

        const hash = await walletClient.writeContract({
          address: addresses.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "cancelOffer",
          args: [id],
        });

        return {
          content: [
            {
              type: "text",
              text: `✅ Offer #${id} cancelled.\n  Transaction: ${hash}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error cancelling offer: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
