import type {
  Address,
  PublicClient,
  WalletClient,
  TestClient,
  Chain,
  Transport,
  Account,
} from "viem";
import { parseAbi } from "viem";
import { BrokerClient, OfferStatus, RFQStatus } from "@brokerclaw/sdk";
import type { TestEnvironment } from "./setup.js";
import { advanceTime, getBlockTimestamp } from "./setup.js";
import { AMOUNTS } from "./fixtures.js";

const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
]);

/**
 * Get the ERC-20 balance of an account.
 */
export async function getBalance(
  publicClient: PublicClient<Transport, Chain>,
  token: Address,
  account: Address
): Promise<bigint> {
  return (await publicClient.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;
}

/**
 * Approve a spender to spend tokens on behalf of the owner.
 */
export async function approveToken(
  walletClient: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  token: Address,
  spender: Address,
  amount: bigint
): Promise<void> {
  const hash = await walletClient.writeContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, amount],
    chain: walletClient.chain,
    account: walletClient.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Mint tokens to an address (requires mint permission).
 */
export async function mintTokens(
  deployer: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  token: Address,
  to: Address,
  amount: bigint
): Promise<void> {
  const hash = await deployer.writeContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "mint",
    args: [to, amount],
    chain: deployer.chain,
    account: deployer.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Create a standard offer (tokenA -> tokenB) and return the offerId.
 */
export async function createStandardOffer(
  env: TestEnvironment,
  options: {
    maker?: BrokerClient;
    sellToken?: Address;
    buyToken?: Address;
    sellAmount?: bigint;
    buyAmount?: bigint;
    deadline?: bigint;
    minFillPercent?: bigint;
  } = {}
): Promise<bigint> {
  const maker = options.maker ?? env.brokerMaker;
  const sellToken = options.sellToken ?? env.tokenA;
  const buyToken = options.buyToken ?? env.tokenB;
  const sellAmount = options.sellAmount ?? AMOUNTS.standard;
  const buyAmount = options.buyAmount ?? AMOUNTS.half;

  const now = await getBlockTimestamp(env.publicClient);
  const deadline = options.deadline ?? now + 86400n;

  const result = await maker.createOffer({
    sellToken,
    buyToken,
    sellAmount,
    buyAmount,
    deadline,
    minFillPercent: options.minFillPercent,
  });

  return result.offerId;
}

/**
 * Create a standard RFQ and return the rfqId.
 */
export async function createStandardRFQ(
  env: TestEnvironment,
  options: {
    requester?: BrokerClient;
    sellToken?: Address;
    buyToken?: Address;
    sellAmount?: bigint;
    deadline?: bigint;
  } = {}
): Promise<bigint> {
  const requester = options.requester ?? env.brokerMaker;
  const sellToken = options.sellToken ?? env.tokenA;
  const buyToken = options.buyToken ?? env.tokenB;
  const sellAmount = options.sellAmount ?? AMOUNTS.standard;

  const now = await getBlockTimestamp(env.publicClient);
  const deadline = options.deadline ?? now + 3600n;

  const result = await requester.requestQuote({
    sellToken,
    buyToken,
    sellAmount,
    deadline,
  });

  return result.rfqId;
}

/**
 * Create an offer and immediately fill it. Returns both IDs and tx hashes.
 */
export async function createAndFillOffer(
  env: TestEnvironment,
  options: {
    sellAmount?: bigint;
    buyAmount?: bigint;
  } = {}
): Promise<{ offerId: bigint; fillHash: string }> {
  const offerId = await createStandardOffer(env, {
    sellAmount: options.sellAmount,
    buyAmount: options.buyAmount,
  });

  const fillResult = await env.brokerTaker.fillOffer({ offerId });
  return { offerId, fillHash: fillResult.hash };
}

/**
 * Wait for an offer to reach a specific status (with timeout).
 */
export async function waitForOfferStatus(
  client: BrokerClient,
  offerId: bigint,
  expectedStatus: OfferStatus,
  maxAttempts: number = 10
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const offer = await client.getOffer(offerId);
    if (offer.status === expectedStatus) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Offer ${offerId} did not reach status ${expectedStatus} within ${maxAttempts} attempts`
  );
}

/**
 * Expire an offer by advancing time past its deadline.
 */
export async function expireOffer(
  env: TestEnvironment,
  offerId: bigint
): Promise<void> {
  const offer = await env.brokerMaker.getOffer(offerId);
  const now = await getBlockTimestamp(env.publicClient);
  const remaining = offer.deadline - now;
  if (remaining > 0n) {
    await advanceTime(env.testClient, env.publicClient, remaining + 1n);
  }
}

/**
 * Calculate the expected fee for a given amount.
 * Default: 30 bps (0.3%)
 */
export function calculateExpectedFee(
  amount: bigint,
  feeBps: bigint = 30n
): bigint {
  return (amount * feeBps) / 10000n;
}

/**
 * Calculate the treasury and burn portions of a fee.
 */
export function splitFee(
  fee: bigint,
  burnBps: bigint = 3333n,
  treasuryBps: bigint = 6667n
): { burnAmount: bigint; treasuryAmount: bigint } {
  const burnAmount = (fee * burnBps) / 10000n;
  const treasuryAmount = (fee * treasuryBps) / 10000n;
  return { burnAmount, treasuryAmount };
}

/**
 * Assert that two bigints are approximately equal (within a tolerance).
 * Useful for fee calculations that may have rounding.
 */
export function assertApproxEqual(
  actual: bigint,
  expected: bigint,
  tolerance: bigint = 1n,
  message?: string
): void {
  const diff = actual > expected ? actual - expected : expected - actual;
  if (diff > tolerance) {
    throw new Error(
      message ??
        `Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`
    );
  }
}

/**
 * Get a future timestamp (current block time + offset in seconds).
 */
export async function futureTimestamp(
  publicClient: PublicClient<Transport, Chain>,
  offsetSeconds: bigint
): Promise<bigint> {
  const now = await getBlockTimestamp(publicClient);
  return now + offsetSeconds;
}

/**
 * Get a past timestamp (current block time - offset in seconds).
 */
export async function pastTimestamp(
  publicClient: PublicClient<Transport, Chain>,
  offsetSeconds: bigint
): Promise<bigint> {
  const now = await getBlockTimestamp(publicClient);
  return now - offsetSeconds;
}
