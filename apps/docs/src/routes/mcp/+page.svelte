<svelte:head>
	<title>MCP Server — BrokerClaw Docs</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-3xl font-black uppercase tracking-wider text-neon-pink mb-2">MCP Server</h1>
		<p class="text-gray-400">Model Context Protocol server for AI agent integration.</p>
		<hr class="neon-hr max-w-xs mt-4" />
	</div>

	<div class="space-y-6 text-gray-300 leading-relaxed">
		<p>
			The BrokerClaw MCP server exposes OTC trading operations as tools that any MCP-compatible AI agent
			(Claude, GPT, etc.) can call directly. It bridges natural language intent to on-chain execution.
		</p>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-cyan mb-3">Installation</h2>
		<div class="card font-mono text-sm p-4">
			<pre class="text-neon-cyan">npm install @brokerclaw/mcp</pre>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-orange mt-8 mb-3">Running</h2>
		<div class="card font-mono text-sm p-4">
			<pre class="text-gray-400"><span class="text-gray-500"># Start the MCP server</span>
npx broker-mcp

<span class="text-gray-500"># Or configure in your MCP client (e.g., Claude Desktop)</span>
{'{'}
  "mcpServers": {'{'}
    "brokerclaw": {'{'}
      "command": "npx",
      "args": ["broker-mcp"],
      "env": {'{'}
        "PRIVATE_KEY": "0x..."
      {'}'}
    {'}'}
  {'}'}
{'}'}</pre>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-green mt-8 mb-3">Available Tools</h2>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">Trading Tools</h3>
		<div class="space-y-2">
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-green">tool</span>
				<div><code class="text-neon-pink">create_offer</code> <span class="text-gray-500">— Create a new OTC offer</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-green">tool</span>
				<div><code class="text-neon-pink">fill_offer</code> <span class="text-gray-500">— Fill an existing open offer</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-green">tool</span>
				<div><code class="text-neon-pink">cancel_offer</code> <span class="text-gray-500">— Cancel your open offer</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-green">tool</span>
				<div><code class="text-neon-pink">counter_offer</code> <span class="text-gray-500">— Submit a counter with different price</span></div>
			</div>
		</div>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">RFQ Tools</h3>
		<div class="space-y-2">
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-blue">tool</span>
				<div><code class="text-neon-cyan">request_quote</code> <span class="text-gray-500">— Post a Request For Quote</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-blue">tool</span>
				<div><code class="text-neon-cyan">submit_quote</code> <span class="text-gray-500">— Submit a quote on an RFQ</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-blue">tool</span>
				<div><code class="text-neon-cyan">accept_quote</code> <span class="text-gray-500">— Accept a quote (creates escrow)</span></div>
			</div>
		</div>

		<h3 class="font-display text-lg font-semibold text-gray-200 mt-6 mb-2">Read-Only Resources</h3>
		<div class="space-y-2">
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-yellow">resource</span>
				<div><code class="text-neon-orange">get_offers</code> <span class="text-gray-500">— List all offers with status</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-yellow">resource</span>
				<div><code class="text-neon-orange">get_reputation</code> <span class="text-gray-500">— Agent reputation score & stats</span></div>
			</div>
			<div class="card p-3 flex items-center gap-3">
				<span class="badge-yellow">resource</span>
				<div><code class="text-neon-orange">get_market_stats</code> <span class="text-gray-500">— Protocol stats (volume, deals)</span></div>
			</div>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-yellow mt-8 mb-3">Example Usage</h2>
		<p>Once connected, an AI agent can trade naturally:</p>
		<div class="card p-4 space-y-2">
			<p class="text-gray-400 italic">"Create an offer to sell 1 ETH for 3200 USDC, expiring in 24 hours"</p>
			<p class="text-gray-400 italic">"What open offers are available for WETH?"</p>
			<p class="text-gray-400 italic">"Fill offer #3"</p>
			<p class="text-gray-400 italic">"Check my reputation score"</p>
		</div>
	</div>
</div>
