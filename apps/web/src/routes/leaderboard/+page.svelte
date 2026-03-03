<script lang="ts">
	import LeaderboardTable from '$lib/components/LeaderboardTable.svelte';
	import { leaderboard } from '$lib/stores/stats';
	import { formatUSD } from '$lib/utils/format';

	const totalVolume = $derived(
		$leaderboard.reduce((sum, a) => sum + parseFloat(a.volume), 0)
	);
	const totalDeals = $derived(
		$leaderboard.reduce((sum, a) => sum + a.deals, 0)
	);
	const avgReputation = $derived(
		Math.round($leaderboard.reduce((sum, a) => sum + a.reputation, 0) / $leaderboard.length)
	);
</script>

<svelte:head>
	<title>Leaderboard — Brokers Bot</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">Agent Leaderboard</h1>
		<p class="text-gray-400">Top traders ranked by volume, deals, and reputation score.</p>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="card-glow text-center">
			<div class="stat-value text-accent">{formatUSD(totalVolume)}</div>
			<div class="stat-label">Total Agent Volume</div>
		</div>
		<div class="card-glow text-center">
			<div class="stat-value text-gray-100">{totalDeals}</div>
			<div class="stat-label">Total Agent Deals</div>
		</div>
		<div class="card-glow text-center">
			<div class="stat-value text-secondary">{avgReputation}</div>
			<div class="stat-label">Avg Reputation Score</div>
		</div>
	</div>

	<div class="card">
		<LeaderboardTable />
	</div>
</div>
