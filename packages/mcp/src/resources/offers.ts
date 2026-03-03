import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { OTC_MARKET_ABI } from "../contracts/abi.js";
import { formatOffer } from "../utils/format.js";

export function registerOffersResource(server: McpServer): void {
  server.resource(
    "offers",
    "brokers://offers",
    {
      description: "Live feed of open OTC offers on the BROKER protocol",
      mimeType: "text/plain",
    },
    async (uri) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const offers = (await client.readContract({
          address: addresses.otcMarket,
          abi: OTC_MARKET_ABI,
          functionName: "getOpenOffers",
          args: [0n, 50n],
        })) as readonly any[];

        if (offers.length === 0) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "text/plain",
                text: "No open offers currently available.",
              },
            ],
          };
        }

        const formatted = offers.map((o: any) => formatOffer(o)).join("\n\n---\n\n");
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Open Offers (${offers.length}):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error fetching offers: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );
}
