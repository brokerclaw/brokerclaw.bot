import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Transport,
  type Account,
} from "viem";
import { base, baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getAddresses, type ContractAddresses } from "./addresses.js";

/**
 * Environment configuration for the BROKER MCP client.
 *
 * BROKER_PRIVATE_KEY — Hex-encoded private key for signing transactions
 * BROKER_RPC_URL    — Custom RPC endpoint (defaults to public Base RPC)
 * BROKER_CHAIN      — "mainnet" | "testnet" (defaults to "mainnet")
 */
interface BrokerConfig {
  chain: Chain;
  addresses: ContractAddresses;
  rpcUrl: string;
  account: Account | undefined;
}

function loadConfig(): BrokerConfig {
  const isTestnet = process.env.BROKER_CHAIN === "testnet";
  const chain = isTestnet ? baseSepolia : base;
  const addresses = getAddresses(chain.id);

  const defaultRpc = isTestnet
    ? "https://sepolia.base.org"
    : "https://mainnet.base.org";
  const rpcUrl = process.env.BROKER_RPC_URL || defaultRpc;

  let account: Account | undefined;
  const rawKey = process.env.BROKER_PRIVATE_KEY;
  if (rawKey && /^(0x)?[0-9a-fA-F]{64}$/.test(rawKey)) {
    const key = rawKey.startsWith("0x")
      ? (rawKey as `0x${string}`)
      : (`0x${rawKey}` as `0x${string}`);
    account = privateKeyToAccount(key);
  }

  return { chain, addresses, rpcUrl, account };
}

let _config: BrokerConfig | undefined;
let _publicClient: PublicClient<Transport, Chain> | undefined;
let _walletClient: WalletClient<Transport, Chain, Account> | undefined;

export function getConfig(): BrokerConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

/**
 * Get a viem PublicClient for reading on-chain data.
 */
export function getPublicClient(): PublicClient<Transport, Chain> {
  if (!_publicClient) {
    const config = getConfig();
    _publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    }) as PublicClient<Transport, Chain>;
  }
  return _publicClient;
}

/**
 * Get a viem WalletClient for writing transactions.
 * Throws if BROKER_PRIVATE_KEY is not set.
 */
export function getWalletClient(): WalletClient<Transport, Chain, Account> {
  if (!_walletClient) {
    const config = getConfig();
    if (!config.account) {
      throw new Error(
        "BROKER_PRIVATE_KEY environment variable is required for write operations. " +
        "Set it to your hex-encoded private key."
      );
    }
    _walletClient = createWalletClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
      account: config.account,
    }) as WalletClient<Transport, Chain, Account>;
  }
  return _walletClient;
}

/**
 * Get the wallet address or undefined if no key is configured.
 */
export function getWalletAddress(): `0x${string}` | undefined {
  const config = getConfig();
  return config.account?.address;
}

/**
 * Get contract addresses for the configured chain.
 */
export function getContractAddresses(): ContractAddresses {
  return getConfig().addresses;
}
