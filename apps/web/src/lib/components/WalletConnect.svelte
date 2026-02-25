<script lang="ts">
	import { wallet, shortAddress, connectWallet, disconnectWallet } from '$lib/stores/wallet';
	import { formatAmount } from '$lib/utils/format';

	let showDropdown = $state(false);
</script>

{#if $wallet.connected}
	<div class="relative">
		<button
			class="flex items-center gap-2 px-3 py-2 bg-base-700 border border-base-500 rounded-lg hover:bg-base-600 transition-all text-sm"
			onclick={() => (showDropdown = !showDropdown)}
		>
			<div class="w-2 h-2 rounded-full bg-accent"></div>
			<span class="font-mono text-gray-200">{$shortAddress}</span>
			<span class="text-gray-500 hidden sm:inline">{formatAmount($wallet.balance, 4)} ETH</span>
		</button>

		{#if showDropdown}
			<div class="absolute right-0 top-full mt-2 w-56 bg-base-800 border border-base-600 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-50">
				<div class="px-4 py-3 border-b border-base-600">
					<p class="text-xs text-gray-500">Connected to Base</p>
					<p class="font-mono text-sm text-gray-200 mt-0.5">{$shortAddress}</p>
					<p class="text-sm text-gray-400 mt-1">{formatAmount($wallet.balance, 4)} ETH</p>
				</div>
				<div class="p-2">
					<a
						href={`https://basescan.org/address/${$wallet.address}`}
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-100 hover:bg-base-700 rounded-lg transition-colors w-full"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
						View on BaseScan
					</a>
					<button
						class="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors w-full text-left"
						onclick={() => { disconnectWallet(); showDropdown = false; }}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						Disconnect
					</button>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<button
		class="btn-primary text-sm"
		onclick={connectWallet}
		disabled={$wallet.connecting}
	>
		{#if $wallet.connecting}
			<span class="flex items-center gap-2">
				<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Connecting...
			</span>
		{:else}
			Connect Wallet
		{/if}
	</button>
{/if}

{#if $wallet.error}
	<div class="fixed bottom-4 right-4 bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-xl max-w-sm animate-fade-in z-50">
		{$wallet.error}
	</div>
{/if}
