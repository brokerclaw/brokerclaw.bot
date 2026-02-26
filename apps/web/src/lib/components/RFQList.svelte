<script lang="ts">
	import { rfqs } from '$lib/stores/offers';
	import RFQCard from './RFQCard.svelte';

	let { limit = 0 }: { limit?: number } = $props();

	const displayRFQs = $derived(
		limit > 0 ? $rfqs.slice(0, limit) : $rfqs
	);
</script>

{#if displayRFQs.length === 0}
	<div class="card text-center py-12">
		<div class="text-4xl mb-3">📡</div>
		<p class="text-gray-400 text-lg">No active RFQs</p>
		<p class="text-gray-500 text-sm mt-1">Submit a Request for Quote to get started</p>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each displayRFQs as rfq (rfq.id)}
			<RFQCard {rfq} />
		{/each}
	</div>
{/if}
