import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { OTC_MARKET_ABI } from "../contracts/abi.js";
import { formatTokenAmount, tokenSymbol, abbreviateAddress } from "../utils/format.js";

export function registerDealsResource(server: McpServer): void {
  server.resource(
    "deals",
    "brokers://deals",
    {
      description: "Recent completed deals on the BROKER protocol",
      mimeType: "text/plain",
    },
    async (uri) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        // Fetch recent DealCompleted events from the last 1000 blocks
        const currentBlock = await client.getBlockNumber();
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;

        const logs = await client.getLogs({
          address: addresses.escrow,
          event: {
            type: "event",
            name: "OfferFilled",
            inputs: [
              { name: "offerId", type: "uint256", indexed: true },
              { name: "taker", type: "address", indexed: true },
              { name: "feeA", type: "uint256", indexed: false },
              { name: "feeB", type: "uint256", indexed: false },
            ],
          },
          fromBlock,
          toBlock: "latest",
        });

        if (logs.length === 0) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "text/plain",
                text: "No recent deals found (last ~1000 blocks).",
              },
            ],
          };
        }

        const recentLogs = logs.reverse().slice(0, 50);
        const lines: string[] = [];
        for (const log of recentLogs) {
          const args = log.args as any;
          try {
            const offer = (await client.readContract({
              address: addresses.escrow,
              abi: OTC_MARKET_ABI,
              functionName: "getOffer",
              args: [args.offerId],
            })) as any;
            lines.push([
              `Deal (Offer #${args.offerId})`,
              `  Maker: ${abbreviateAddress(offer.maker)}`,
              `  Taker: ${abbreviateAddress(args.taker)}`,
              `  ${formatTokenAmount(offer.amountA)} ${tokenSymbol(offer.tokenA)} ↔ ${formatTokenAmount(offer.amountB)} ${tokenSymbol(offer.tokenB)}`,
              `  Block: ${log.blockNumber}`,
            ].join("\n"));
          } catch {
            lines.push(`Deal (Offer #${args.offerId}) — Block: ${log.blockNumber}`);
          }
        }
        const formatted = lines.join("\n\n---\n\n");

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Recent Deals (${Math.min(logs.length, 50)}):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error fetching deals: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );
}
