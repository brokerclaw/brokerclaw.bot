<script lang="ts">
	import type { Offer } from '$lib/utils/constants';
	import { TOKENS } from '$lib/utils/constants';
	import { shortenAddress, formatAmount, timeAgo } from '$lib/utils/format';
	import ReputationBadge from './ReputationBadge.svelte';

	let { offer }: { offer: Offer } = $props();

	const statusColors: Record<string, string> = {
		open: 'badge-green',
		filled: 'badge-blue',
		cancelled: 'badge-red',
		expired: 'badge-gray'
	};

	const sellToken = $derived(TOKENS[offer.tokenSell]);
	const buyToken = $derived(TOKENS[offer.tokenBuy]);
</script>

<div class="card-glow group">
	<div class="flex items-start justify-between mb-3">
		<div class="flex items-center gap-2">
			<span class="text-xs font-mono text-gray-500">#{offer.id}</span>
			<span class={statusColors[offer.status] || 'badge-gray'}>
				{offer.status}
			</span>
		</div>
		<span class="text-xs text-gray-500">{timeAgo(offer.createdAt)}</span>
	</div>

	<div class="flex items-center gap-3 mb-4">
		<div class="flex-1 text-center p-3 bg-base-900 rounded-lg">
			<div class="text-lg mb-0.5">{sellToken?.icon || '🪙'}</div>
			<div class="text-sm font-semibold text-gray-100">{formatAmount(offer.amountSell)}</div>
			<div class="text-xs text-gray-500">{offer.tokenSell}</div>
		</div>

		<div class="text-accent text-lg">→</div>

		<div class="flex-1 text-center p-3 bg-base-900 rounded-lg">
			<div class="text-lg mb-0.5">{buyToken?.icon || '🪙'}</div>
			<div class="text-sm font-semibold text-gray-100">{formatAmount(offer.amountBuy)}</div>
			<div class="text-xs text-gray-500">{offer.tokenBuy}</div>
		</div>
	</div>

	<div class="flex items-center justify-between text-xs">
		<div class="flex items-center gap-1.5 text-gray-400">
			<span>Maker:</span>
			<a
				href={`https://basescan.org/address/${offer.maker}`}
				target="_blank"
				rel="noopener noreferrer"
				class="font-mono hover:text-accent transition-colors"
			>
				{shortenAddress(offer.maker)}
			</a>
		</div>

		{#if offer.status === 'open'}
			<button class="btn-primary text-xs px-3 py-1.5">
				Fill Offer
			</button>
		{:else if offer.filledBy}
			<div class="flex items-center gap-1.5 text-gray-400">
				<span>Taker:</span>
				<span class="font-mono">{shortenAddress(offer.filledBy)}</span>
			</div>
		{/if}
	</div>
</div>
