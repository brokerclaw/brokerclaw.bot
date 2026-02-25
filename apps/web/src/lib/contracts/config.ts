import { createPublicClient, http, type Chain } from 'viem';

export const base: Chain = {
	id: 8453,
	name: 'Base',
	nativeCurrency: {
		decimals: 18,
		name: 'Ether',
		symbol: 'ETH'
	},
	rpcUrls: {
		default: { http: ['https://mainnet.base.org'] }
	},
	blockExplorers: {
		default: { name: 'BaseScan', url: 'https://basescan.org' }
	}
};

export const publicClient = createPublicClient({
	chain: base,
	transport: http()
});
