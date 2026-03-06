<script lang="ts">
	import RFQList from '$lib/components/RFQList.svelte';
	import { wallet, walletClient, connectWallet } from '$lib/stores/wallet';
	import { publicClient } from '$lib/contracts/config';
	import { ERC20_ABI, RFQ_ABI } from '$lib/contracts/abi';
	import { ADDRESSES } from '$lib/contracts/addresses';
	import { get } from 'svelte/store';

	let tokenWantAddress = $state('');
	let tokenOfferAddress = $state('');
	let tokenWantSymbol = $state('');
	let tokenOfferSymbol = $state('');
	let tokenWantError = $state('');
	let tokenOfferError = $state('');
	let tokenWantBalance = $state('');
	let tokenOfferBalance = $state('');
	let tokenWantDecimals = $state(18);
	let tokenOfferDecimals = $state(18);
	let amountWant = $state('');
	let expiry = $state('24');
	let submitting = $state(false);
	let txStatus = $state('');
	let txHash = $state('');
	let txError = $state('');

	const quickTokens = [
		{ symbol: 'ETH', address: '0x0000000000000000000000000000000000000000' },
		{ symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
		{ symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
		{ symbol: 'BROKR', address: '0xB7fc2f54603A4ba8AfeEA4289aF24479aaBDDBa3' }
	];

	async function fetchBalance(address: string): Promise<{ balance: string; decimals: number }> {
		if (!$wallet.connected || !$wallet.address) return { balance: '', decimals: 18 };
		if (address === '0x0000000000000000000000000000000000000000') {
			try {
				const bal = await publicClient.getBalance({ address: $wallet.address as `0x${string}` });
				const num = Number(bal) / 1e18;
				return { balance: num > 0.001 ? num.toFixed(4) : num.toFixed(8), decimals: 18 };
			} catch { return { balance: '', decimals: 18 }; }
		}
		try {
			const [bal, dec] = await Promise.all([
				publicClient.readContract({
					address: address as `0x${string}`,
					abi: ERC20_ABI,
					functionName: 'balanceOf',
					args: [$wallet.address as `0x${string}`]
				}),
				publicClient.readContract({
					address: address as `0x${string}`,
					abi: ERC20_ABI,
					functionName: 'decimals'
				})
			]);
			const decimals = Number(dec);
			const num = Number(bal) / 10 ** decimals;
			return { balance: num > 0.001 ? num.toFixed(4) : num > 0 ? num.toFixed(8) : '0', decimals };
		} catch {
			return { balance: '', decimals: 18 };
		}
	}

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
		} catch { return ''; }
	}

	async function onWantAddressChange() {
		tokenWantError = '';
		tokenWantSymbol = '';
		tokenWantBalance = '';
		if (tokenWantAddress.length === 42 || tokenWantAddress === '0x0000000000000000000000000000000000000000') {
			const sym = await resolveToken(tokenWantAddress);
			if (sym) {
				tokenWantSymbol = sym;
				const { balance, decimals } = await fetchBalance(tokenWantAddress);
				tokenWantBalance = balance;
				tokenWantDecimals = decimals;
			} else {
				tokenWantError = 'Token not found';
			}
		}
	}

	async function onOfferAddressChange() {
		tokenOfferError = '';
		tokenOfferSymbol = '';
		tokenOfferBalance = '';
		if (tokenOfferAddress.length === 42 || tokenOfferAddress === '0x0000000000000000000000000000000000000000') {
			const sym = await resolveToken(tokenOfferAddress);
			if (sym) {
				tokenOfferSymbol = sym;
				const { balance, decimals } = await fetchBalance(tokenOfferAddress);
				tokenOfferBalance = balance;
				tokenOfferDecimals = decimals;
			} else {
				tokenOfferError = 'Token not found';
			}
		}
	}

	async function selectQuickToken(side: 'want' | 'offer', token: { symbol: string; address: string }) {
		if (side === 'want') {
			tokenWantAddress = token.address;
			tokenWantSymbol = token.symbol;
			tokenWantError = '';
			const { balance, decimals } = await fetchBalance(token.address);
			tokenWantBalance = balance;
			tokenWantDecimals = decimals;
		} else {
			tokenOfferAddress = token.address;
			tokenOfferSymbol = token.symbol;
			tokenOfferError = '';
			const { balance, decimals } = await fetchBalance(token.address);
			tokenOfferBalance = balance;
			tokenOfferDecimals = decimals;
		}
	}

	async function handleSubmit() {
		if (!$wallet.connected) {
			await connectWallet();
			return;
		}

		const client = get(walletClient);
		if (!client) {
			txError = 'Wallet client not available';
			return;
		}

		submitting = true;
		txStatus = '';
		txHash = '';
		txError = '';

		try {
			const amountAWei = parseUnits(amountWant, tokenWantDecimals);
			const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + parseInt(expiry) * 3600);

			txStatus = 'Submitting RFQ...';
			const hash = await client.writeContract({
				address: ADDRESSES.RFQ,
				abi: RFQ_ABI,
				functionName: 'requestQuote',
				args: [
					tokenWantAddress as `0x${string}`,
					amountAWei,
					tokenOfferAddress as `0x${string}`,
					expiryTimestamp
				],
				chain: null,
				account: $wallet.address as `0x${string}`
			});

			txHash = hash;
			txStatus = 'Waiting for confirmation...';
			await publicClient.waitForTransactionReceipt({ hash });
			txStatus = 'RFQ submitted!';
			amountWant = '';
		} catch (err: any) {
			console.error('RFQ submit error:', err);
			if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
				txError = 'Transaction rejected by user';
			} else {
				txError = err.shortMessage || err.message || 'Transaction failed';
			}
		} finally {
			submitting = false;
		}
	}

	// Need parseUnits
	import { parseUnits } from 'viem';
