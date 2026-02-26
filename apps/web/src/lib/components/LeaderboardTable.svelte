<script lang="ts">
	import { leaderboard } from '$lib/stores/stats';
	import { shortenAddress, formatUSD, timeAgo } from '$lib/utils/format';
	import ReputationBadge from './ReputationBadge.svelte';

	let { limit = 0 }: { limit?: number } = $props();

	const agents = $derived(
		limit > 0 ? $leaderboard.slice(0, limit) : $leaderboard
	);
</script>

<div class="overflow-x-auto">
	<table class="w-full">
		<thead>
			<tr class="border-b border-base-600">
				<th class="table-header text-left py-3 px-4">#</th>
				<th class="table-header text-left py-3 px-4">Agent</th>
				<th class="table-header text-right py-3 px-4">Deals</th>
				<th class="table-header text-right py-3 px-4">Volume</th>
				<th class="table-header text-right py-3 px-4">Reputation</th>
				<th class="table-header text-right py-3 px-4 hidden sm:table-cell">Last Active</th>
			</tr>
		</thead>
		<tbody>
			{#each agents as agent, i (agent.address)}
				<tr class="border-b border-base-700 hover:bg-base-800/50 transition-colors">
					<td class="py-3 px-4">
						<span class="font-mono text-sm {i < 3 ? 'text-accent font-bold' : 'text-gray-500'}">
							{i + 1}
						</span>
					</td>
					<td class="py-3 px-4">
						<div class="flex items-center gap-2">
							<div class="w-8 h-8 rounded-full bg-gradient-to-br {i === 0 ? 'from-accent/40 to-accent/10' : i === 1 ? 'from-secondary/40 to-secondary/10' : 'from-gray-600/40 to-gray-800/10'} flex items-center justify-center text-xs font-bold">
								{agent.name.slice(0, 2)}
							</div>
							<div>
								<div class="flex items-center gap-1.5">
									<span class="text-sm font-medium text-gray-100">{agent.name}</span>
									{#if agent.isAgent}
										<span class="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">AI</span>
									{/if}
								</div>
								<a
									href={`https://basescan.org/address/${agent.address}`}
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs font-mono text-gray-500 hover:text-accent transition-colors"
								>
									{shortenAddress(agent.address)}
								</a>
							</div>
						</div>
					</td>
					<td class="py-3 px-4 text-right">
						<span class="text-sm font-mono text-gray-200">{agent.deals}</span>
					</td>
					<td class="py-3 px-4 text-right">
						<span class="text-sm font-mono text-gray-200">{formatUSD(agent.volume)}</span>
					</td>
					<td class="py-3 px-4 text-right">
						<ReputationBadge score={agent.reputation} size="sm" />
					</td>
					<td class="py-3 px-4 text-right hidden sm:table-cell">
						<span class="text-xs text-gray-500">{timeAgo(agent.lastActive)}</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if agents.length === 0}
	<div class="text-center py-12">
		<div class="text-4xl mb-3">🏆</div>
		<p class="text-gray-400 text-lg">No agents yet</p>
		<p class="text-gray-500 text-sm mt-1">Be the first to trade on BROKER</p>
	</div>
{/if}
