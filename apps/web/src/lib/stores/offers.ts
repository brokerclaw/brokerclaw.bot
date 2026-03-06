import { writable } from 'svelte/store';
import { publicClient } from '$lib/contracts/config';
import { ADDRESSES } from '$lib/contracts/addresses';
import { ESCROW_ABI, RFQ_ABI, ERC20_ABI } from '$lib/contracts/abi';
import type { Offer, RFQ, Deal } from '$lib/utils/constants';

export const offers = writable<Offer[]>([]);
export const rfqs = writable<RFQ[]>([]);
export const deals = writable<Deal[]>([]);
export const loading = writable(false);

// Cache token symbols
const symbolCache: Record<string, string> = {
	'0x4200000000000000000000000000000000000006': 'WETH',
	'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC',
	'0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA': 'USDbC',
	'0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb': 'DAI'
};

async function getSymbol(address: string): Promise<string> {
	if (symbolCache[address]) return symbolCache[address];
	try {
		const symbol = await publicClient.readContract({
			address: address as `0x${string}`,
			abi: ERC20_ABI,
			functionName: 'symbol'
		});
		symbolCache[address] = symbol;
		return symbol;
	} catch {
		return address.slice(0, 6) + '...' + address.slice(-4);
	}
}

async function getDecimals(address: string): Promise<number> {
	try {
		const d = await publicClient.readContract({
			address: address as `0x${string}`,
			abi: ERC20_ABI,
			functionName: 'decimals'
		});
		return Number(d);
	} catch {
		return 18;
	}
}

function formatAmount(raw: bigint, decimals: number): string {
	const num = Number(raw) / 10 ** decimals;
	if (num >= 1000) return num.toFixed(0);
	if (num >= 1) return num.toFixed(2);
	return num.toFixed(6);
}

const STATUS_MAP = ['open', 'filled', 'cancelled', 'countered'] as const;

export async function fetchOffers() {
	loading.set(true);
	try {
		const count = await publicClient.readContract({
			address: ADDRESSES.ESCROW,
			abi: ESCROW_ABI,
			functionName: 'offerCount'
		});

		const allOffers: Offer[] = [];
		const allDeals: Deal[] = [];
		const now = Math.floor(Date.now() / 1000);

		for (let i = 1; i <= Number(count); i++) {
			const offer = await publicClient.readContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'getOffer',
				args: [BigInt(i)]
			});

			const [symbolA, symbolB, decimalsA, decimalsB] = await Promise.all([
				getSymbol(offer.tokenA),
				getSymbol(offer.tokenB),
				getDecimals(offer.tokenA),
				getDecimals(offer.tokenB)
			]);

			const parsed: Offer = {
				id: String(i),
				maker: offer.maker,
				tokenSell: symbolA,
				tokenBuy: symbolB,
				amountSell: formatAmount(offer.amountA, decimalsA),
				amountBuy: formatAmount(offer.amountB, decimalsB),
				status: STATUS_MAP[offer.status] || 'open',
				createdAt: now,
				expiresAt: Number(offer.expiry)
			};

			if (offer.status === 1) {
				// Filled — add to deals
				parsed.filledBy = offer.taker;
				allDeals.push({
					id: String(i),
					offerId: String(i),
					maker: offer.maker,
					taker: offer.taker,
					tokenSell: symbolA,
					tokenBuy: symbolB,
					amountSell: formatAmount(offer.amountA, decimalsA),
					amountBuy: formatAmount(offer.amountB, decimalsB),
					completedAt: now,
					txHash: ''
				});
			}

			allOffers.push(parsed);
		}

		offers.set(allOffers);
		deals.set(allDeals);
	} catch (err) {
		console.error('Failed to fetch offers:', err);
	} finally {
		loading.set(false);
	}
}

export async function fetchRFQs() {
	try {
		const count = await publicClient.readContract({
			address: ADDRESSES.RFQ,
			abi: RFQ_ABI,
			functionName: 'requestCount'
		});

		const allRFQs: RFQ[] = [];
		const now = Math.floor(Date.now() / 1000);

		for (let i = 1; i <= Number(count); i++) {
			const req = await publicClient.readContract({
				address: ADDRESSES.RFQ,
				abi: RFQ_ABI,
				functionName: 'getRequest',
				args: [BigInt(i)]
			});

			const [symbolA, symbolB] = await Promise.all([
				getSymbol(req.tokenA),
				getSymbol(req.tokenB)
			]);

			const statusMap = ['active', 'filled', 'cancelled'] as const;

			allRFQs.push({
				id: String(i),
				requester: req.requester,
				tokenWant: symbolA,
				tokenOffer: symbolB,
				amountWant: formatAmount(req.amountA, 18),
				status: statusMap[req.status] || 'active',
				createdAt: now,
				expiresAt: Number(req.expiry),
				quotes: []
			});
		}

		rfqs.set(allRFQs);
	} catch (err) {
		console.error('Failed to fetch RFQs:', err);
	}
}
