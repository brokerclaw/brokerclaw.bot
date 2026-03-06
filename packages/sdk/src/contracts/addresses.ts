import type { Address } from "viem";

export interface BrokerAddresses {
  escrow: Address;
  reputation: Address;
  rfq: Address;
}

/** Base mainnet (chainId: 8453) — deployed 2026-03-06 */
export const BASE_MAINNET_ADDRESSES: BrokerAddresses = {
  escrow: "0xd141E2De0Cca22feaB5F764040A5BD3d7A84AEce" as Address,
  reputation: "0x65f08ed423585AAA8C95721080aF69B748E27C64" as Address,
  rfq: "0x3aFa1253e28a93b5Eda721C32666AB017D27132f" as Address,
};

/** Base Sepolia testnet (chainId: 84532) — not yet deployed */
export const BASE_TESTNET_ADDRESSES: BrokerAddresses = {
  escrow: "0x0000000000000000000000000000000000000000" as Address,
  reputation: "0x0000000000000000000000000000000000000000" as Address,
  rfq: "0x0000000000000000000000000000000000000000" as Address,
};

/** Resolve addresses by chain ID. Falls back to testnet for unknown chains. */
export function getAddresses(chainId: number): BrokerAddresses {
  switch (chainId) {
    case 8453:
      return BASE_MAINNET_ADDRESSES;
    case 84532:
      return BASE_TESTNET_ADDRESSES;
    default:
      return BASE_TESTNET_ADDRESSES;
  }
}
