import type { Address } from "viem";

export interface ContractAddresses {
  escrow: Address;
  rfq: Address;
  reputation: Address;
}

/**
 * Deployed contract addresses on Base mainnet (chainId 8453)
 * Deployed: 2026-03-06
 * Deployer: 0x29D85610b0Ed8bb591d2C765546dA8b4004C8ec3
 */
export const BASE_MAINNET: ContractAddresses = {
  escrow: "0xd141E2De0Cca22feaB5F764040A5BD3d7A84AEce" as Address,
  rfq: "0x3aFa1253e28a93b5Eda721C32666AB017D27132f" as Address,
  reputation: "0x65f08ed423585AAA8C95721080aF69B748E27C64" as Address,
};

/**
 * Deployed contract addresses on Base Sepolia testnet (chainId 84532)
 * Not yet deployed.
 */
export const BASE_TESTNET: ContractAddresses = {
  escrow: "0x0000000000000000000000000000000000000000" as Address,
  rfq: "0x0000000000000000000000000000000000000000" as Address,
  reputation: "0x0000000000000000000000000000000000000000" as Address,
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
