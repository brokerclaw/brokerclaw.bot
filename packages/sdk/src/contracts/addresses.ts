import type { Address } from "viem";

export interface BrokerAddresses {
  escrow: Address;
  reputation: Address;
  rfq: Address;
}

/** Base mainnet (chainId: 8453) */
export const BASE_MAINNET_ADDRESSES: BrokerAddresses = {
  escrow: "0xBR0KER00000000000000000000000000000ESC01" as Address,
  reputation: "0xBR0KER00000000000000000000000000000REP01" as Address,
  rfq: "0xBR0KER00000000000000000000000000000RFQ01" as Address,
};

/** Base Sepolia testnet (chainId: 84532) */
export const BASE_TESTNET_ADDRESSES: BrokerAddresses = {
  escrow: "0xBR0KER0TEST000000000000000000000000ESC01" as Address,
  reputation: "0xBR0KER0TEST000000000000000000000000REP01" as Address,
  rfq: "0xBR0KER0TEST000000000000000000000000RFQ01" as Address,
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
