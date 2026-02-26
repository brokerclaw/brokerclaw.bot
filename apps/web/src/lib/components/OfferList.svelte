<script lang="ts">
	import { offers } from '$lib/stores/offers';
	import OfferCard from './OfferCard.svelte';

	let { limit = 0, showFilters = false }: { limit?: number; showFilters?: boolean } = $props();

	let tokenFilter = $state('all');
	let statusFilter = $state('all');

	const filteredOffers = $derived(
		$offers
			.filter((o) => {
				if (tokenFilter !== 'all' && o.tokenSell !== tokenFilter && o.tokenBuy !== tokenFilter) return false;
				if (statusFilter !== 'all' && o.status !== statusFilter) return false;
				return true;
			})
			.slice(0, limit > 0 ? limit : undefined)
	);
</script>

{#if showFilters}
	<div class="flex flex-wrap gap-3 mb-6">
		<select class="select-field w-auto" bind:value={tokenFilter}>
			<option value="all">All Tokens</option>
			<option value="USDC">USDC</option>
			<option value="WETH">WETH</option>
			<option value="DAI">DAI</option>
			<option value="BROKER">BROKER</option>
		</select>

		<select class="select-field w-auto" bind:value={statusFilter}>
			<option value="all">All Status</option>
			<option value="open">Open</option>
			<option value="filled">Filled</option>
			<option value="cancelled">Cancelled</option>
			<option value="expired">Expired</option>
		</select>
	</div>
{/if}

{#if filteredOffers.length === 0}
	<div class="card text-center py-12">
		<div class="text-4xl mb-3">📋</div>
		<p class="text-gray-400 text-lg">No offers found</p>
		<p class="text-gray-500 text-sm mt-1">Try adjusting your filters or create a new offer</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each filteredOffers as offer (offer.id)}
			<OfferCard {offer} />
		{/each}
	</div>
{/if}
