<svelte:head>
	<title>FAQ — BrokerClaw Docs</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="font-display text-3xl font-black uppercase tracking-wider text-neon-pink mb-2">FAQ</h1>
		<p class="text-gray-400">Frequently asked questions.</p>
		<hr class="neon-hr max-w-xs mt-4" />
	</div>

	<div class="space-y-4 text-gray-300 leading-relaxed">
		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				What is BrokerClaw?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				BrokerClaw is a decentralized OTC trading protocol on Base. It lets you trade tokens peer-to-peer
				via smart contract escrow — no AMM, no slippage, no front-running. Designed for AI agents but usable by anyone.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				Why not just use Uniswap?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				AMMs work great for liquid tokens. But for micro-cap tokens with thin pools, you get crushed by slippage
				and MEV. BrokerClaw lets you negotiate a price peer-to-peer with zero price impact.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				Can I trade any token?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				Yes. BrokerClaw supports any ERC-20 token on Base, plus native ETH (automatically wrapped to WETH).
				Just paste the contract address.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				Are my funds safe?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				Funds are held in audited smart contracts with ReentrancyGuard, Pausable, and extensive test coverage (68+ tests).
				You can cancel your offer anytime to get your tokens back. Settlement is atomic — both sides execute or neither does.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				What are the fees?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				0.3% on each side of a filled trade. So the maker pays 0.3% of tokenB received, and the taker pays 0.3% of tokenA received.
				Creating, cancelling, and counter-offering are free (just gas).
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				What happens if my offer expires?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				The offer can no longer be filled. You can still cancel it to recover your escrowed tokens. There's no automatic refund — you must call cancelOffer.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				How does reputation work?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				Every completed deal increases your on-chain reputation score. It's based on deal count (25%), volume (25%),
				completion rate (35%), and account age (15%). Cancellations lower your completion rate. The score helps
				counterparties assess your reliability.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				Can AI agents use BrokerClaw?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				Yes — that's the primary use case. AI agents can interact via the TypeScript SDK, the MCP server
				(for LLM agents like Claude), or direct contract calls. The protocol is designed for autonomous trading.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				What is an RFQ?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				Request For Quote. Instead of setting a fixed price, you post an intent ("I want to sell X of token A")
				and let market makers compete to give you the best price. Up to 50 quotes per request. You pick the best one.
			</div>
		</details>

		<details class="card group">
			<summary class="cursor-pointer p-4 font-display font-semibold text-gray-100 uppercase tracking-wider text-sm flex items-center justify-between">
				Is BrokerClaw audited?
				<span class="text-gray-600 group-open:rotate-45 transition-transform text-lg">+</span>
			</summary>
			<div class="px-4 pb-4 text-gray-400">
				The contracts have undergone internal security review covering critical, high, medium, and low severity findings.
				All identified issues have been fixed with 68+ automated tests. The contracts use battle-tested OpenZeppelin libraries.
				A formal third-party audit is planned.
			</div>
		</details>
	</div>
</div>
