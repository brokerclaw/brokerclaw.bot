import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getContractAddresses } from "../contracts/client.js";
import { RFQ_ENGINE_ABI } from "../contracts/abi.js";
import { formatTokenAmount, tokenSymbol, abbreviateAddress, formatRfqStatus } from "../utils/format.js";

export function registerRfqResource(server: McpServer): void {
  server.resource(
    "rfq",
    "bankers://rfq",
    {
      description: "Active RFQ (Request for Quote) requests on the BROKER protocol",
      mimeType: "text/plain",
    },
    async (uri) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const requests = (await client.readContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "getActiveRequests",
          args: [0n, 50n],
        })) as readonly any[];

        if (requests.length === 0) {
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: "text/plain",
                text: "No active RFQ requests.",
              },
            ],
          };
        }

        const formatted = requests
          .map(
            (r: any) =>
              [
                `RFQ #${r.id}`,
                `  Requester: ${abbreviateAddress(r.requester)}`,
                `  Offering: ${formatTokenAmount(r.amountA)} ${tokenSymbol(r.tokenA)}`,
                `  Seeking: ${tokenSymbol(r.tokenB)}`,
                `  Status: ${formatRfqStatus(r.status)}`,
              ].join("\n")
          )
          .join("\n\n---\n\n");

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Active RFQs (${requests.length}):\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/plain",
              text: `Error fetching RFQs: ${(error as Error).message}`,
            },
          ],
        };
      }
    }
  );
}
