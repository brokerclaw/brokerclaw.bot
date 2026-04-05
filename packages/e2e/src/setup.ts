import {
  createTestClient,
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
  type PublicClient,
  type WalletClient,
  type TestClient,
  type Chain,
  type Transport,
  type Account,
  type Abi,
} from "viem";
import { foundry } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { BrokerClient, type BrokerAddresses } from "@brokerclaw/sdk";
import { TEST_ACCOUNTS, TOKEN_CONFIG, FEE_CONFIG } from "./fixtures.js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Foundry artifact loader ────────────���─────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACTS_OUT = resolve(__dirname, "../../contracts/out");

interface FoundryArtifact {
  abi: Abi;
  bytecode: { object: `0x${string}` };
}

function loadArtifact(solFile: string, contractName: string): FoundryArtifact {
  const path = resolve(CONTRACTS_OUT, solFile, `${contractName}.json`);
  return JSON.parse(readFileSync(path, "utf-8")) as FoundryArtifact;
}

// ── Minimal ABI for ERC-20 test helpers (mint, transfer) ─────────

const ERC20_HELPER_ABI = parseAbi([
  "function mint(address to, uint256 amount)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

// ── Types ────────────────────────────────────────────────────────

export interface TestEnvironment {
  publicClient: PublicClient<Transport, Chain>;
  testClient: TestClient;
  deployer: WalletClient<Transport, Chain, Account>;
  maker: WalletClient<Transport, Chain, Account>;
  taker: WalletClient<Transport, Chain, Account>;
  agent3: WalletClient<Transport, Chain, Account>;
  agent4: WalletClient<Transport, Chain, Account>;
  tokenA: Address;
  tokenB: Address;
  usdc: Address;
  addresses: BrokerAddresses;
  brokerDeployer: BrokerClient;
  brokerMaker: BrokerClient;
  brokerTaker: BrokerClient;
  brokerAgent3: BrokerClient;
  brokerAgent4: BrokerClient;
}

function makeWalletClient(
  key: `0x${string}`
): WalletClient<Transport, Chain, Account> {
  const account = privateKeyToAccount(key);
  return createWalletClient({
    chain: foundry,
    transport: http("http://127.0.0.1:8545"),
    account,
  }) as WalletClient<Transport, Chain, Account>;
}

// ── Contract deployment helpers ──────────��───────────────────────

async function deployContract(
  deployer: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  artifact: FoundryArtifact,
  args: readonly unknown[] = []
): Promise<Address> {
  const hash = await deployer.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode.object,
    args: [...args],
    chain: deployer.chain,
    account: deployer.account,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt.contractAddress!;
}

// ── Main setup ────────────��──────────────────────────────────────

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  const publicClient = createPublicClient({
    chain: foundry,
    transport: http("http://127.0.0.1:8545"),
  }) as PublicClient<Transport, Chain>;

  const testClient = createTestClient({
    chain: foundry,
    transport: http("http://127.0.0.1:8545"),
    mode: "anvil",
  });

  // Create wallet clients for all test accounts
  const deployer = makeWalletClient(TEST_ACCOUNTS.deployer.key);
  const maker = makeWalletClient(TEST_ACCOUNTS.maker.key);
  const taker = makeWalletClient(TEST_ACCOUNTS.taker.key);
  const agent3 = makeWalletClient(TEST_ACCOUNTS.agent3.key);
  const agent4 = makeWalletClient(TEST_ACCOUNTS.agent4.key);

  // Load Foundry artifacts
  const MockERC20 = loadArtifact("MockERC20.sol", "MockERC20");
  const MockWETH = loadArtifact("MockERC20.sol", "MockWETH");
  const BrokerReputation = loadArtifact("BrokerReputation.sol", "BrokerReputation");
  const BrokerEscrow = loadArtifact("BrokerEscrow.sol", "BrokerEscrow");
  const BrokerRFQ = loadArtifact("BrokerRFQ.sol", "BrokerRFQ");

  // Deploy mock ERC-20 tokens
  const tokenA = await deployContract(deployer, publicClient, MockERC20, [
    TOKEN_CONFIG.tokenA.name,
    TOKEN_CONFIG.tokenA.symbol,
    TOKEN_CONFIG.tokenA.decimals,
  ]);
  const tokenB = await deployContract(deployer, publicClient, MockERC20, [
    TOKEN_CONFIG.tokenB.name,
    TOKEN_CONFIG.tokenB.symbol,
    TOKEN_CONFIG.tokenB.decimals,
  ]);
  const usdc = await deployContract(deployer, publicClient, MockERC20, [
    TOKEN_CONFIG.usdc.name,
    TOKEN_CONFIG.usdc.symbol,
    TOKEN_CONFIG.usdc.decimals,
  ]);

  // Deploy MockWETH
  const weth = await deployContract(deployer, publicClient, MockWETH);

  // Deploy protocol contracts (same sequence as Deploy.s.sol)
  // 1. BrokerReputation with placeholder escrow
  const reputation = await deployContract(deployer, publicClient, BrokerReputation, [
    "0x0000000000000000000000000000000000000001", // placeholder escrow
    deployer.account.address,                      // owner
  ]);

  // 2. BrokerEscrow
  const escrow = await deployContract(deployer, publicClient, BrokerEscrow, [
    weth,                        // _weth
    TEST_ACCOUNTS.treasury.address, // _treasury
    "0x0000000000000000000000000000000000000000", // _brokerToken (none for tests)
    reputation,                  // _reputation
    deployer.account.address,    // _owner
  ]);

  // 3. Point reputation to the real escrow
  const setEscrowAbi = parseAbi(["function setEscrow(address _escrow)"]);
  let hash = await deployer.writeContract({
    address: reputation,
    abi: setEscrowAbi,
    functionName: "setEscrow",
    args: [escrow],
    chain: deployer.chain,
    account: deployer.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  // 4. BrokerRFQ
  const rfq = await deployContract(deployer, publicClient, BrokerRFQ, [
    escrow,                      // _escrow
    deployer.account.address,    // _owner
  ]);

  // 5. Authorize RFQ to create offers on behalf of users
  const setAuthorizedAbi = parseAbi(["function setAuthorizedCaller(address caller, bool authorized)"]);
  hash = await deployer.writeContract({
    address: escrow,
    abi: setAuthorizedAbi,
    functionName: "setAuthorizedCaller",
    args: [rfq, true],
    chain: deployer.chain,
    account: deployer.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });

  const addresses: BrokerAddresses = { escrow, reputation, rfq };

  // Mint initial supply to deployer
  for (const [token, config] of [
    [tokenA, TOKEN_CONFIG.tokenA],
    [tokenB, TOKEN_CONFIG.tokenB],
    [usdc, TOKEN_CONFIG.usdc],
  ] as const) {
    const mintHash = await deployer.writeContract({
      address: token,
      abi: ERC20_HELPER_ABI,
      functionName: "mint",
      args: [deployer.account.address, config.initialSupply],
      chain: deployer.chain,
      account: deployer.account,
    });
    await publicClient.waitForTransactionReceipt({ hash: mintHash });
  }

  // Fund test accounts with tokens
  await fundAccount(deployer, publicClient, tokenA, TEST_ACCOUNTS.maker.address, 10000n * 10n ** 18n);
  await fundAccount(deployer, publicClient, tokenA, TEST_ACCOUNTS.taker.address, 10000n * 10n ** 18n);
  await fundAccount(deployer, publicClient, tokenA, TEST_ACCOUNTS.agent3.address, 10000n * 10n ** 18n);
  await fundAccount(deployer, publicClient, tokenA, TEST_ACCOUNTS.agent4.address, 10000n * 10n ** 18n);

  await fundAccount(deployer, publicClient, tokenB, TEST_ACCOUNTS.maker.address, 10000n * 10n ** 18n);
  await fundAccount(deployer, publicClient, tokenB, TEST_ACCOUNTS.taker.address, 10000n * 10n ** 18n);
  await fundAccount(deployer, publicClient, tokenB, TEST_ACCOUNTS.agent3.address, 10000n * 10n ** 18n);
  await fundAccount(deployer, publicClient, tokenB, TEST_ACCOUNTS.agent4.address, 10000n * 10n ** 18n);

  await fundAccount(deployer, publicClient, usdc, TEST_ACCOUNTS.maker.address, 100000n * 10n ** 6n);
  await fundAccount(deployer, publicClient, usdc, TEST_ACCOUNTS.taker.address, 100000n * 10n ** 6n);

  // Create BrokerClient instances for each account
  const makeBrokerClient = (wallet: WalletClient<Transport, Chain, Account>) => {
    return new BrokerClient({ publicClient, walletClient: wallet }).withAddresses(addresses);
  };

  return {
    publicClient,
    testClient,
    deployer,
    maker,
    taker,
    agent3,
    agent4,
    tokenA,
    tokenB,
    usdc,
    addresses,
    brokerDeployer: makeBrokerClient(deployer),
    brokerMaker: makeBrokerClient(maker),
    brokerTaker: makeBrokerClient(taker),
    brokerAgent3: makeBrokerClient(agent3),
    brokerAgent4: makeBrokerClient(agent4),
  };
}

// ── Internal helpers ───────────────────��───────────────────────

async function fundAccount(
  deployer: WalletClient<Transport, Chain, Account>,
  publicClient: PublicClient<Transport, Chain>,
  token: Address,
  to: Address,
  amount: bigint
): Promise<void> {
  const hash = await deployer.writeContract({
    address: token,
    abi: ERC20_HELPER_ABI,
    functionName: "transfer",
    args: [to, amount],
    chain: deployer.chain,
    account: deployer.account,
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Get the current block timestamp from the test chain.
 */
export async function getBlockTimestamp(
  publicClient: PublicClient<Transport, Chain>
): Promise<bigint> {
  const block = await publicClient.getBlock();
  return block.timestamp;
}

/**
 * Advance the Anvil chain time by the specified number of seconds.
 */
export async function advanceTime(
  testClient: TestClient,
  publicClient: PublicClient<Transport, Chain>,
  seconds: bigint
): Promise<void> {
  await (testClient as any).increaseTime({ seconds: Number(seconds) });
  await (testClient as any).mine({ blocks: 1 });
}

/**
 * Take a snapshot of the current Anvil state for later revert.
 */
export async function snapshot(testClient: TestClient): Promise<`0x${string}`> {
  return await (testClient as any).snapshot();
}

/**
 * Revert to a previous snapshot.
 */
export async function revert(
  testClient: TestClient,
  snapshotId: `0x${string}`
): Promise<void> {
  await (testClient as any).revert({ id: snapshotId });
}
