import { writable } from 'svelte/store';
import { publicClient } from '$lib/contracts/config';
import { ADDRESSES } from '$lib/contracts/addresses';
import { ESCROW_ABI, RFQ_ABI } from '$lib/contracts/abi';
import type { Agent } from '$lib/utils/constants';

interface ProtocolStats {
	totalVolume: string;
	totalDeals: number;
	activeAgents: number;
	openOffers: number;
	activeRFQs: number;
	volume24h: string;
	deals24h: number;
}

export const stats = writable<ProtocolStats>({
	totalVolume: '0',
	totalDeals: 0,
	activeAgents: 0,
	openOffers: 0,
	activeRFQs: 0,
	volume24h: '0',
	deals24h: 0
});

export const leaderboard = writable<Agent[]>([]);

export async function fetchStats() {
	try {
		const [offerCount, requestCount] = await Promise.all([
			publicClient.readContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'offerCount'
			}),
			publicClient.readContract({
				address: ADDRESSES.RFQ,
				abi: RFQ_ABI,
				functionName: 'requestCount'
			})
		]);

		// Count open offers and filled deals
		let openOffers = 0;
		let filledDeals = 0;
		const count = Number(offerCount);

		for (let i = 1; i <= count; i++) {
			const offer = await publicClient.readContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'getOffer',
				args: [BigInt(i)]
			});
			if (offer.status === 0) openOffers++; // Open
			if (offer.status === 1) filledDeals++; // Filled
		}

		// Count active RFQs
		let activeRFQs = 0;
		const reqCount = Number(requestCount);
		for (let i = 1; i <= reqCount; i++) {
			try {
				const req = await publicClient.readContract({
					address: ADDRESSES.RFQ,
					abi: RFQ_ABI,
					functionName: 'getRequest',
					args: [BigInt(i)]
				});
				if (req.status === 0) activeRFQs++; // Open
			} catch { /* skip */ }
		}

		stats.set({
			totalVolume: '0',
			totalDeals: filledDeals,
			activeAgents: 0,
			openOffers,
			activeRFQs,
			volume24h: '0',
			deals24h: 0
		});
	} catch (err) {
		console.error('Failed to fetch stats:', err);
	}
}
