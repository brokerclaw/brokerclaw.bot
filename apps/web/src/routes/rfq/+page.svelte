<script lang="ts">
	import RFQList from '$lib/components/RFQList.svelte';
	import { wallet, connectWallet } from '$lib/stores/wallet';

	let tokenWant = $state('WETH');
	let tokenOffer = $state('USDC');
	let amountWant = $state('');
	let expiry = $state('24');
	let submitting = $state(false);

	const tokens = ['USDC', 'WETH', 'DAI', 'Bankers Bot'];

	async function handleSubmit() {
		if (!$wallet.connected) {
			await connectWallet();
			return;
		}
		submitting = true;
		await new Promise((r) => setTimeout(r, 1500));
		submitting = false;
		amountWant = '';
	}
</script>

<svelte:head>
	<title>RFQ — Bankers Bot</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">Request for Quote</h1>
		<p class="text-gray-400">Post what you need and let market makers compete for your order.</p>
	</div>

	<div class="grid lg:grid-cols-3 gap-8">
		<div class="lg:col-span-2">
			<RFQList />
		</div>

		<div>
			<div class="card-glow">
				<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
					<span class="text-secondary">📡</span>
					Submit RFQ
				</h3>

				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
					<div>
						<label for="rfq-token-want" class="block text-xs font-medium text-gray-400 mb-1.5">Token You Want</label>
						<select id="rfq-token-want" class="select-field" bind:value={tokenWant}>
							{#each tokens as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="rfq-amount" class="block text-xs font-medium text-gray-400 mb-1.5">Amount</label>
						<input
							id="rfq-amount"
							type="number"
							class="input-field"
							placeholder="0.00"
							bind:value={amountWant}
							step="any"
							min="0"
						/>
					</div>

					<div>
						<label for="rfq-token-offer" class="block text-xs font-medium text-gray-400 mb-1.5">Paying With</label>
						<select id="rfq-token-offer" class="select-field" bind:value={tokenOffer}>
							{#each tokens as t}
								<option value={t}>{t}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="rfq-expiry" class="block text-xs font-medium text-gray-400 mb-1.5">Expires In</label>
						<select id="rfq-expiry" class="select-field" bind:value={expiry}>
							<option value="1">1 hour</option>
							<option value="6">6 hours</option>
							<option value="24">24 hours</option>
							<option value="72">3 days</option>
						</select>
					</div>

					<button
						type="submit"
						class="w-full px-5 py-2.5 bg-secondary text-white font-semibold rounded-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
						disabled={submitting}
					>
						{#if submitting}
							<span class="flex items-center justify-center gap-2">
								<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Submitting...
							</span>
						{:else if !$wallet.connected}
							Connect Wallet to Submit
						{:else}
							Submit RFQ
						{/if}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
