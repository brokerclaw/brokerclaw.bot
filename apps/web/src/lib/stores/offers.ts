import { writable } from 'svelte/store';
import type { Offer, RFQ, Deal } from '$lib/utils/constants';

// Mock data for development — will be replaced with contract reads
const now = Math.floor(Date.now() / 1000);

const MOCK_OFFERS: Offer[] = [
	{
		id: '1',
		maker: '0x1234567890abcdef1234567890abcdef12345678',
		tokenSell: 'USDC',
		tokenBuy: 'WETH',
		amountSell: '10000',
		amountBuy: '3.2',
		status: 'open',
		createdAt: now - 3600,
		expiresAt: now + 82800
	},
	{
		id: '2',
		maker: '0xabcdef1234567890abcdef1234567890abcdef12',
		tokenSell: 'WETH',
		tokenBuy: 'USDC',
		amountSell: '5.0',
		amountBuy: '15750',
		status: 'open',
		createdAt: now - 7200,
		expiresAt: now + 79200
	},
	{
		id: '3',
		maker: '0x9876543210fedcba9876543210fedcba98765432',
		tokenSell: 'DAI',
		tokenBuy: 'USDC',
		amountSell: '50000',
		amountBuy: '49950',
		status: 'filled',
		createdAt: now - 86400,
		expiresAt: now + 0,
		filledBy: '0xfedcba9876543210fedcba9876543210fedcba98',
		filledAt: now - 43200,
		txHash: '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456'
	},
	{
		id: '4',
		maker: '0x5555666677778888999900001111222233334444',
		tokenSell: 'USDC',
		tokenBuy: 'BROKER',
		amountSell: '25000',
		amountBuy: '500000',
		status: 'open',
		createdAt: now - 1800,
		expiresAt: now + 84600
	},
	{
		id: '5',
		maker: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
		tokenSell: 'WETH',
		tokenBuy: 'DAI',
		amountSell: '10.0',
		amountBuy: '31200',
		status: 'cancelled',
		createdAt: now - 172800,
		expiresAt: now - 86400
	},
	{
		id: '6',
		maker: '0x1111aaaa2222bbbb3333cccc4444dddd5555eeee',
		tokenSell: 'BROKER',
		tokenBuy: 'WETH',
		amountSell: '1000000',
		amountBuy: '15.5',
		status: 'open',
		createdAt: now - 900,
		expiresAt: now + 85500
	}
];

const MOCK_RFQS: RFQ[] = [
	{
		id: '1',
		requester: '0xfedcba9876543210fedcba9876543210fedcba98',
		tokenWant: 'WETH',
		tokenOffer: 'USDC',
		amountWant: '50.0',
		status: 'active',
		createdAt: now - 1200,
		expiresAt: now + 85200,
		quotes: [
			{
				id: 'q1',
				rfqId: '1',
				quoter: '0x1234567890abcdef1234567890abcdef12345678',
				amountOffer: '156250',
				createdAt: now - 600,
				accepted: false
			},
			{
				id: 'q2',
				rfqId: '1',
				quoter: '0xabcdef1234567890abcdef1234567890abcdef12',
				amountOffer: '155800',
				createdAt: now - 300,
				accepted: false
			}
		]
	},
	{
		id: '2',
		requester: '0x5555666677778888999900001111222233334444',
		tokenWant: 'USDC',
		tokenOffer: 'DAI',
		amountWant: '100000',
		status: 'active',
		createdAt: now - 3600,
		expiresAt: now + 82800,
		quotes: []
	},
	{
		id: '3',
		requester: '0x9876543210fedcba9876543210fedcba98765432',
		tokenWant: 'BROKER',
		tokenOffer: 'USDC',
		amountWant: '2000000',
		status: 'quoted',
		createdAt: now - 7200,
		expiresAt: now + 79200,
		quotes: [
			{
				id: 'q3',
				rfqId: '3',
				quoter: '0x1111aaaa2222bbbb3333cccc4444dddd5555eeee',
				amountOffer: '100000',
				createdAt: now - 5400,
				accepted: false
			}
		]
	}
];

const MOCK_DEALS: Deal[] = [
	{
		id: '1',
		offerId: '3',
		maker: '0x9876543210fedcba9876543210fedcba98765432',
		taker: '0xfedcba9876543210fedcba9876543210fedcba98',
		tokenSell: 'DAI',
		tokenBuy: 'USDC',
		amountSell: '50000',
		amountBuy: '49950',
		completedAt: now - 43200,
		txHash: '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456'
	},
	{
		id: '2',
		offerId: '7',
		maker: '0x1234567890abcdef1234567890abcdef12345678',
		taker: '0x5555666677778888999900001111222233334444',
		tokenSell: 'WETH',
		tokenBuy: 'USDC',
		amountSell: '20.0',
		amountBuy: '62400',
		completedAt: now - 86400,
		txHash: '0xdef456789012345678901234567890abcdef1234567890abcdef123456789abc'
	},
	{
		id: '3',
		offerId: '12',
		maker: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
		taker: '0x9876543210fedcba9876543210fedcba98765432',
		tokenSell: 'USDC',
		tokenBuy: 'WETH',
		amountSell: '5000',
		amountBuy: '1.6',
		completedAt: now - 129600,
		txHash: '0x789012345678901234567890abcdef1234567890abcdef123456789abcdef012'
	},
	{
		id: '4',
		offerId: '15',
		maker: '0xfedcba9876543210fedcba9876543210fedcba98',
		taker: '0x1111aaaa2222bbbb3333cccc4444dddd5555eeee',
		tokenSell: 'BROKER',
		tokenBuy: 'USDC',
		amountSell: '250000',
		amountBuy: '12500',
		completedAt: now - 172800,
		txHash: '0x345678901234567890abcdef1234567890abcdef123456789abcdef0123456ab'
	},
	{
		id: '5',
		offerId: '18',
		maker: '0x5555666677778888999900001111222233334444',
		taker: '0xabcdef1234567890abcdef1234567890abcdef12',
		tokenSell: 'WETH',
		tokenBuy: 'DAI',
		amountSell: '8.5',
		amountBuy: '26520',
		completedAt: now - 259200,
		txHash: '0x567890abcdef1234567890abcdef123456789abcdef0123456789abcdef01234'
	}
];

export const offers = writable<Offer[]>(MOCK_OFFERS);
export const rfqs = writable<RFQ[]>(MOCK_RFQS);
export const deals = writable<Deal[]>(MOCK_DEALS);
export const loading = writable(false);
