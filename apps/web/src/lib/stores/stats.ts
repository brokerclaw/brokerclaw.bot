import { writable } from 'svelte/store';
import { publicClient } from '$lib/contracts/config';
import { ADDRESSES } from '$lib/contracts/addresses';
import { ESCROW_ABI, RFQ_ABI, REPUTATION_ABI, ERC20_ABI } from '$lib/contracts/abi';
import { formatEther } from 'viem';
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

let ethPriceUsd = 0;

async function fetchEthPrice(): Promise<number> {
	if (ethPriceUsd > 0) return ethPriceUsd;
	try {
		const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
		const data = await res.json();
		ethPriceUsd = data.ethereum.usd;
		return ethPriceUsd;
	} catch {
		return 2500; // fallback
	}
}

function formatVolumeUsd(weiVolume: bigint, price: number): string {
	const eth = Number(formatEther(weiVolume));
	const usd = eth * price;
	if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
	if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}K`;
	if (usd >= 1) return `$${usd.toFixed(2)}`;
	if (usd > 0) return `$${usd.toFixed(4)}`;
	return '$0';
}

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

		let openOffers = 0;
		let filledDeals = 0;
		const count = Number(offerCount);
		const makers = new Set<string>();
		const takers = new Set<string>();

		for (let i = 1; i <= count; i++) {
			const offer = await publicClient.readContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'getOffer',
				args: [BigInt(i)]
			});
			makers.add(offer.maker.toLowerCase());
			if (offer.status === 0) openOffers++;
			if (offer.status === 1) {
				filledDeals++;
				if (offer.taker) takers.add(offer.taker.toLowerCase());
			}
		}

		// All unique addresses that participated
		const allAddresses = new Set([...makers, ...takers]);

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
				if (req.status === 0) activeRFQs++;
			} catch { /* skip */ }
		}

		// Fetch ETH price + reputation stats
		const ethPrice = await fetchEthPrice();
		const agentList: Agent[] = [];
		let totalVolume = 0n;

		for (const addr of allAddresses) {
			try {
				const [agentStats, score] = await Promise.all([
					publicClient.readContract({
						address: ADDRESSES.REPUTATION,
						abi: REPUTATION_ABI,
						functionName: 'getAgentStats',
						args: [addr as `0x${string}`]
					}),
					publicClient.readContract({
						address: ADDRESSES.REPUTATION,
						abi: REPUTATION_ABI,
						functionName: 'getScore',
						args: [addr as `0x${string}`]
					})
				]);

				totalVolume += agentStats.totalVolume;

				const volEth = Number(formatEther(agentStats.totalVolume));
				agentList.push({
					address: addr,
					name: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
					deals: Number(agentStats.completedDeals),
					volume: volEth * ethPrice,
					reputation: Number(score),
					lastActive: Number(agentStats.lastDealTimestamp),
					isAgent: false
				});
			} catch {
				// No reputation data for this address
			}
		}

		// Sort by reputation score descending
		agentList.sort((a, b) => b.reputation - a.reputation);

		leaderboard.set(agentList);

		stats.set({
			totalVolume: formatVolumeUsd(totalVolume, ethPrice),
			totalDeals: filledDeals,
			activeAgents: allAddresses.size,
			openOffers,
			activeRFQs,
			volume24h: '0',
			deals24h: 0
		});
	} catch (err) {
		console.error('Failed to fetch stats:', err);
	}
}