</script>

<svelte:head>
	<title>RFQ — BrokerClaw</title>
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
					<!-- Token You Want -->
					<div>
						<label for="rfq-token-want" class="block text-xs font-medium text-gray-400 mb-1.5">Token You Want</label>
						<div class="flex flex-wrap gap-1.5 mb-2">
							{#each quickTokens as token}
								<button
									type="button"
									class="px-2.5 py-1 text-xs font-display uppercase tracking-wider rounded-md transition-all {tokenWantAddress.toLowerCase() === token.address.toLowerCase() ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'bg-base-700/50 text-gray-400 hover:text-gray-200 border border-base-600/30'}"
									onclick={() => selectQuickToken('want', token)}
								>
									{token.symbol}
								</button>
							{/each}
						</div>
						<div class="flex gap-2">
							<input
								id="rfq-token-want"
								type="text"
								class="input-field flex-1 font-mono text-sm"
								placeholder="0x... token address"
								bind:value={tokenWantAddress}
								oninput={() => onWantAddressChange()}
							/>
							{#if tokenWantSymbol}
								<div class="flex items-center px-3 rounded-lg bg-neon-pink/10 border border-neon-pink/20">
									<span class="text-neon-pink font-display text-sm font-semibold">{tokenWantSymbol}</span>
								</div>
							{/if}
						</div>
						{#if tokenWantError}
							<p class="text-danger text-xs mt-1">{tokenWantError}</p>
						{/if}
						{#if tokenWantBalance}
							<p class="text-xs text-gray-500 mt-1">Balance: <span class="text-gray-400">{tokenWantBalance} {tokenWantSymbol}</span></p>
						{/if}
					</div>

					<!-- Amount -->
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

					<!-- Paying With -->
					<div>
						<label for="rfq-token-offer" class="block text-xs font-medium text-gray-400 mb-1.5">Paying With</label>
						<div class="flex flex-wrap gap-1.5 mb-2">
							{#each quickTokens as token}
								<button
									type="button"
									class="px-2.5 py-1 text-xs font-display uppercase tracking-wider rounded-md transition-all {tokenOfferAddress.toLowerCase() === token.address.toLowerCase() ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' : 'bg-base-700/50 text-gray-400 hover:text-gray-200 border border-base-600/30'}"
									onclick={() => selectQuickToken('offer', token)}
								>
									{token.symbol}
								</button>
							{/each}
						</div>
						<div class="flex gap-2">
							<input
								id="rfq-token-offer"
								type="text"
								class="input-field flex-1 font-mono text-sm"
								placeholder="0x... token address"
								bind:value={tokenOfferAddress}
								oninput={() => onOfferAddressChange()}
							/>
							{#if tokenOfferSymbol}
								<div class="flex items-center px-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
									<span class="text-neon-cyan font-display text-sm font-semibold">{tokenOfferSymbol}</span>
								</div>
							{/if}
						</div>
						{#if tokenOfferError}
							<p class="text-danger text-xs mt-1">{tokenOfferError}</p>
						{/if}
						{#if tokenOfferBalance}
							<p class="text-xs text-gray-500 mt-1">Balance: <span class="text-gray-400">{tokenOfferBalance} {tokenOfferSymbol}</span></p>
						{/if}
					</div>

					<!-- Expiry -->
					<div>
						<label for="rfq-expiry" class="block text-xs font-medium text-gray-400 mb-1.5">Expires In</label>
						<select id="rfq-expiry" class="select-field" bind:value={expiry}>
							<option value="1">1 hour</option>
							<option value="6">6 hours</option>
							<option value="24">24 hours</option>
							<option value="72">3 days</option>
						</select>
					</div>

					{#if txStatus}
						<div class="text-xs text-neon-cyan text-center flex items-center justify-center gap-2">
							{#if submitting}
								<svg class="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{/if}
							{txStatus}
						</div>
					{/if}

					{#if txHash}
						<div class="text-xs text-center">
							<a href="https://basescan.org/tx/{txHash}" target="_blank" class="text-neon-cyan hover:text-neon-pink transition-colors font-mono">
								View on BaseScan ↗
							</a>
						</div>
					{/if}

					{#if txError}
						<div class="text-xs text-red-400 text-center">{txError}</div>
					{/if}

					<button
						type="submit"
						class="w-full px-5 py-2.5 bg-secondary text-white font-semibold rounded-lg transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
						disabled={submitting || !tokenWantAddress || !tokenOfferAddress || !amountWant}
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
