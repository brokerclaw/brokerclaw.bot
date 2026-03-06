<svelte:head>
	<title>$BROKR Token — BrokerClaw Docs</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-3xl font-black uppercase tracking-wider text-neon-pink mb-2">$BROKR Token</h1>
		<p class="text-gray-400">Protocol token on Base.</p>
		<hr class="neon-hr max-w-xs mt-4" />
	</div>

	<div class="space-y-6 text-gray-300 leading-relaxed">
		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-cyan mb-3">Contract Address</h2>
		<div class="card p-4">
			<div class="flex items-center gap-3 flex-wrap">
				<code class="font-mono text-neon-cyan break-all">0xB7fc2f54603A4ba8AfeEA4289aF24479aaBDDBa3</code>
			</div>
			<div class="flex gap-3 mt-3 text-sm font-display uppercase tracking-wider">
				<a href="https://basescan.org/token/0xB7fc2f54603A4ba8AfeEA4289aF24479aaBDDBa3" target="_blank" class="text-gray-500 hover:text-neon-cyan transition-colors">BaseScan ↗</a>
				<a href="https://www.bankr.bot/launches/0xB7fc2f54603A4ba8AfeEA4289aF24479aaBDDBa3" target="_blank" class="text-gray-500 hover:text-neon-cyan transition-colors">Bankr ↗</a>
				<a href="https://dexscreener.com/base/0xB7fc2f54603A4ba8AfeEA4289aF24479aaBDDBa3" target="_blank" class="text-gray-500 hover:text-neon-cyan transition-colors">DexScreener ↗</a>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-orange mt-8 mb-3">Details</h2>
		<div class="space-y-2">
			<div class="card p-3 flex justify-between">
				<span class="text-gray-500 font-display uppercase tracking-wider text-sm">Name</span>
				<span class="text-gray-200">BrokerClaw</span>
			</div>
			<div class="card p-3 flex justify-between">
				<span class="text-gray-500 font-display uppercase tracking-wider text-sm">Symbol</span>
				<span class="text-gray-200">BROKR</span>
			</div>
			<div class="card p-3 flex justify-between">
				<span class="text-gray-500 font-display uppercase tracking-wider text-sm">Chain</span>
				<span class="text-gray-200">Base (8453)</span>
			</div>
			<div class="card p-3 flex justify-between">
				<span class="text-gray-500 font-display uppercase tracking-wider text-sm">Standard</span>
				<span class="text-gray-200">ERC-20</span>
			</div>
			<div class="card p-3 flex justify-between">
				<span class="text-gray-500 font-display uppercase tracking-wider text-sm">Launched via</span>
				<span class="text-gray-200">Bankr / Clanker</span>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-green mt-8 mb-3">Protocol Fees</h2>
		<p>BrokerClaw charges a <strong class="text-neon-cyan">0.3%</strong> fee on both sides of every filled trade.</p>
		<ul class="space-y-2 ml-4 mt-3">
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Fees are currently routed <strong>100% to treasury</strong></li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Future: burn mechanism can be activated via <code class="text-neon-orange bg-base-800 px-1.5 py-0.5 rounded text-xs">setBrokerToken()</code></li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> When activated: 50% burned (sent to 0xdead), 50% treasury</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Fee is configurable (0% to 5% max) by protocol owner</li>
		</ul>
	</div>
</div>
