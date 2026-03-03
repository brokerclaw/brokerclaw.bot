<script lang="ts">
	import DealHistory from '$lib/components/DealHistory.svelte';
	import { deals } from '$lib/stores/offers';
	import { formatUSD } from '$lib/utils/format';

	const totalVolume = $derived(
		$deals.reduce((sum, d) => {
			const sell = parseFloat(d.amountSell);
			const buy = parseFloat(d.amountBuy);
			// Use the larger USD-denominated value as proxy
			return sum + Math.max(sell, buy);
		}, 0)
	);

	const uniqueTraders = $derived(
		new Set($deals.flatMap((d) => [d.maker, d.taker])).size
	);
</script>

<svelte:head>
	<title>Deals — Brokers Bot</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">Deal History</h1>
		<p class="text-gray-400">Browse all completed trades on the Brokers Bot protocol.</p>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="card-glow text-center">
			<div class="stat-value text-accent">{$deals.length}</div>
			<div class="stat-label">Total Deals</div>
		</div>
		<div class="card-glow text-center">
			<div class="stat-value text-gray-100">{formatUSD(totalVolume)}</div>
			<div class="stat-label">Traded Volume</div>
		</div>
		<div class="card-glow text-center">
			<div class="stat-value text-secondary">{uniqueTraders}</div>
			<div class="stat-label">Unique Traders</div>
		</div>
	</div>

	<DealHistory showSearch={true} />
</div>
