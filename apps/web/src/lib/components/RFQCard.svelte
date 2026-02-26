<script lang="ts">
	import type { RFQ } from '$lib/utils/constants';
	import { TOKENS } from '$lib/utils/constants';
	import { shortenAddress, formatAmount, timeAgo } from '$lib/utils/format';

	let { rfq }: { rfq: RFQ } = $props();

	const statusColors: Record<string, string> = {
		active: 'badge-green',
		quoted: 'badge-blue',
		accepted: 'badge-yellow',
		expired: 'badge-gray'
	};

	const wantToken = $derived(TOKENS[rfq.tokenWant]);
	const offerToken = $derived(TOKENS[rfq.tokenOffer]);
	const bestQuote = $derived(
		rfq.quotes.length > 0
			? rfq.quotes.reduce((min, q) => (parseFloat(q.amountOffer) < parseFloat(min.amountOffer) ? q : min), rfq.quotes[0])
			: null
	);
</script>

<div class="card-glow">
	<div class="flex items-start justify-between mb-3">
		<div class="flex items-center gap-2">
			<span class="text-xs font-mono text-gray-500">RFQ #{rfq.id}</span>
			<span class={statusColors[rfq.status] || 'badge-gray'}>
				{rfq.status}
			</span>
		</div>
		<span class="text-xs text-gray-500">{timeAgo(rfq.createdAt)}</span>
	</div>

	<div class="mb-4">
		<div class="flex items-center gap-2 mb-2">
			<span class="text-sm text-gray-400">Wants</span>
			<span class="text-lg">{wantToken?.icon || '🪙'}</span>
			<span class="text-lg font-semibold text-gray-100">{formatAmount(rfq.amountWant)}</span>
			<span class="text-sm text-gray-400">{rfq.tokenWant}</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm text-gray-400">Paying with</span>
			<span class="text-lg">{offerToken?.icon || '🪙'}</span>
			<span class="text-sm text-gray-400">{rfq.tokenOffer}</span>
		</div>
	</div>

	<div class="flex items-center justify-between text-xs mb-3">
		<div class="flex items-center gap-1.5 text-gray-400">
			<span>From:</span>
			<a
				href={`https://basescan.org/address/${rfq.requester}`}
				target="_blank"
				rel="noopener noreferrer"
				class="font-mono hover:text-accent transition-colors"
			>
				{shortenAddress(rfq.requester)}
			</a>
		</div>
		<span class="text-gray-500">{rfq.quotes.length} quote{rfq.quotes.length !== 1 ? 's' : ''}</span>
	</div>

	{#if bestQuote}
		<div class="bg-base-900 rounded-lg p-3 mb-3">
			<div class="text-xs text-gray-500 mb-1">Best Quote</div>
			<div class="flex items-center justify-between">
				<span class="text-sm font-semibold text-accent">{formatAmount(bestQuote.amountOffer)} {rfq.tokenOffer}</span>
				<span class="text-xs text-gray-500 font-mono">{shortenAddress(bestQuote.quoter)}</span>
			</div>
		</div>
	{/if}

	{#if rfq.status === 'active'}
		<button class="btn-outline w-full text-sm">
			Submit Quote
		</button>
	{/if}
</div>
