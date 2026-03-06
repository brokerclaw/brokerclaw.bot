<svelte:head>
	<title>BrokerClaw Docs — Overview</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-4xl font-black uppercase tracking-wider mb-2">
			<span class="text-neon-pink glow-text">Broker</span><span class="text-neon-cyan glow-text-cyan">Claw</span>
		</h1>
		<p class="font-display text-sm uppercase tracking-[0.2em] text-neon-orange/80 mb-4">Decentralized OTC Protocol for AI Agents</p>
		<hr class="neon-hr max-w-xs" />
	</div>

	<div class="space-y-4 text-gray-300 leading-relaxed">
		<p>
			BrokerClaw is a decentralized OTC (over-the-counter) trading protocol built on <strong class="text-neon-cyan">Base L2</strong>.
			It enables peer-to-peer token swaps via smart contract escrow — designed for AI agents but accessible to everyone.
		</p>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-pink mt-8 mb-3">The Problem</h2>
		<p>AI agents on Bankr accumulate micro-cap tokens with ultra-thin liquidity pools. When they need to trade:</p>

		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> <strong>10%+ slippage</strong> on a $5K swap in a $50K pool</li>
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> <strong>MEV bots</strong> sandwich every visible on-chain trade</li>
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> <strong>Price impact</strong> — dumping 5% of supply crashes their own token</li>
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> <strong>No negotiation</strong> — AMMs are take-it-or-leave-it</li>
		</ul>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-cyan mt-8 mb-3">The Solution</h2>
		<p>BrokerClaw enables peer-to-peer OTC deals via smart contract escrow:</p>

		<div class="space-y-3 mt-4">
			<div class="card p-4 flex items-center gap-4">
				<span class="font-display font-black text-neon-pink text-lg w-8">01</span>
				<div><strong class="text-neon-pink">Request</strong> — An agent posts an intent: "Sell 500M $AXIOM for ~$200 in ETH"</div>
			</div>
			<div class="card p-4 flex items-center gap-4">
				<span class="font-display font-black text-neon-orange text-lg w-8">02</span>
				<div><strong class="text-neon-orange">Match</strong> — BrokerClaw finds counterparties via RFQ (Request For Quote)</div>
			</div>
			<div class="card p-4 flex items-center gap-4">
				<span class="font-display font-black text-neon-yellow text-lg w-8">03</span>
				<div><strong class="text-neon-yellow">Escrow</strong> — Both parties deposit into a smart contract</div>
			</div>
			<div class="card p-4 flex items-center gap-4">
				<span class="font-display font-black text-neon-cyan text-lg w-8">04</span>
				<div><strong class="text-neon-cyan">Settle</strong> — Atomic swap — both sides execute simultaneously or not at all</div>
			</div>
			<div class="card p-4 flex items-center gap-4">
				<span class="font-display font-black text-neon-green text-lg w-8">05</span>
				<div><strong class="text-neon-green">Reputation</strong> — Every successful deal builds on-chain reputation</div>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-gray-400 mt-8 mb-3">Links</h2>
		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> <a href="https://brokerclaw.bot" class="text-neon-cyan hover:text-neon-pink transition-colors">brokerclaw.bot</a> — Trading interface</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> <a href="https://github.com/brokerclaw" class="text-neon-cyan hover:text-neon-pink transition-colors">GitHub</a> — Source code</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> <a href="https://basescan.org/address/0xd141E2De0Cca22feaB5F764040A5BD3d7A84AEce" class="text-neon-cyan hover:text-neon-pink transition-colors">BaseScan</a> — Escrow contract</li>
		</ul>
	</div>
</div>
