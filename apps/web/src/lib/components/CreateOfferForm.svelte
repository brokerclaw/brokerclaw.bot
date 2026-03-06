<script lang="ts">
	import { wallet, walletClient } from '$lib/stores/wallet';
	import { connectWallet } from '$lib/stores/wallet';
	import { publicClient } from '$lib/contracts/config';
	import { ERC20_ABI, ESCROW_ABI } from '$lib/contracts/abi';
	import { ADDRESSES } from '$lib/contracts/addresses';
	import { parseUnits } from 'viem';
	import { get } from 'svelte/store';

	const ETH_SENTINEL = '0x0000000000000000000000000000000000000000';

	let tokenSellAddress = $state('');
	let tokenBuyAddress = $state('');
	let amountSell = $state('');
	let amountBuy = $state('');
	let expiry = $state('24');
	let submitting = $state(false);
	let txStatus = $state('');
	let txHash = $state('');
	let txError = $state('');

	let tokenSellSymbol = $state('');
	let tokenBuySymbol = $state('');
	let tokenSellError = $state('');
	let tokenBuyError = $state('');
	let tokenSellBalance = $state('');
	let tokenBuyBalance = $state('');
	let tokenSellDecimals = $state(18);
	let tokenBuyDecimals = $state(18);

	// Common tokens for quick select
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
		} catch {
			return '';
		}
	}

	async function onSellAddressChange() {
		tokenSellError = '';
		tokenSellSymbol = '';
		tokenSellBalance = '';
		if (tokenSellAddress.length === 42 || tokenSellAddress === '0x0000000000000000000000000000000000000000') {
			const sym = await resolveToken(tokenSellAddress);
			if (sym) {
				tokenSellSymbol = sym;
				const { balance, decimals } = await fetchBalance(tokenSellAddress);
				tokenSellBalance = balance;
				tokenSellDecimals = decimals;
			} else {
				tokenSellError = 'Token not found';
			}
		}
	}

	async function onBuyAddressChange() {
		tokenBuyError = '';
		tokenBuySymbol = '';
		tokenBuyBalance = '';
		if (tokenBuyAddress.length === 42 || tokenBuyAddress === '0x0000000000000000000000000000000000000000') {
			const sym = await resolveToken(tokenBuyAddress);
			if (sym) {
				tokenBuySymbol = sym;
				const { balance, decimals } = await fetchBalance(tokenBuyAddress);
				tokenBuyBalance = balance;
				tokenBuyDecimals = decimals;
			} else {
				tokenBuyError = 'Token not found';
			}
		}
	}

	async function selectQuickToken(side: 'sell' | 'buy', token: { symbol: string; address: string }) {
		if (side === 'sell') {
			tokenSellAddress = token.address;
			tokenSellSymbol = token.symbol;
			tokenSellError = '';
			const { balance, decimals } = await fetchBalance(token.address);
			tokenSellBalance = balance;
			tokenSellDecimals = decimals;
		} else {
			tokenBuyAddress = token.address;
			tokenBuySymbol = token.symbol;
			tokenBuyError = '';
			const { balance, decimals } = await fetchBalance(token.address);
			tokenBuyBalance = balance;
			tokenBuyDecimals = decimals;
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
			const isETH = tokenSellAddress.toLowerCase() === ETH_SENTINEL;

			// Always fetch decimals fresh before submitting
			txStatus = 'Resolving token decimals...';
			const [decA, decB] = await Promise.all([
				isETH ? Promise.resolve(18) : publicClient.readContract({
					address: tokenSellAddress as `0x${string}`,
					abi: ERC20_ABI,
					functionName: 'decimals'
				}).then(Number).catch(() => 18),
				tokenBuyAddress.toLowerCase() === ETH_SENTINEL ? Promise.resolve(18) : publicClient.readContract({
					address: tokenBuyAddress as `0x${string}`,
					abi: ERC20_ABI,
					functionName: 'decimals'
				}).then(Number).catch(() => 18)
			]);

			const amountAWei = parseUnits(String(amountSell), decA);
			const amountBWei = parseUnits(String(amountBuy), decB);
			const expiryTimestamp = BigInt(Math.floor(Date.now() / 1000) + parseInt(expiry) * 3600);

			// Step 1: Approve ERC-20 (skip for ETH)
			if (!isETH) {
				txStatus = 'Checking allowance...';
				const currentAllowance = await publicClient.readContract({
					address: tokenSellAddress as `0x${string}`,
					abi: ERC20_ABI,
					functionName: 'allowance',
					args: [$wallet.address as `0x${string}`, ADDRESSES.ESCROW]
				});

				if (currentAllowance < amountAWei) {
					txStatus = 'Approving token transfer...';
					const approveTx = await client.writeContract({
						address: tokenSellAddress as `0x${string}`,
						abi: ERC20_ABI,
						functionName: 'approve',
						args: [ADDRESSES.ESCROW, amountAWei],
						chain: null,
						account: $wallet.address as `0x${string}`
					});
					txStatus = 'Waiting for approval confirmation...';
					await publicClient.waitForTransactionReceipt({ hash: approveTx });
				}
			}

			// Step 2: Create the offer
			txStatus = 'Creating offer...';
			const hash = await client.writeContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'createOffer',
				args: [
					tokenSellAddress as `0x${string}`,
					amountAWei,
					tokenBuyAddress as `0x${string}`,
					amountBWei,
					expiryTimestamp
				],
				value: isETH ? amountAWei : 0n,
				chain: null,
				account: $wallet.address as `0x${string}`
			});

			txHash = hash;
			txStatus = 'Waiting for confirmation...';
			await publicClient.waitForTransactionReceipt({ hash });

			txStatus = 'Offer created!';
			amountSell = '';
			amountBuy = '';

			// Refresh balances
			if (tokenSellAddress) {
				const { balance } = await fetchBalance(tokenSellAddress);
				tokenSellBalance = balance;
			}
		} catch (err: any) {
			console.error('Create offer error:', err);
			if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
				txError = 'Transaction rejected by user';
			} else if (err.message?.includes('insufficient funds')) {
				txError = 'Insufficient funds for gas + value';
			} else {
				txError = err.shortMessage || err.message || 'Transaction failed';
			}
		} finally {
			submitting = false;
		}
	}

	const rate = $derived(
		amountSell && amountBuy && parseFloat(amountSell) > 0
			? (parseFloat(amountBuy) / parseFloat(amountSell)).toFixed(6)
			: null
	);

	const sellLabel = $derived(tokenSellSymbol || 'Token');
	const buyLabel = $derived(tokenBuySymbol || 'Token');

	const insufficientBalance = $derived(
		tokenSellBalance && amountSell
			? parseFloat(String(amountSell)) > parseFloat(tokenSellBalance)
			: false
	);
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
			<div class="relative mt-2">
				<input
					type="number"
					class="input-field pr-16"
					placeholder="Amount"
					bind:value={amountSell}
					step="any"
					min="0"
				/>
				{#if tokenSellBalance}
					<button
						type="button"
						class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-display uppercase tracking-wider text-neon-pink hover:text-neon-pink/80 transition-colors"
						onclick={() => { amountSell = tokenSellBalance; }}
					>MAX</button>
				{/if}
			</div>
			{#if tokenSellBalance}
				<p class="text-xs mt-1 {insufficientBalance ? 'text-red-400' : 'text-gray-500'}">
					Balance: <span class="{insufficientBalance ? 'text-red-400' : 'text-gray-400'}">{tokenSellBalance} {tokenSellSymbol}</span>
					{#if insufficientBalance}
						<span class="ml-1">— Insufficient balance</span>
					{/if}
				</p>
			{/if}
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
					const tb = tokenSellBalance; tokenSellBalance = tokenBuyBalance; tokenBuyBalance = tb;
					const td = tokenSellDecimals; tokenSellDecimals = tokenBuyDecimals; tokenBuyDecimals = td;
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
			{#if tokenBuyBalance}
				<p class="text-xs text-gray-500 mt-1">Balance: <span class="text-gray-400">{tokenBuyBalance} {tokenBuySymbol}</span></p>
			{/if}
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
			class="btn-primary w-full"
			disabled={submitting || !tokenSellAddress || !tokenBuyAddress || !amountSell || !amountBuy || insufficientBalance}
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
