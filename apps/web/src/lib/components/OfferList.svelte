<script lang="ts">
	import { onMount } from 'svelte';
	import { offers, loading, fetchOffers } from '$lib/stores/offers';
	import { wallet, walletClient } from '$lib/stores/wallet';
	import { publicClient } from '$lib/contracts/config';
	import { ESCROW_ABI, ERC20_ABI } from '$lib/contracts/abi';
	import { ADDRESSES } from '$lib/contracts/addresses';
	import { shortenAddress } from '$lib/utils/format';
	import { get } from 'svelte/store';
	import { parseUnits } from 'viem';

	let { limit = 0, showFilters = false }: { limit?: number; showFilters?: boolean } = $props();

	onMount(() => {
		if ($offers.length === 0) fetchOffers();
	});

	let statusFilter = $state(showFilters ? 'open' : 'all');
	let fillingId = $state('');
	let fillStatus = $state('');
	let fillError = $state('');
	let cancellingId = $state('');
	let cancelStatus = $state('');
	let cancelError = $state('');

	const filteredOffers = $derived(
		$offers
			.filter((o) => {
				if (statusFilter !== 'all' && o.status !== statusFilter) return false;
				return true;
			})
			.sort((a, b) => Number(b.id) - Number(a.id))
			.slice(0, limit > 0 ? limit : undefined)
	);

	const now = $derived(Math.floor(Date.now() / 1000));

	function isExpired(expiresAt: number): boolean {
		return expiresAt < Math.floor(Date.now() / 1000);
	}

	function statusLabel(offer: any): string {
		if (offer.status === 'open' && isExpired(offer.expiresAt)) return 'expired';
		return offer.status;
	}

	function statusClass(status: string): string {
		switch (status) {
			case 'open': return 'text-neon-green';
			case 'filled': return 'text-neon-cyan';
			case 'cancelled': return 'text-red-400';
			case 'expired': return 'text-gray-500';
			case 'countered': return 'text-neon-yellow';
			default: return 'text-gray-500';
		}
	}

	function timeLeft(expiresAt: number): string {
		const diff = expiresAt - Math.floor(Date.now() / 1000);
		if (diff <= 0) return 'Expired';
		if (diff < 3600) return `${Math.floor(diff / 60)}m`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
		return `${Math.floor(diff / 86400)}d`;
	}

	async function fillOffer(offer: any) {
		if (!$wallet.connected || !$wallet.address) return;
		const client = get(walletClient);
		if (!client) return;

		fillingId = offer.id;
		fillStatus = '';
		fillError = '';

		try {
			const onChainOffer = await publicClient.readContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'getOffer',
				args: [BigInt(offer.id)]
			});

			const isETH = onChainOffer.tokenB.toLowerCase() === '0x0000000000000000000000000000000000000000';

			if (!isETH) {
				fillStatus = 'Checking allowance...';
				const currentAllowance = await publicClient.readContract({
					address: onChainOffer.tokenB,
					abi: ERC20_ABI,
					functionName: 'allowance',
					args: [$wallet.address as `0x${string}`, ADDRESSES.ESCROW]
				});

				if (currentAllowance < onChainOffer.amountB) {
					fillStatus = 'Approving token...';
					const approveTx = await client.writeContract({
						address: onChainOffer.tokenB,
						abi: ERC20_ABI,
						functionName: 'approve',
						args: [ADDRESSES.ESCROW, onChainOffer.amountB],
						chain: null,
						account: $wallet.address as `0x${string}`
					});
					fillStatus = 'Waiting for approval...';
					await publicClient.waitForTransactionReceipt({ hash: approveTx });
				}
			}

			fillStatus = 'Filling offer...';
			const hash = await client.writeContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'fillOffer',
				args: [BigInt(offer.id)],
				value: isETH ? onChainOffer.amountB : 0n,
				chain: null,
				account: $wallet.address as `0x${string}`
			});

			fillStatus = 'Confirming...';
			await publicClient.waitForTransactionReceipt({ hash });
			fillStatus = 'Filled! ✅';

			// Refresh
			await fetchOffers();
		} catch (err: any) {
			console.error('Fill error:', err);
			if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
				fillError = 'Rejected';
			} else {
				fillError = err.shortMessage || 'Failed';
			}
		} finally {
			setTimeout(() => { fillingId = ''; fillStatus = ''; fillError = ''; }, 3000);
		}
	}

	async function cancelOffer(offer: any) {
		if (!$wallet.connected || !$wallet.address) return;
		const client = get(walletClient);
		if (!client) return;

		cancellingId = offer.id;
		cancelStatus = '';
		cancelError = '';

		try {
			cancelStatus = 'Cancelling...';
			const hash = await client.writeContract({
				address: ADDRESSES.ESCROW,
				abi: ESCROW_ABI,
				functionName: 'cancelOffer',
				args: [BigInt(offer.id)],
				chain: null,
				account: $wallet.address as `0x${string}`
			});

			cancelStatus = 'Confirming...';
			await publicClient.waitForTransactionReceipt({ hash });
			cancelStatus = 'Cancelled ✅';
			await fetchOffers();
		} catch (err: any) {
			console.error('Cancel error:', err);
			if (err.message?.includes('User rejected') || err.message?.includes('User denied')) {
				cancelError = 'Rejected';
			} else {
				cancelError = err.shortMessage || 'Failed';
			}
		} finally {
			setTimeout(() => { cancellingId = ''; cancelStatus = ''; cancelError = ''; }, 3000);
		}
	}
