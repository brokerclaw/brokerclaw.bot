<script lang="ts">
	import { deals } from '$lib/stores/offers';
	import { TOKENS } from '$lib/utils/constants';
	import { shortenAddress, formatAmount, timeAgo, explorerLink } from '$lib/utils/format';

	let { limit = 0, showSearch = false }: { limit?: number; showSearch?: boolean } = $props();

	let search = $state('');

	const filteredDeals = $derived(
		$deals
			.filter((d) => {
				if (!search) return true;
				const s = search.toLowerCase();
				return (
					d.maker.toLowerCase().includes(s) ||
					d.taker.toLowerCase().includes(s) ||
					d.tokenSell.toLowerCase().includes(s) ||
					d.tokenBuy.toLowerCase().includes(s) ||
					d.txHash.toLowerCase().includes(s)
				);
			})
			.slice(0, limit > 0 ? limit : undefined)
	);
</script>

{#if showSearch}
	<div class="mb-6">
		<input
			type="text"
			class="input-field"
			placeholder="Search by address, token, or tx hash..."
			bind:value={search}
		/>
	</div>
{/if}

{#if filteredDeals.length === 0}
	<div class="card text-center py-12">
		<div class="text-4xl mb-3">📊</div>
		<p class="text-gray-400 text-lg">No deals found</p>
		<p class="text-gray-500 text-sm mt-1">{search ? 'Try a different search term' : 'Deals will appear here once completed'}</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each filteredDeals as deal (deal.id)}
			<div class="card hover:border-base-500 transition-all">
				<div class="flex flex-col sm:flex-row sm:items-center gap-3">
					<div class="flex items-center gap-3 flex-1">
						<div class="flex items-center gap-2">
							<span class="text-lg">{TOKENS[deal.tokenSell]?.icon || '🪙'}</span>
							<div>
								<div class="text-sm font-semibold text-gray-100">
									{formatAmount(deal.amountSell)} {deal.tokenSell}
								</div>
								<div class="text-xs text-gray-500 font-mono">{shortenAddress(deal.maker)}</div>
							</div>
						</div>

						<span class="text-accent text-sm">→</span>

						<div class="flex items-center gap-2">
							<span class="text-lg">{TOKENS[deal.tokenBuy]?.icon || '🪙'}</span>
							<div>
								<div class="text-sm font-semibold text-gray-100">
									{formatAmount(deal.amountBuy)} {deal.tokenBuy}
								</div>
								<div class="text-xs text-gray-500 font-mono">{shortenAddress(deal.taker)}</div>
							</div>
						</div>
					</div>

					<div class="flex items-center gap-4 text-xs sm:text-right">
						<span class="text-gray-500">{timeAgo(deal.completedAt)}</span>
						<a
							href={explorerLink(deal.txHash)}
							target="_blank"
							rel="noopener noreferrer"
							class="text-secondary hover:text-secondary-dim transition-colors font-mono"
						>
							{shortenAddress(deal.txHash)}
						</a>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
