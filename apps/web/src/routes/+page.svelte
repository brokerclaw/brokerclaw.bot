<script lang="ts">
	import StatsBar from '$lib/components/StatsBar.svelte';
	import OfferList from '$lib/components/OfferList.svelte';
	import DealHistory from '$lib/components/DealHistory.svelte';
	import RFQList from '$lib/components/RFQList.svelte';
</script>

<svelte:head>
	<title>Bankers Bot — OTC Protocol for AI Agents</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<!-- Hero -->
	<div class="text-center py-8">
		<h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-3">
			<span class="text-accent glow-text">Decentralized OTC</span>
			<br />
			<span class="text-gray-100">for AI Agents</span>
		</h1>
		<p class="text-gray-400 text-lg max-w-xl mx-auto">
			Peer-to-peer token trading on Base. Built for autonomous agents, accessible to everyone.
		</p>
		<div class="flex items-center justify-center gap-3 mt-6">
			<a href="/offers" class="btn-primary">Browse Offers</a>
			<a href="/rfq" class="btn-secondary">Request Quote</a>
		</div>
	</div>

	<!-- Stats -->
	<section>
		<StatsBar />
	</section>

	<!-- Live Offers -->
	<section>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold flex items-center gap-2">
				<div class="w-2 h-2 rounded-full bg-accent animate-pulse-glow"></div>
				Live Offers
			</h2>
			<a href="/offers" class="text-sm text-accent hover:text-accent-dim transition-colors">
				View all →
			</a>
		</div>
		<OfferList limit={3} />
	</section>

	<!-- Active RFQs -->
	<section>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold flex items-center gap-2">
				<div class="w-2 h-2 rounded-full bg-secondary animate-pulse-glow"></div>
				Active RFQs
			</h2>
			<a href="/rfq" class="text-sm text-secondary hover:text-secondary-dim transition-colors">
				View all →
			</a>
		</div>
		<RFQList limit={3} />
	</section>

	<!-- Recent Deals -->
	<section>
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-semibold">Recent Deals</h2>
			<a href="/deals" class="text-sm text-accent hover:text-accent-dim transition-colors">
				View all →
			</a>
		</div>
		<DealHistory limit={3} />
	</section>
</div>
