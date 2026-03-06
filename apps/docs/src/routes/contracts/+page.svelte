<svelte:head>
	<title>Smart Contracts — BrokerClaw Docs</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-3xl font-black uppercase tracking-wider text-neon-pink mb-2">Smart Contracts</h1>
		<p class="text-gray-400">Deployed on Base L2 (Chain ID: 8453)</p>
		<hr class="neon-hr max-w-xs mt-4" />
	</div>

	<div class="space-y-6 text-gray-300 leading-relaxed">
		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-cyan mb-3">Deployed Addresses</h2>

		<div class="space-y-3">
			<div class="card p-4">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<span class="font-display font-semibold text-neon-pink uppercase tracking-wider text-sm">BrokerEscrow</span>
					<code class="font-mono text-xs text-neon-cyan break-all">0xd141E2De0Cca22feaB5F764040A5BD3d7A84AEce</code>
				</div>
				<p class="text-gray-500 text-sm mt-2">Core escrow for OTC swaps. Handles deposits, atomic settlement, fee distribution.</p>
			</div>

			<div class="card p-4">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<span class="font-display font-semibold text-neon-orange uppercase tracking-wider text-sm">BrokerRFQ</span>
					<code class="font-mono text-xs text-neon-cyan break-all">0x3aFa1253e28a93b5Eda721C32666AB017D27132f</code>
				</div>
				<p class="text-gray-500 text-sm mt-2">Request For Quote system. Post intents, receive quotes, accept best price.</p>
			</div>

			<div class="card p-4">
				<div class="flex items-center justify-between flex-wrap gap-2">
					<span class="font-display font-semibold text-neon-green uppercase tracking-wider text-sm">BrokerReputation</span>
					<code class="font-mono text-xs text-neon-cyan break-all">0x65f08ed423585AAA8C95721080aF69B748E27C64</code>
				</div>
				<p class="text-gray-500 text-sm mt-2">On-chain reputation. Tracks deals, volume, completion rate, account age.</p>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-orange mt-8 mb-3">BrokerEscrow</h2>
		<p>The core contract. Handles the full lifecycle of OTC trades.</p>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">Key Functions</h3>
		<div class="card font-mono text-sm overflow-x-auto p-4 space-y-3">
			<div>
				<span class="text-neon-pink">createOffer</span><span class="text-gray-500">(tokenA, amountA, tokenB, amountB, expiry)</span>
				<p class="text-gray-500 text-xs mt-1 font-sans">Create an offer. Deposits tokenA into escrow. Payable for ETH.</p>
			</div>
			<hr class="border-base-700" />
			<div>
				<span class="text-neon-cyan">fillOffer</span><span class="text-gray-500">(offerId)</span>
				<p class="text-gray-500 text-xs mt-1 font-sans">Fill an open offer. Deposits tokenB, triggers atomic settlement.</p>
			</div>
			<hr class="border-base-700" />
			<div>
				<span class="text-neon-yellow">cancelOffer</span><span class="text-gray-500">(offerId)</span>
				<p class="text-gray-500 text-xs mt-1 font-sans">Cancel your open offer. Returns escrowed tokenA. Records cancellation in reputation.</p>
			</div>
			<hr class="border-base-700" />
			<div>
				<span class="text-neon-green">counterOffer</span><span class="text-gray-500">(offerId, newAmountB)</span>
				<p class="text-gray-500 text-xs mt-1 font-sans">Counter with a different price. Must deposit tokenB. Original stays open.</p>
			</div>
			<hr class="border-base-700" />
			<div>
				<span class="text-gray-400">getOffer</span><span class="text-gray-500">(offerId) → Offer</span>
				<p class="text-gray-500 text-xs mt-1 font-sans">Read offer details (maker, tokens, amounts, status, expiry).</p>
			</div>
		</div>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">Offer Status</h3>
		<div class="flex flex-wrap gap-3">
			<span class="badge-green">0 = Open</span>
			<span class="badge-blue">1 = Filled</span>
			<span class="badge-red">2 = Cancelled</span>
			<span class="badge-yellow">3 = Countered</span>
		</div>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">Fees</h3>
		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> <strong>0.3%</strong> on both sides of a filled trade (configurable up to 5%)</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> 100% goes to protocol treasury</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> Fee-on-transfer tokens are supported (actual received amount is tracked)</li>
		</ul>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">Security Features</h3>
		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> OpenZeppelin ReentrancyGuard on all state-changing functions</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Pausable — owner can pause in emergencies</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Fee-on-transfer safe (balance measurement)</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Same-token offers blocked (including ETH↔WETH)</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Counter-offers require deposit (no griefing)</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> RFQ quotes capped at 50 per request (DoS protection)</li>
			<li class="flex items-start gap-2"><span class="text-neon-green">▸</span> Rescue functions for accidentally sent ETH/ERC-20</li>
		</ul>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-green mt-8 mb-3">BrokerReputation</h2>
		<p>On-chain reputation scoring based on four weighted components:</p>
		<div class="card font-mono text-sm p-4 space-y-1">
			<div><span class="text-neon-pink">25%</span> <span class="text-gray-400">Deal count (max 100 deals)</span></div>
			<div><span class="text-neon-orange">25%</span> <span class="text-gray-400">Volume traded (max 1000 ETH equivalent)</span></div>
			<div><span class="text-neon-cyan">35%</span> <span class="text-gray-400">Completion rate (completed / total attempts)</span></div>
			<div><span class="text-neon-green">15%</span> <span class="text-gray-400">Account age (max 365 days)</span></div>
		</div>
		<p class="text-gray-500 text-sm mt-2">Score range: 0–10,000 basis points. Cancellations hurt your completion rate.</p>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-gray-400 mt-8 mb-3">Using with Cast (CLI)</h2>
		<div class="card font-mono text-sm p-4 overflow-x-auto">
			<pre class="text-gray-400"><span class="text-gray-500"># Read offer count</span>
cast call 0xd141E2De0Cca22feaB5F764040A5BD3d7A84AEce \
  "offerCount()(uint256)" --rpc-url https://mainnet.base.org

<span class="text-gray-500"># Create an offer (0.0001 ETH for USDC)</span>
cast send 0xd141E2De0Cca22feaB5F764040A5BD3d7A84AEce \
  "createOffer(address,uint256,address,uint256,uint256)" \
  0x0000000000000000000000000000000000000000 \
  100000000000000 \
  0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
  250000 \
  $(date -d '+1 hour' +%s) \
  --value 0.0001ether \
  --rpc-url https://mainnet.base.org \
  --private-key $PK</pre>
		</div>
	</div>
</div>
