import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPublicClient, getWalletClient, getContractAddresses, getWalletAddress } from "../contracts/client.js";
import { RFQ_ENGINE_ABI } from "../contracts/abi.js";
import { formatTokenAmount, tokenSymbol, formatRfqStatus, formatQuoteStatus, abbreviateAddress } from "../utils/format.js";
import { resolveToken, parseTokenAmount, getTokenDecimals, hoursToExpiry, requireWallet } from "../utils/validation.js";

export function registerRfqTools(server: McpServer): void {
  /**
   * brokers_request_quote — Broadcast an RFQ (Request for Quote)
   */
  server.tool(
    "brokers_request_quote",
    "Broadcast a Request for Quote (RFQ) to the Brokers Bot network. You specify what you have and what you want, and market makers respond with quotes.",
    {
      tokenA: z.string().describe("Token you have to offer (address or symbol)"),
      amountA: z.string().describe("Amount of tokenA you want to trade (human readable)"),
      tokenB: z.string().describe("Token you want to receive (address or symbol)"),
      expiryHours: z.number().min(0.1).max(168).default(4).describe("Hours until the RFQ expires (default: 4)"),
    },
    async ({ tokenA, amountA, tokenB, expiryHours }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const tokenAAddr = resolveToken(tokenA);
        const tokenBAddr = resolveToken(tokenB);
        const decimalsA = await getTokenDecimals(tokenAAddr);
        const rawAmount = parseTokenAmount(amountA, decimalsA);
        const expirySeconds = hoursToExpiry(expiryHours);

        const walletClient = getWalletClient();
        const addresses = getContractAddresses();

        const hash = await walletClient.writeContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "requestQuote",
          args: [tokenAAddr, rawAmount, tokenBAddr, expirySeconds],
        });

        return {
          content: [
            {
              type: "text",
              text: [
                "✅ RFQ broadcast successfully!",
                `  Transaction: ${hash}`,
                `  Offering: ${amountA} ${tokenSymbol(tokenAAddr)}`,
                `  Seeking: ${tokenSymbol(tokenBAddr)}`,
                `  Expires in: ${expiryHours} hours`,
                "",
                "Market makers will submit quotes. Check with brokers_get_quotes once the request ID is available.",
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error broadcasting RFQ: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_get_quotes — Get all quotes submitted for an RFQ
   */
  server.tool(
    "brokers_get_quotes",
    "Get all quotes submitted for a specific RFQ request.",
    {
      requestId: z.union([z.string(), z.number()]).describe("The RFQ request ID"),
    },
    async ({ requestId }) => {
      const client = getPublicClient();
      const addresses = getContractAddresses();

      try {
        const id = BigInt(requestId);

        // Get the request details
        const request = (await client.readContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "getRequest",
          args: [id],
        })) as any;

        // Get all quotes
        const quotes = (await client.readContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "getQuotesForRequest",
          args: [id],
        })) as readonly any[];

        const requestInfo = [
          `RFQ #${request.id}`,
          `  Requester: ${abbreviateAddress(request.requester)}`,
          `  Offering: ${formatTokenAmount(request.amountA)} ${tokenSymbol(request.tokenA)}`,
          `  Seeking: ${tokenSymbol(request.tokenB)}`,
          `  Status: ${formatRfqStatus(request.status)}`,
        ].join("\n");

        if (quotes.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `${requestInfo}\n\nNo quotes submitted yet.`,
              },
            ],
          };
        }

        const quotesFormatted = quotes
          .map((q: any) =>
            [
              `  Quote #${q.id}`,
              `    Quoter: ${abbreviateAddress(q.quoter)}`,
              `    Offered: ${formatTokenAmount(q.amountB)} ${tokenSymbol(request.tokenB)}`,
              `    Status: ${formatQuoteStatus(q.status)}`,
            ].join("\n")
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `${requestInfo}\n\nQuotes (${quotes.length}):\n\n${quotesFormatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error fetching quotes: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_submit_quote — Respond to an RFQ with a quote
   */
  server.tool(
    "brokers_submit_quote",
    "Submit a quote in response to an RFQ. You specify how much tokenB you'll provide.",
    {
      requestId: z.union([z.string(), z.number()]).describe("The RFQ request ID to quote on"),
      amountB: z.string().describe("Amount of tokenB you are quoting (human readable)"),
      expiryHours: z.number().min(0.1).max(168).default(2).describe("Hours until your quote expires (default: 2)"),
    },
    async ({ requestId, amountB, expiryHours }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const id = BigInt(requestId);
        // Fetch request to get tokenB decimals
        const reqData = (await getPublicClient().readContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "getRequest",
          args: [id],
        })) as any;
        const decimalsB = await getTokenDecimals(reqData.tokenB);
        const rawAmount = parseTokenAmount(amountB, decimalsB);
        const expirySeconds = hoursToExpiry(expiryHours);

        const walletClient = getWalletClient();
        const addresses = getContractAddresses();

        const hash = await walletClient.writeContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "submitQuote",
          args: [id, rawAmount, expirySeconds],
        });

        return {
          content: [
            {
              type: "text",
              text: [
                "✅ Quote submitted!",
                `  Transaction: ${hash}`,
                `  RFQ #${id}`,
                `  Your quote: ${amountB}`,
                `  Expires in: ${expiryHours} hours`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error submitting quote: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  /**
   * brokers_accept_quote — Accept a quote from an RFQ
   */
  server.tool(
    "brokers_accept_quote",
    "Accept a specific quote from an RFQ. This executes the trade.",
    {
      quoteId: z.union([z.string(), z.number()]).describe("The quote ID to accept"),
    },
    async ({ quoteId }) => {
      const walletAddress = getWalletAddress();
      requireWallet(walletAddress);

      try {
        const id = BigInt(quoteId);
        const walletClient = getWalletClient();
        const addresses = getContractAddresses();

        const hash = await walletClient.writeContract({
          address: addresses.rfqEngine,
          abi: RFQ_ENGINE_ABI,
          functionName: "acceptQuote",
          args: [id],
        });

        return {
          content: [
            {
              type: "text",
              text: [
                "✅ Quote accepted! Trade executing.",
                `  Transaction: ${hash}`,
                `  Quote #${id}`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error accepting quote: ${(error as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
