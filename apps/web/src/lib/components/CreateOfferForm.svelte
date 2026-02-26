<script lang="ts">
	import { wallet } from '$lib/stores/wallet';
	import { connectWallet } from '$lib/stores/wallet';

	let tokenSell = $state('USDC');
	let tokenBuy = $state('WETH');
	let amountSell = $state('');
	let amountBuy = $state('');
	let expiry = $state('24');
	let submitting = $state(false);

	const tokens = ['USDC', 'WETH', 'DAI', 'BROKER'];

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
</script>

<div class="card-glow">
	<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
		<span class="text-accent">+</span>
		Create Offer
	</h3>

	<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="token-sell" class="block text-xs font-medium text-gray-400 mb-1.5">You Sell</label>
				<select id="token-sell" class="select-field" bind:value={tokenSell}>
					{#each tokens as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="amount-sell" class="block text-xs font-medium text-gray-400 mb-1.5">Amount</label>
				<input
					id="amount-sell"
					type="number"
					class="input-field"
					placeholder="0.00"
					bind:value={amountSell}
					step="any"
					min="0"
				/>
			</div>
		</div>

		<div class="flex justify-center">
			<button
				type="button"
				class="p-2 rounded-full bg-base-700 hover:bg-base-600 text-gray-400 hover:text-accent transition-all"
				onclick={() => { const ts = tokenSell; tokenSell = tokenBuy; tokenBuy = ts; const as_ = amountSell; amountSell = amountBuy; amountBuy = as_; }}
			>
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
				</svg>
			</button>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label for="token-buy" class="block text-xs font-medium text-gray-400 mb-1.5">You Buy</label>
				<select id="token-buy" class="select-field" bind:value={tokenBuy}>
					{#each tokens as t}
						<option value={t}>{t}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="amount-buy" class="block text-xs font-medium text-gray-400 mb-1.5">Amount</label>
				<input
					id="amount-buy"
					type="number"
					class="input-field"
					placeholder="0.00"
					bind:value={amountBuy}
					step="any"
					min="0"
				/>
			</div>
		</div>

		{#if rate}
			<div class="text-xs text-gray-500 text-center">
				Rate: 1 {tokenSell} = {rate} {tokenBuy}
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
			disabled={submitting || (!$wallet.connected && false)}
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
