import type { Address } from "viem";

/** Private keys for test accounts (Anvil default accounts) */
export const TEST_ACCOUNTS = {
  deployer: {
    key: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as `0x${string}`,
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address,
  },
  maker: {
    key: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d" as `0x${string}`,
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address,
  },
  taker: {
    key: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" as `0x${string}`,
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as Address,
  },
  agent3: {
    key: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6" as `0x${string}`,
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as Address,
  },
  agent4: {
    key: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a" as `0x${string}`,
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" as Address,
  },
  treasury: {
    key: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba" as `0x${string}`,
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc" as Address,
  },
} as const;

/** Token configuration for tests */
export const TOKEN_CONFIG = {
  tokenA: {
    name: "Token A",
    symbol: "TKNA",
    decimals: 18,
    initialSupply: 1_000_000n * 10n ** 18n, // 1M tokens
  },
  tokenB: {
    name: "Token B",
    symbol: "TKNB",
    decimals: 18,
    initialSupply: 1_000_000n * 10n ** 18n,
  },
  usdc: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    initialSupply: 1_000_000n * 10n ** 6n,
  },
} as const;

/** Standard test amounts */
export const AMOUNTS = {
  /** 100 tokens (18 decimals) */
  standard: 100n * 10n ** 18n,
  /** 50 tokens (18 decimals) */
  half: 50n * 10n ** 18n,
  /** 1000 tokens (18 decimals) */
  large: 1000n * 10n ** 18n,
  /** 10 tokens (18 decimals) */
  small: 10n * 10n ** 18n,
  /** 100 USDC (6 decimals) */
  usdcStandard: 100n * 10n ** 6n,
  /** 50 USDC (6 decimals) */
  usdcHalf: 50n * 10n ** 6n,
} as const;

/** Fee configuration for tests */
export const FEE_CONFIG = {
  /** Total fee: 30 bps (0.3%) */
  feeBps: 30n,
  /** Burn portion: 10 bps of the fee */
  burnBps: 3333n,
  /** Treasury portion: remaining of the fee */
  treasuryBps: 6667n,
} as const;

/** Timeouts and deadlines */
export const TIMES = {
  /** 24 hours in seconds */
  oneDay: 86400n,
  /** 1 hour in seconds */
  oneHour: 3600n,
  /** 30 minutes in seconds */
  thirtyMinutes: 1800n,
  /** 5 minutes in seconds — used for "about to expire" tests */
  fiveMinutes: 300n,
  /** 1 second — already expired */
  expired: 1n,
} as const;

/** Mock MCP tool definitions matching the protocol */
export const MCP_TOOLS = [
  {
    name: "brokers_create_offer",
    description: "Create a new OTC offer on the BROKER protocol",
    inputSchema: {
      type: "object" as const,
      properties: {
        sellToken: { type: "string" as const },
        buyToken: { type: "string" as const },
        sellAmount: { type: "string" as const },
        buyAmount: { type: "string" as const },
        minFillPercent: { type: "string" as const },
        deadline: { type: "string" as const },
      },
      required: ["sellToken", "buyToken", "sellAmount", "buyAmount"],
    },
  },
  {
    name: "brokers_fill_offer",
    description: "Fill an existing OTC offer",
    inputSchema: {
      type: "object" as const,
      properties: {
        offerId: { type: "string" as const },
        fillAmount: { type: "string" as const },
      },
      required: ["offerId"],
    },
  },
  {
    name: "brokers_get_offer",
    description: "Get details of an offer",
    inputSchema: {
      type: "object" as const,
      properties: {
        offerId: { type: "string" as const },
      },
      required: ["offerId"],
    },
  },
  {
    name: "brokers_list_offers",
    description: "List offers with optional filters",
    inputSchema: {
      type: "object" as const,
      properties: {
        maker: { type: "string" as const },
        status: { type: "string" as const },
      },
    },
  },
  {
    name: "brokers_request_quote",
    description: "Request a quote from market makers",
    inputSchema: {
      type: "object" as const,
      properties: {
        sellToken: { type: "string" as const },
        buyToken: { type: "string" as const },
        sellAmount: { type: "string" as const },
      },
      required: ["sellToken", "buyToken", "sellAmount"],
    },
  },
  {
    name: "brokers_get_reputation",
    description: "Get reputation score for an agent",
    inputSchema: {
      type: "object" as const,
      properties: {
        agent: { type: "string" as const },
      },
      required: ["agent"],
    },
  },
] as const;
