<svelte:head>
	<title>Getting Started — BrokerClaw Docs</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-3xl font-black uppercase tracking-wider text-neon-pink mb-2">Getting Started</h1>
		<p class="text-gray-400">Start trading on BrokerClaw in minutes.</p>
		<hr class="neon-hr max-w-xs mt-4" />
	</div>

	<div class="space-y-6 text-gray-300 leading-relaxed">
		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-cyan mt-6 mb-3">Prerequisites</h2>
		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> A wallet (MetaMask, Rabby, Coinbase Wallet, etc.)</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> ETH on Base for gas fees</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> ERC-20 tokens to trade</li>
		</ul>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-orange mt-8 mb-3">Creating an Offer</h2>
		<div class="space-y-3">
			<div class="card p-4">
				<p><strong class="text-gray-100">1. Connect your wallet</strong> — Click "Connect Wallet" on <a href="https://brokerclaw.bot" class="text-neon-cyan hover:text-neon-pink transition-colors">brokerclaw.bot</a></p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">2. Select tokens</strong> — Choose from quick-select (ETH, WETH, USDC, BROKR) or paste any ERC-20 contract address</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">3. Set amounts</strong> — Enter how much you want to sell and how much you want to receive. Your balance is shown automatically.</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">4. Set expiry</strong> — Choose how long the offer stays open (1h to 7 days)</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">5. Approve & Create</strong> — Approve the token transfer, then create the offer. Your tokens are locked in escrow.</p>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-green mt-8 mb-3">Filling an Offer</h2>
		<div class="space-y-3">
			<div class="card p-4">
				<p><strong class="text-gray-100">1. Browse offers</strong> — Check the Offers page for open trades</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">2. Fill</strong> — Approve the required tokenB and call fillOffer. The swap executes atomically.</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">3. Done</strong> — You receive tokenA, the maker receives tokenB. Both get reputation points.</p>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-yellow mt-8 mb-3">Using RFQ (Request For Quote)</h2>
		<p>Instead of creating a fixed-price offer, you can request quotes from the market:</p>
		<div class="space-y-3">
			<div class="card p-4">
				<p><strong class="text-gray-100">1. Post an RFQ</strong> — "I want to sell 500M $TOKEN — give me your best price in ETH"</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">2. Receive quotes</strong> — Market makers submit competing prices (up to 50 per request)</p>
			</div>
			<div class="card p-4">
				<p><strong class="text-gray-100">3. Accept the best</strong> — Accepting a quote automatically creates an escrow offer for settlement</p>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-pink mt-8 mb-3">Counter-Offers</h2>
		<p>Don't like the price? Submit a counter-offer:</p>
		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> You must deposit tokens (skin in the game)</li>
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> The original offer stays open — others can still fill it</li>
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> The original maker can fill your counter to accept the new price</li>
			<li class="flex items-start gap-2"><span class="text-neon-pink">▸</span> You can cancel your counter anytime to get your deposit back</li>
		</ul>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-gray-400 mt-8 mb-3">For AI Agents</h2>
		<p>AI agents can interact with BrokerClaw via:</p>
		<ul class="space-y-2 ml-4">
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> <a href="/sdk" class="text-neon-cyan hover:text-neon-pink transition-colors">TypeScript SDK</a> — programmatic access</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> <a href="/mcp" class="text-neon-cyan hover:text-neon-pink transition-colors">MCP Server</a> — tool interface for LLM agents</li>
			<li class="flex items-start gap-2"><span class="text-neon-cyan">▸</span> Direct contract calls via <code class="text-neon-orange bg-base-800 px-1.5 py-0.5 rounded text-xs">viem</code> / <code class="text-neon-orange bg-base-800 px-1.5 py-0.5 rounded text-xs">ethers</code> / <code class="text-neon-orange bg-base-800 px-1.5 py-0.5 rounded text-xs">cast</code></li>
		</ul>
	</div>
</div>
