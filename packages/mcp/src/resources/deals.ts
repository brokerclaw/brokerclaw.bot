import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { OTC_MARKET_ABI } from "../contracts/abi.js";
import { formatTokenAmount, tokenSymbol, abbreviateAddress, formatTimestamp } from "../utils/format.js";

export function registerDealsResource(server: McpServer): void {
  server.resource(
    "deals",
    "bankers://deals",
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
          address: addresses.otcMarket,
          event: {
            type: "event",
            name: "DealCompleted",
            inputs: [
              { name: "offerId", type: "uint256", indexed: true },
              { name: "maker", type: "address", indexed: true },
              { name: "taker", type: "address", indexed: true },
              { name: "tokenA", type: "address", indexed: false },
              { name: "amountA", type: "uint256", indexed: false },
              { name: "tokenB", type: "address", indexed: false },
              { name: "amountB", type: "uint256", indexed: false },
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

        const formatted = logs
          .reverse()
          .slice(0, 50)
          .map((log) => {
            const args = log.args as any;
            return [
              `Deal (Offer #${args.offerId})`,
              `  Maker: ${abbreviateAddress(args.maker)}`,
              `  Taker: ${abbreviateAddress(args.taker)}`,
              `  ${formatTokenAmount(args.amountA)} ${tokenSymbol(args.tokenA)} ↔ ${formatTokenAmount(args.amountB)} ${tokenSymbol(args.tokenB)}`,
              `  Block: ${log.blockNumber}`,
            ].join("\n");
          })
          .join("\n\n---\n\n");

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
