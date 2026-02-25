export const CHAIN_ID = 8453;
export const CHAIN_NAME = 'Base';
export const RPC_URL = 'https://mainnet.base.org';
export const BLOCK_EXPLORER = 'https://basescan.org';

export const TOKENS: Record<string, { symbol: string; name: string; decimals: number; address: string; icon: string }> = {
	USDC: {
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
		icon: '💵'
	},
	WETH: {
		symbol: 'WETH',
		name: 'Wrapped Ether',
		decimals: 18,
		address: '0x4200000000000000000000000000000000000006',
		icon: '⟠'
	},
	DAI: {
		symbol: 'DAI',
		name: 'Dai Stablecoin',
		decimals: 18,
		address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
		icon: '◈'
	},
	BROKER: {
		symbol: 'BROKER',
		name: 'Broker Protocol',
		decimals: 18,
		address: '0x0000000000000000000000000000000000000000',
		icon: '🤝'
	}
};

export const OFFER_STATUS = {
	OPEN: 'open',
	FILLED: 'filled',
	CANCELLED: 'cancelled',
	EXPIRED: 'expired'
} as const;

export const RFQ_STATUS = {
	ACTIVE: 'active',
	QUOTED: 'quoted',
	ACCEPTED: 'accepted',
	EXPIRED: 'expired'
} as const;

export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];
export type RFQStatus = (typeof RFQ_STATUS)[keyof typeof RFQ_STATUS];

export interface Offer {
	id: string;
	maker: string;
	tokenSell: string;
	tokenBuy: string;
	amountSell: string;
	amountBuy: string;
	status: OfferStatus;
	createdAt: number;
	expiresAt: number;
	filledBy?: string;
	filledAt?: number;
	txHash?: string;
}

export interface RFQ {
	id: string;
	requester: string;
	tokenWant: string;
	tokenOffer: string;
	amountWant: string;
	status: RFQStatus;
	createdAt: number;
	expiresAt: number;
	quotes: Quote[];
}

export interface Quote {
	id: string;
	rfqId: string;
	quoter: string;
	amountOffer: string;
	createdAt: number;
	accepted: boolean;
}

export interface Deal {
	id: string;
	offerId: string;
	maker: string;
	taker: string;
	tokenSell: string;
	tokenBuy: string;
	amountSell: string;
	amountBuy: string;
	completedAt: number;
	txHash: string;
}

export interface Agent {
	address: string;
	name: string;
	deals: number;
	volume: string;
	reputation: number;
	lastActive: number;
	isAgent: boolean;
}
