<script lang="ts">
	import { wallet } from '$lib/stores/wallet';
	import { connectWallet } from '$lib/stores/wallet';
	import { publicClient } from '$lib/contracts/config';
	import { ERC20_ABI } from '$lib/contracts/abi';

	let tokenSellAddress = $state('');
	let tokenBuyAddress = $state('');
	let amountSell = $state('');
	let amountBuy = $state('');
	let expiry = $state('24');
	let submitting = $state(false);

	let tokenSellSymbol = $state('');
	let tokenBuySymbol = $state('');
	let tokenSellError = $state('');
	let tokenBuyError = $state('');

	// Common tokens for quick select
	const quickTokens = [
		{ symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
		{ symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
		{ symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
		{ symbol: 'BROKR', address: '0xB7fc2f54603A4ba8AfeEA4289aF24479aaBDDBa3' },
		{ symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' }
	];

	async function resolveToken(address: string): Promise<string> {
		if (!address || address.length < 42) return '';
		if (address === '0x0000000000000000000000000000000000000000') return 'ETH';

		const quick = quickTokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
		if (quick) return quick.symbol;

		try {
			const symbol = await publicClient.readContract({
				address: address as `0x${string}`,
				abi: ERC20_ABI,
				functionName: 'symbol'
			});
			return symbol;
		} catch {
			return '';
		}
	}

	async function onSellAddressChange() {
		tokenSellError = '';
		tokenSellSymbol = '';
		if (tokenSellAddress.length === 42 || tokenSellAddress === '0x0000000000000000000000000000000000000000') {
			const sym = await resolveToken(tokenSellAddress);
			if (sym) {
				tokenSellSymbol = sym;
			} else {
				tokenSellError = 'Token not found';
			}
		}
	}

	async function onBuyAddressChange() {
		tokenBuyError = '';
		tokenBuySymbol = '';
		if (tokenBuyAddress.length === 42 || tokenBuyAddress === '0x0000000000000000000000000000000000000000') {
			const sym = await resolveToken(tokenBuyAddress);
			if (sym) {
				tokenBuySymbol = sym;
			} else {
				tokenBuyError = 'Token not found';
			}
		}
	}

	function selectQuickToken(side: 'sell' | 'buy', token: { symbol: string; address: string }) {
		if (side === 'sell') {
			tokenSellAddress = token.address;
			tokenSellSymbol = token.symbol;
			tokenSellError = '';
		} else {
			tokenBuyAddress = token.address;
			tokenBuySymbol = token.symbol;
			tokenBuyError = '';
		}
	}

	async function handleSubmit() {
		if (!$wallet.connected) {
			await connectWallet();
			return;
		}
		submitting = true;
		// Contract interaction would go here
		await new Promise((r) => setTimeout(r, 1500));
		submitting = false;
		amountSell = '';
		amountBuy = '';
	}

	const rate = $derived(
		amountSell && amountBuy && parseFloat(amountSell) > 0
			? (parseFloat(amountBuy) / parseFloat(amountSell)).toFixed(6)
			: null
	);

	const sellLabel = $derived(tokenSellSymbol || 'Token');
	const buyLabel = $derived(tokenBuySymbol || 'Token');
</script>

<div class="card-glow">
	<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
		<span class="text-accent">+</span>
		Create Offer
	</h3>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		<!-- Sell Side -->
		<div>
			<label for="token-sell" class="block text-xs font-medium text-gray-400 mb-1.5">You Sell</label>
			<div class="flex flex-wrap gap-1.5 mb-2">
				{#each quickTokens as token}
					<button
						type="button"
						class="px-2.5 py-1 text-xs font-display uppercase tracking-wider rounded-md transition-all {tokenSellAddress.toLowerCase() === token.address.toLowerCase() ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'bg-base-700/50 text-gray-400 hover:text-gray-200 border border-base-600/30'}"
						onclick={() => selectQuickToken('sell', token)}
					>
						{token.symbol}
					</button>
				{/each}
			</div>
			<div class="flex gap-2">
				<input
					id="token-sell"
					type="text"
					class="input-field flex-1 font-mono text-sm"
					placeholder="0x... token address"
					bind:value={tokenSellAddress}
					oninput={() => onSellAddressChange()}
				/>
				{#if tokenSellSymbol}
					<div class="flex items-center px-3 rounded-lg bg-neon-pink/10 border border-neon-pink/20">
						<span class="text-neon-pink font-display text-sm font-semibold">{tokenSellSymbol}</span>
					</div>
				{/if}
			</div>
			{#if tokenSellError}
				<p class="text-danger text-xs mt-1">{tokenSellError}</p>
			{/if}
			<input
				type="number"
				class="input-field mt-2"
				placeholder="Amount"
				bind:value={amountSell}
				step="any"
				min="0"
			/>
		</div>

		<!-- Swap Button -->
		<div class="flex justify-center">
			<button
				type="button"
				class="p-2 rounded-full bg-base-700 hover:bg-base-600 text-gray-400 hover:text-accent transition-all"
				aria-label="Swap tokens"
				onclick={() => {
					const ta = tokenSellAddress; tokenSellAddress = tokenBuyAddress; tokenBuyAddress = ta;
					const ts = tokenSellSymbol; tokenSellSymbol = tokenBuySymbol; tokenBuySymbol = ts;
					const te = tokenSellError; tokenSellError = tokenBuyError; tokenBuyError = te;
					const as_ = amountSell; amountSell = amountBuy; amountBuy = as_;
				}}
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
				</svg>
			</button>
		</div>

		<!-- Buy Side -->
		<div>
			<label for="token-buy" class="block text-xs font-medium text-gray-400 mb-1.5">You Buy</label>
			<div class="flex flex-wrap gap-1.5 mb-2">
				{#each quickTokens as token}
					<button
						type="button"
						class="px-2.5 py-1 text-xs font-display uppercase tracking-wider rounded-md transition-all {tokenBuyAddress.toLowerCase() === token.address.toLowerCase() ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-base-700/50 text-gray-400 hover:text-gray-200 border border-base-600/30'}"
						onclick={() => selectQuickToken('buy', token)}
					>
						{token.symbol}
					</button>
				{/each}
			</div>
			<div class="flex gap-2">
				<input
					id="token-buy"
					type="text"
					class="input-field flex-1 font-mono text-sm"
					placeholder="0x... token address"
					bind:value={tokenBuyAddress}
					oninput={() => onBuyAddressChange()}
				/>
				{#if tokenBuySymbol}
					<div class="flex items-center px-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
						<span class="text-neon-cyan font-display text-sm font-semibold">{tokenBuySymbol}</span>
					</div>
				{/if}
			</div>
			{#if tokenBuyError}
				<p class="text-danger text-xs mt-1">{tokenBuyError}</p>
			{/if}
			<input
				type="number"
				class="input-field mt-2"
				placeholder="Amount"
				bind:value={amountBuy}
				step="any"
				min="0"
			/>
		</div>

		{#if rate}
			<div class="text-xs text-gray-500 text-center">
				Rate: 1 {sellLabel} = {rate} {buyLabel}
			</div>
		{/if}

		<div>
			<label for="expiry" class="block text-xs font-medium text-gray-400 mb-1.5">Expires In</label>
			<select id="expiry" class="select-field" bind:value={expiry}>
				<option value="1">1 hour</option>
				<option value="6">6 hours</option>
				<option value="24">24 hours</option>
				<option value="72">3 days</option>
				<option value="168">7 days</option>
			</select>
		</div>

		<button
			type="submit"
			class="btn-primary w-full"
			disabled={submitting || !tokenSellAddress || !tokenBuyAddress || !amountSell || !amountBuy}
		>
			{#if submitting}
				<span class="flex items-center justify-center gap-2">
					<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Creating Offer...
				</span>
			{:else if !$wallet.connected}
				Connect Wallet to Create Offer
			{:else}
				Create Offer
			{/if}
		</button>
	</form>
</div>
