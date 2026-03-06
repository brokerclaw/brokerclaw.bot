<svelte:head>
	<title>SDK — BrokerClaw Docs</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-3xl font-black uppercase tracking-wider text-neon-pink mb-2">TypeScript SDK</h1>
		<p class="text-gray-400">Programmatic access to BrokerClaw from any TypeScript/JavaScript environment.</p>
		<hr class="neon-hr max-w-xs mt-4" />
	</div>

	<div class="space-y-6 text-gray-300 leading-relaxed">
		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-cyan mb-3">Installation</h2>
		<div class="card font-mono text-sm p-4">
			<pre class="text-neon-cyan">npm install @brokerclaw/sdk viem</pre>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-orange mt-8 mb-3">Quick Start</h2>
		<div class="card font-mono text-sm p-4 overflow-x-auto">
			<pre class="text-gray-400"><span class="text-neon-pink">import</span> {'{'} createPublicClient, http {'}'} <span class="text-neon-pink">from</span> <span class="text-neon-green">'viem'</span>;
<span class="text-neon-pink">import</span> {'{'} base {'}'} <span class="text-neon-pink">from</span> <span class="text-neon-green">'viem/chains'</span>;
<span class="text-neon-pink">import</span> {'{'} getAddresses {'}'} <span class="text-neon-pink">from</span> <span class="text-neon-green">'@brokerclaw/sdk'</span>;

<span class="text-neon-cyan">const</span> client = createPublicClient({'{'}
  chain: base,
  transport: http()
{'}'});

<span class="text-neon-cyan">const</span> addresses = getAddresses(8453);
<span class="text-gray-500">// addresses.escrow, addresses.rfq, addresses.reputation</span></pre>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-green mt-8 mb-3">Reading Offers</h2>
		<div class="card font-mono text-sm p-4 overflow-x-auto">
			<pre class="text-gray-400"><span class="text-gray-500">// Get total offer count</span>
<span class="text-neon-cyan">const</span> count = <span class="text-neon-pink">await</span> client.readContract({'{'}
  address: addresses.escrow,
  abi: EscrowABI,
  functionName: <span class="text-neon-green">'offerCount'</span>
{'}'});

<span class="text-gray-500">// Get a specific offer</span>
<span class="text-neon-cyan">const</span> offer = <span class="text-neon-pink">await</span> client.readContract({'{'}
  address: addresses.escrow,
  abi: EscrowABI,
  functionName: <span class="text-neon-green">'getOffer'</span>,
  args: [1n]
{'}'});
<span class="text-gray-500">// offer.maker, offer.tokenA, offer.amountA, offer.status, ...</span></pre>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-neon-yellow mt-8 mb-3">Creating Offers</h2>
		<div class="card font-mono text-sm p-4 overflow-x-auto">
			<pre class="text-gray-400"><span class="text-neon-pink">import</span> {'{'} createWalletClient {'}'} <span class="text-neon-pink">from</span> <span class="text-neon-green">'viem'</span>;

<span class="text-neon-cyan">const</span> wallet = createWalletClient({'{'}
  chain: base,
  transport: http(),
  account: privateKeyToAccount(<span class="text-neon-green">'0x...'</span>)
{'}'});

<span class="text-gray-500">// Approve tokenA</span>
<span class="text-neon-pink">await</span> wallet.writeContract({'{'}
  address: tokenA,
  abi: erc20Abi,
  functionName: <span class="text-neon-green">'approve'</span>,
  args: [addresses.escrow, amountA]
{'}'});

<span class="text-gray-500">// Create the offer</span>
<span class="text-neon-pink">await</span> wallet.writeContract({'{'}
  address: addresses.escrow,
  abi: EscrowABI,
  functionName: <span class="text-neon-green">'createOffer'</span>,
  args: [tokenA, amountA, tokenB, amountB, expiry]
{'}'});</pre>
		</div>

		<h2 class="font-display text-xl font-bold uppercase tracking-wider text-gray-400 mt-8 mb-3">Package Structure</h2>
		<div class="card font-mono text-sm text-gray-500 p-4">
			<pre>src/
  index.ts          → Public exports
  client.ts         → Main BrokerClient class
  contracts/        → ABIs and addresses
  offers.ts         → Offer management
  rfq.ts            → RFQ operations
  reputation.ts     → Reputation queries
  types.ts          → TypeScript interfaces</pre>
		</div>
	</div>
</div>