</script>

{#if showFilters}
	<div class="flex flex-wrap items-center gap-3 mb-4">
		<div class="flex gap-1.5">
			{#each ['all', 'open', 'filled', 'cancelled'] as s}
				<button
					class="px-3 py-1.5 text-xs font-display uppercase tracking-wider rounded-md transition-all {statusFilter === s ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' : 'bg-base-700/50 text-gray-500 hover:text-gray-300 border border-base-600/30'}"
					onclick={() => statusFilter = s}
				>
					{s}
				</button>
			{/each}
		</div>
		<button
			class="ml-auto px-3 py-1.5 text-xs font-display uppercase tracking-wider text-gray-500 hover:text-neon-cyan transition-colors"
			onclick={() => fetchOffers()}
		>
			↻ Refresh
		</button>
	</div>
{/if}

{#if $loading}
	<div class="card text-center py-12">
		<div class="text-4xl mb-3 animate-pulse-glow">⏳</div>
		<p class="text-gray-400 text-lg">Loading from Base...</p>
	</div>
{:else if filteredOffers.length === 0}
	<div class="card text-center py-12">
		<div class="text-4xl mb-3">📋</div>
		<p class="text-gray-400 text-lg">No offers yet</p>
		<p class="text-gray-500 text-sm mt-1">Be the first to create an OTC offer on BrokerClaw</p>
	</div>
{:else}
	<!-- Desktop table -->
	<div class="hidden md:block overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-base-600/50">
					<th class="text-left py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">#</th>
					<th class="text-left py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">Selling</th>
					<th class="text-center py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500"></th>
					<th class="text-left py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">Buying</th>
					<th class="text-left py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">Maker</th>
					<th class="text-left py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">Status</th>
					<th class="text-left py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">Expires</th>
					<th class="text-right py-3 px-3 font-display text-xs uppercase tracking-wider text-gray-500">Action</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredOffers as offer (offer.id)}
					{@const status = statusLabel(offer)}
					<tr class="border-b border-base-700/30 hover:bg-base-800/30 transition-colors">
						<td class="py-3 px-3 font-mono text-gray-500 text-xs">{offer.id}</td>
						<td class="py-3 px-3">
							<span class="text-gray-100 font-semibold">{offer.amountSell}</span>
							<span class="text-neon-pink font-display text-xs uppercase ml-1">{offer.tokenSell}</span>
						</td>
						<td class="py-3 px-3 text-center text-gray-600">→</td>
						<td class="py-3 px-3">
							<span class="text-gray-100 font-semibold">{offer.amountBuy}</span>
							<span class="text-neon-cyan font-display text-xs uppercase ml-1">{offer.tokenBuy}</span>
						</td>
						<td class="py-3 px-3">
							<a href="https://basescan.org/address/{offer.maker}" target="_blank" class="font-mono text-xs text-gray-400 hover:text-neon-cyan transition-colors">
								{shortenAddress(offer.maker)}
							</a>
						</td>
						<td class="py-3 px-3">
							<span class="font-display text-xs uppercase tracking-wider {statusClass(status)}">{status}</span>
						</td>
						<td class="py-3 px-3 text-xs text-gray-500">{timeLeft(offer.expiresAt)}</td>
						<td class="py-3 px-3 text-right">
							{#if status === 'open' && !isExpired(offer.expiresAt) && $wallet.connected && offer.maker.toLowerCase() !== $wallet.address?.toLowerCase()}
								{#if fillingId === offer.id}
									<span class="text-xs text-neon-cyan">{fillStatus || fillError}</span>
								{:else}
									<button
										class="px-3 py-1 text-xs font-display uppercase tracking-wider rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-all"
										onclick={() => fillOffer(offer)}
									>Fill</button>
								{/if}
							{:else if status === 'open' && !isExpired(offer.expiresAt) && $wallet.connected && offer.maker.toLowerCase() === $wallet.address?.toLowerCase()}
								{#if cancellingId === offer.id}
									<span class="text-xs {cancelError ? 'text-red-400' : 'text-neon-orange'}">{cancelStatus || cancelError}</span>
								{:else}
									<button
										class="px-3 py-1 text-xs font-display uppercase tracking-wider rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
										onclick={() => cancelOffer(offer)}
									>Cancel</button>
								{/if}
							{:else if status === 'filled'}
								<a href="https://basescan.org/address/{offer.filledBy}" target="_blank" class="font-mono text-xs text-gray-500 hover:text-neon-cyan transition-colors">
									{shortenAddress(offer.filledBy || '')}
								</a>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Mobile cards -->
	<div class="md:hidden space-y-3">
		{#each filteredOffers as offer (offer.id)}
			{@const status = statusLabel(offer)}
			<div class="card p-4">
				<div class="flex items-center justify-between mb-3">
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs text-gray-500">#{offer.id}</span>
						<span class="font-display text-xs uppercase tracking-wider {statusClass(status)}">{status}</span>
					</div>
					<span class="text-xs text-gray-500">{timeLeft(offer.expiresAt)}</span>
				</div>

				<div class="flex items-center gap-3 mb-3">
					<div class="flex-1 text-center p-2.5 bg-base-900 rounded-lg">
						<div class="text-sm font-semibold text-gray-100">{offer.amountSell}</div>
						<div class="text-xs text-neon-pink font-display uppercase">{offer.tokenSell}</div>
					</div>
					<span class="text-gray-600">→</span>
					<div class="flex-1 text-center p-2.5 bg-base-900 rounded-lg">
						<div class="text-sm font-semibold text-gray-100">{offer.amountBuy}</div>
						<div class="text-xs text-neon-cyan font-display uppercase">{offer.tokenBuy}</div>
					</div>
				</div>

				<div class="flex items-center justify-between text-xs">
					<a href="https://basescan.org/address/{offer.maker}" target="_blank" class="font-mono text-gray-400 hover:text-neon-cyan">
						{shortenAddress(offer.maker)}
					</a>
					{#if status === 'open' && !isExpired(offer.expiresAt) && $wallet.connected && offer.maker.toLowerCase() !== $wallet.address?.toLowerCase()}
						{#if fillingId === offer.id}
							<span class="text-xs text-neon-cyan">{fillStatus || fillError}</span>
						{:else}
							<button
								class="px-3 py-1 text-xs font-display uppercase tracking-wider rounded-md bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-all"
								onclick={() => fillOffer(offer)}
							>Fill</button>
						{/if}
					{:else if status === 'open' && !isExpired(offer.expiresAt) && $wallet.connected && offer.maker.toLowerCase() === $wallet.address?.toLowerCase()}
						{#if cancellingId === offer.id}
							<span class="text-xs {cancelError ? 'text-red-400' : 'text-neon-orange'}">{cancelStatus || cancelError}</span>
						{:else}
							<button
								class="px-3 py-1 text-xs font-display uppercase tracking-wider rounded-md bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
								onclick={() => cancelOffer(offer)}
							>Cancel</button>
						{/if}
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
