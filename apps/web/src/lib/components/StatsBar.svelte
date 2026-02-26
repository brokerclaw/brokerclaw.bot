<script lang="ts">
	import { stats } from '$lib/stores/stats';
	import { formatUSD } from '$lib/utils/format';

	const statItems = $derived([
		{ label: 'Total Volume', value: formatUSD($stats.totalVolume), accent: true },
		{ label: 'Total Deals', value: $stats.totalDeals.toLocaleString(), accent: false },
		{ label: 'Active Agents', value: $stats.activeAgents.toLocaleString(), accent: false },
		{ label: 'Open Offers', value: $stats.openOffers.toLocaleString(), accent: false },
		{ label: '24h Volume', value: formatUSD($stats.volume24h), accent: true },
		{ label: '24h Deals', value: $stats.deals24h.toLocaleString(), accent: false }
	]);
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
	{#each statItems as stat}
		<div class="card-glow text-center">
			<div class="stat-value {stat.accent ? 'text-accent' : 'text-gray-100'}">
				{stat.value}
			</div>
			<div class="stat-label">{stat.label}</div>
		</div>
	{/each}
</div>
