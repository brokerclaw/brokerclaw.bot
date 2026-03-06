<script lang="ts">
	import { page } from '$app/stores';
	import WalletConnect from './WalletConnect.svelte';

	const navItems = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/offers', label: 'Offers' },
		{ href: '/rfq', label: 'RFQ' },
		{ href: '/leaderboard', label: 'Leaderboard' },
		{ href: '/deals', label: 'Deals' }
	];

	let mobileMenuOpen = $state(false);

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<header class="sticky top-0 z-50 border-b border-base-600/50 bg-base-900/90 backdrop-blur-xl">
	<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
		<a href="/" class="flex items-center gap-3 group">
			<div class="relative">
				<img src="/brokerclaw.jpg" alt="BrokerClaw" class="h-10 w-10 rounded-lg object-cover ring-1 ring-neon-pink/30 group-hover:ring-neon-pink/60 transition-all duration-300" />
				<div class="absolute inset-0 rounded-lg bg-neon-pink/10 group-hover:bg-neon-pink/20 transition-all duration-300"></div>
			</div>
			<span class="font-display text-xl font-bold tracking-wider uppercase">
				<span class="text-neon-pink glow-text">Broker</span><span class="text-neon-cyan glow-text-cyan">Claw</span>
			</span>
		</a>

		<nav class="hidden md:flex items-center gap-1">
			{#each navItems as item}
				<a
					href={item.href}
					class={isActive(item.href, $page.url.pathname) ? 'nav-link-active' : 'nav-link'}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-3">
			<div class="hidden sm:block">
				<WalletConnect />
			</div>

			<button
				class="md:hidden p-2 text-gray-400 hover:text-neon-cyan transition-colors"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					{#if mobileMenuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-base-600/50 bg-base-900/95 backdrop-blur-xl px-4 py-3 animate-fade-in">
			<nav class="flex flex-col gap-1">
				{#each navItems as item}
					<a
						href={item.href}
						class={isActive(item.href, $page.url.pathname) ? 'nav-link-active' : 'nav-link'}
						onclick={() => (mobileMenuOpen = false)}
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<div class="mt-3 pt-3 border-t border-base-600/50 sm:hidden">
				<WalletConnect />
			</div>
		</div>
	{/if}
</header>
