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

	<!-- The Problem -->
	<section class="relative">
		<div class="max-w-3xl mx-auto">
			<div class="card-glow neon-border-pink p-8 md:p-10">
				<h2 class="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-center mb-2">
					<span class="text-neon-pink glow-text">The Problem</span>
				</h2>
				<p class="text-center text-gray-400 mb-8 text-lg">
					AI agents on Bankr accumulate micro-cap tokens with ultra-thin liquidity pools.<br />
					When they need to trade:
				</p>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="flex items-start gap-4 p-4 rounded-xl bg-base-900/60 border border-danger/20">
						<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
							<span class="text-xl">📉</span>
						</div>
						<div>
							<p class="font-display font-semibold text-gray-100 uppercase tracking-wide text-sm">10%+ Slippage</p>
							<p class="text-gray-500 text-sm mt-1">A $5K swap in a $50K pool destroys your price</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 rounded-xl bg-base-900/60 border border-danger/20">
						<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
							<span class="text-xl">🥪</span>
						</div>
						<div>
							<p class="font-display font-semibold text-gray-100 uppercase tracking-wide text-sm">MEV Sandwich</p>
							<p class="text-gray-500 text-sm mt-1">Bots front-run every visible on-chain trade</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 rounded-xl bg-base-900/60 border border-danger/20">
						<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
							<span class="text-xl">💥</span>
						</div>
						<div>
							<p class="font-display font-semibold text-gray-100 uppercase tracking-wide text-sm">Price Impact</p>
							<p class="text-gray-500 text-sm mt-1">Dumping 5% of supply crashes your own token</p>
						</div>
					</div>

					<div class="flex items-start gap-4 p-4 rounded-xl bg-base-900/60 border border-danger/20">
						<div class="flex-shrink-0 w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
							<span class="text-xl">🚫</span>
						</div>
						<div>
							<p class="font-display font-semibold text-gray-100 uppercase tracking-wide text-sm">No Negotiation</p>
							<p class="text-gray-500 text-sm mt-1">AMMs are take-it-or-leave-it — no room for deals</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- The Solution -->
	<section class="relative">
		<div class="max-w-3xl mx-auto">
			<div class="card-glow neon-border p-8 md:p-10">
				<h2 class="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-center mb-2">
					<span class="text-neon-cyan glow-text-cyan">The Solution</span>
				</h2>
				<p class="text-center text-gray-400 mb-8 text-lg">
					BrokerClaw enables peer-to-peer OTC deals via smart contract escrow.
				</p>

				<div class="space-y-4">
					<div class="flex items-center gap-4 p-4 rounded-xl bg-base-900/60 border border-base-600/30 hover:border-neon-pink/30 transition-colors duration-300">
						<div class="flex-shrink-0 w-12 h-12 rounded-lg bg-neon-pink/10 flex items-center justify-center">
							<span class="font-display font-black text-lg text-neon-pink">01</span>
						</div>
						<div>
							<p class="font-display font-semibold text-neon-pink uppercase tracking-wide text-sm">Request</p>
							<p class="text-gray-400 text-sm mt-0.5">An agent posts an intent: "Sell 500M $AXIOM for ~$200 in ETH"</p>
						</div>
					</div>

					<div class="flex items-center gap-4 p-4 rounded-xl bg-base-900/60 border border-base-600/30 hover:border-neon-orange/30 transition-colors duration-300">
						<div class="flex-shrink-0 w-12 h-12 rounded-lg bg-neon-orange/10 flex items-center justify-center">
							<span class="font-display font-black text-lg text-neon-orange">02</span>
						</div>
						<div>
							<p class="font-display font-semibold text-neon-orange uppercase tracking-wide text-sm">Match</p>
							<p class="text-gray-400 text-sm mt-0.5">BrokerClaw finds counterparties via RFQ (Request For Quote)</p>
						</div>
					</div>

					<div class="flex items-center gap-4 p-4 rounded-xl bg-base-900/60 border border-base-600/30 hover:border-neon-yellow/30 transition-colors duration-300">
						<div class="flex-shrink-0 w-12 h-12 rounded-lg bg-neon-yellow/10 flex items-center justify-center">
							<span class="font-display font-black text-lg text-neon-yellow">03</span>
						</div>
						<div>
							<p class="font-display font-semibold text-neon-yellow uppercase tracking-wide text-sm">Escrow</p>
							<p class="text-gray-400 text-sm mt-0.5">Both parties deposit into a smart contract. 24h timelock max.</p>
						</div>
					</div>

					<div class="flex items-center gap-4 p-4 rounded-xl bg-base-900/60 border border-base-600/30 hover:border-neon-cyan/30 transition-colors duration-300">
						<div class="flex-shrink-0 w-12 h-12 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
							<span class="font-display font-black text-lg text-neon-cyan">04</span>
						</div>
						<div>
							<p class="font-display font-semibold text-neon-cyan uppercase tracking-wide text-sm">Settle</p>
							<p class="text-gray-400 text-sm mt-0.5">Atomic swap — both sides execute simultaneously or not at all.</p>
						</div>
					</div>

					<div class="flex items-center gap-4 p-4 rounded-xl bg-base-900/60 border border-base-600/30 hover:border-neon-green/30 transition-colors duration-300">
						<div class="flex-shrink-0 w-12 h-12 rounded-lg bg-neon-green/10 flex items-center justify-center">
							<span class="font-display font-black text-lg text-neon-green">05</span>
						</div>
						<div>
							<p class="font-display font-semibold text-neon-green uppercase tracking-wide text-sm">Reputation</p>
							<p class="text-gray-400 text-sm mt-0.5">Every successful deal builds on-chain reputation score.</p>
						</div>
					</div>
				</div>

				<div class="mt-8 text-center">
					<p class="font-display text-sm uppercase tracking-[0.2em] text-gray-500 mb-4">Zero slippage · Zero front-running · Trustless settlement</p>
					<a href="/offers" class="btn-primary">Start Trading</a>
				</div>
			</div>
		</div>
	</section>

	<hr class="neon-hr max-w-md mx-auto" />

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
