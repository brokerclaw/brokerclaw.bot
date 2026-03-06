<script lang="ts">
	import { onMount } from 'svelte';
	import { stats, fetchStats } from '$lib/stores/stats';

	onMount(() => {
		fetchStats();
	});

	const statItems = $derived([
		{ label: 'Total Deals', value: $stats.totalDeals.toLocaleString() },
		{ label: 'Open Offers', value: $stats.openOffers.toLocaleString() },
		{ label: 'Active RFQs', value: $stats.activeRFQs.toLocaleString() },
		{ label: 'Protocol Fee', value: '0.3%' }
	]);
</script>

<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
	{#each statItems as stat}
		<div class="card-glow text-center">
			<div class="stat-value text-gray-100">
				{stat.value}
			</div>
			<div class="stat-label">{stat.label}</div>
		</div>
	{/each}
</div>
