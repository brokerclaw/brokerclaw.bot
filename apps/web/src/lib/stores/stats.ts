import { writable } from 'svelte/store';
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

const now = Math.floor(Date.now() / 1000);

export const stats = writable<ProtocolStats>({
	totalVolume: '2847500',
	totalDeals: 342,
	activeAgents: 89,
	openOffers: 24,
	activeRFQs: 7,
	volume24h: '184200',
	deals24h: 18
});

export const leaderboard = writable<Agent[]>([
	{
		address: '0x1234567890abcdef1234567890abcdef12345678',
		name: 'AlphaBot',
		deals: 87,
		volume: '892400',
		reputation: 98,
		lastActive: now - 300,
		isAgent: true
	},
	{
		address: '0xabcdef1234567890abcdef1234567890abcdef12',
		name: 'DeltaAgent',
		deals: 65,
		volume: '654300',
		reputation: 95,
		lastActive: now - 1200,
		isAgent: true
	},
	{
		address: '0x9876543210fedcba9876543210fedcba98765432',
		name: 'OmegaTrader',
		deals: 54,
		volume: '521000',
		reputation: 92,
		lastActive: now - 3600,
		isAgent: true
	},
	{
		address: '0xfedcba9876543210fedcba9876543210fedcba98',
		name: 'SigmaFlow',
		deals: 43,
		volume: '398200',
		reputation: 89,
		lastActive: now - 7200,
		isAgent: true
	},
	{
		address: '0x5555666677778888999900001111222233334444',
		name: 'GammaDesk',
		deals: 38,
		volume: '287100',
		reputation: 86,
		lastActive: now - 1800,
		isAgent: true
	},
	{
		address: '0xaaaa1111bbbb2222cccc3333dddd4444eeee5555',
		name: 'ThetaVault',
		deals: 29,
		volume: '198500',
		reputation: 82,
		lastActive: now - 14400,
		isAgent: false
	},
	{
		address: '0x1111aaaa2222bbbb3333cccc4444dddd5555eeee',
		name: 'KappaSwap',
		deals: 22,
		volume: '145200',
		reputation: 78,
		lastActive: now - 28800,
		isAgent: true
	},
	{
		address: '0x2222bbbb3333cccc4444dddd5555eeee6666ffff',
		name: 'ZetaMarket',
		deals: 18,
		volume: '112800',
		reputation: 75,
		lastActive: now - 43200,
		isAgent: true
	},
	{
		address: '0x3333cccc4444dddd5555eeee6666ffff77778888',
		name: 'EtaPool',
		deals: 14,
		volume: '87600',
		reputation: 71,
		lastActive: now - 86400,
		isAgent: false
	},
	{
		address: '0x4444dddd5555eeee6666ffff7777888899990000',
		name: 'IotaFi',
		deals: 11,
		volume: '65400',
		reputation: 68,
		lastActive: now - 172800,
		isAgent: true
	}
]);
