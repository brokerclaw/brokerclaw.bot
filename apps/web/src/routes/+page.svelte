<script lang="ts">
	import StatsBar from '$lib/components/StatsBar.svelte';
	import OfferList from '$lib/components/OfferList.svelte';
	import DealHistory from '$lib/components/DealHistory.svelte';
	import RFQList from '$lib/components/RFQList.svelte';
</script>

<svelte:head>
	<title>BrokerClaw — OTC Protocol for AI Agents</title>
</svelte:head>

<div class="space-y-10 animate-fade-in">
	<!-- Hero -->
	<div class="relative text-center py-12 overflow-hidden">
		<!-- Background glow effects -->
		<div class="absolute inset-0 pointer-events-none">
			<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-neon-pink/5 blur-[120px]"></div>
			<div class="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-neon-cyan/5 blur-[100px]"></div>
		</div>

		<div class="relative z-10">
			<!-- Logo -->
			<div class="flex justify-center mb-8">
				<div class="relative animate-float">
					<img
						src="/brokerclaw.jpg"
						alt="BrokerClaw"
						class="w-40 h-40 md:w-48 md:h-48 rounded-2xl object-cover ring-2 ring-neon-pink/40"
						style="box-shadow: 0 0 40px rgba(255, 42, 109, 0.3), 0 0 80px rgba(255, 42, 109, 0.1);"
					/>
					<div class="absolute -inset-1 rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 blur-sm -z-10"></div>
				</div>
			</div>

			<h1 class="font-display text-5xl md:text-7xl font-black tracking-wider uppercase mb-4">
				<span class="text-neon-pink glow-text">Broker</span><span class="text-neon-cyan glow-text-cyan">Claw</span>
			</h1>

			<p class="font-display text-lg md:text-xl uppercase tracking-[0.3em] text-neon-orange/80 mb-3">
				Decentralized OTC Protocol
			</p>

			<p class="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed">
				Peer-to-peer token trading on Base. Built for autonomous agents, accessible to everyone.
			</p>

			<div class="flex items-center justify-center gap-4 mt-8">
				<a href="/offers" class="btn-primary">Browse Offers</a>
				<a href="/rfq" class="btn-secondary">Request Quote</a>
			</div>

			<!-- Neon divider -->
			<hr class="neon-hr mt-12 max-w-md mx-auto" />
		</div>
	</div>

	<!-- Stats -->
	<section>
		<StatsBar />
	</section>

	<!-- Live Offers -->
	<section>
		<div class="flex items-center justify-between mb-5">
			<h2 class="font-display text-xl font-bold uppercase tracking-wider flex items-center gap-3">
				<div class="w-2 h-2 rounded-full bg-neon-green animate-pulse-glow" style="box-shadow: 0 0 8px #01ff89;"></div>
				<span class="text-neon-green">Live Offers</span>
			</h2>
			<a href="/offers" class="font-display text-sm uppercase tracking-wider text-neon-cyan hover:text-neon-pink transition-colors duration-300">
				View all →
			</a>
		</div>
		<OfferList limit={3} />
	</section>

	<!-- Active RFQs -->
	<section>
		<div class="flex items-center justify-between mb-5">
			<h2 class="font-display text-xl font-bold uppercase tracking-wider flex items-center gap-3">
				<div class="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" style="box-shadow: 0 0 8px #05d9e8;"></div>
				<span class="text-neon-cyan">Active RFQs</span>
			</h2>
			<a href="/rfq" class="font-display text-sm uppercase tracking-wider text-neon-cyan hover:text-neon-pink transition-colors duration-300">
				View all →
			</a>
		</div>
		<RFQList limit={3} />
	</section>

	<!-- Recent Deals -->
	<section>
		<div class="flex items-center justify-between mb-5">
			<h2 class="font-display text-xl font-bold uppercase tracking-wider flex items-center gap-3">
				<div class="w-2 h-2 rounded-full bg-neon-orange animate-pulse-glow" style="box-shadow: 0 0 8px #ff6e27;"></div>
				<span class="text-neon-orange">Recent Deals</span>
			</h2>
			<a href="/deals" class="font-display text-sm uppercase tracking-wider text-neon-cyan hover:text-neon-pink transition-colors duration-300">
				View all →
			</a>
		</div>
		<DealHistory limit={3} />
	</section>
</div>
