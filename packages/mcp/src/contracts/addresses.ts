import type { Address } from "viem";

export interface ContractAddresses {
  otcMarket: Address;
  rfqEngine: Address;
  reputation: Address;
  escrow: Address;
}

/**
 * Deployed contract addresses on Base mainnet (chainId 8453)
 * These will be updated after mainnet deployment.
 */
export const BASE_MAINNET: ContractAddresses = {
  otcMarket: "0x0000000000000000000000000000000000000001" as Address,
  rfqEngine: "0x0000000000000000000000000000000000000002" as Address,
  reputation: "0x0000000000000000000000000000000000000003" as Address,
  escrow: "0x0000000000000000000000000000000000000004" as Address,
};

/**
 * Deployed contract addresses on Base Sepolia testnet (chainId 84532)
 */
export const BASE_TESTNET: ContractAddresses = {
  otcMarket: "0x0000000000000000000000000000000000000001" as Address,
  rfqEngine: "0x0000000000000000000000000000000000000002" as Address,
  reputation: "0x0000000000000000000000000000000000000003" as Address,
  escrow: "0x0000000000000000000000000000000000000004" as Address,
};

/**
 * Well-known token addresses on Base mainnet
 */
export const TOKENS: Record<string, Address> = {
  WETH: "0x4200000000000000000000000000000000000006",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
  cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
};

/**
 * Get contract addresses for a given chain ID
 */
export function getAddresses(chainId: number): ContractAddresses {
  switch (chainId) {
    case 8453:
      return BASE_MAINNET;
    case 84532:
      return BASE_TESTNET;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}. Use 8453 (Base) or 84532 (Base Sepolia).`);
  }
}
