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
        const totalOffers = (await client.readContract({
          address: addresses.escrow,
          abi: OTC_MARKET_ABI,
          functionName: "offerCount",
        })) as bigint;

        if (totalOffers === 0n) {
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

        const offers: any[] = [];
        for (let i = Number(totalOffers); i >= 1 && offers.length < 50; i--) {
          try {
            const offer = (await client.readContract({
              address: addresses.escrow,
              abi: OTC_MARKET_ABI,
              functionName: "getOffer",
              args: [BigInt(i)],
            })) as any;
            // Only show open offers (status 0)
            if (offer.status === 0) {
              offers.push({ ...offer, id: BigInt(i) });
            }
          } catch {
            continue;
          }
        }

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
