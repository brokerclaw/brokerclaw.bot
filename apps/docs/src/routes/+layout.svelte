<script lang="ts">
	import '../app.css';
	import { inject } from '@vercel/analytics';
	import { page } from '$app/stores';

	inject();

	const nav = [
		{ href: '/', label: 'Overview' },
		{ href: '/getting-started', label: 'Getting Started' },
		{ href: '/contracts', label: 'Smart Contracts' },
		{ href: '/sdk', label: 'SDK' },
		{ href: '/mcp', label: 'MCP Server' },
		{ href: '/token', label: '$BROKR Token' },
		{ href: '/faq', label: 'FAQ' }
	];

	let mobileOpen = $state(false);

	function isActive(href: string, pathname: string): boolean {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<!-- Header -->
	<header class="sticky top-0 z-50 border-b border-base-600/50 bg-base-900/90 backdrop-blur-xl">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
			<a href="/" class="flex items-center gap-3 group">
				<img src="/brokerclaw.jpg" alt="BrokerClaw" class="h-8 w-8 rounded-lg object-cover ring-1 ring-neon-pink/30" />
				<span class="font-display text-lg font-bold tracking-wider uppercase">
					<span class="text-neon-pink">Broker</span><span class="text-neon-cyan">Claw</span>
					<span class="text-gray-500 text-sm ml-1">Docs</span>
				</span>
			</a>

			<div class="flex items-center gap-4">
				<a href="https://brokerclaw.bot" class="hidden sm:block font-display text-sm uppercase tracking-wider text-gray-500 hover:text-neon-cyan transition-colors">App ↗</a>
				<a href="https://github.com/brokerclaw" target="_blank" class="hidden sm:block font-display text-sm uppercase tracking-wider text-gray-500 hover:text-neon-cyan transition-colors">GitHub ↗</a>
				<button class="md:hidden p-2 text-gray-400 hover:text-neon-cyan" onclick={() => mobileOpen = !mobileOpen}>
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						{#if mobileOpen}
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
						{/if}
					</svg>
				</button>
			</div>
		</div>
	</header>

	<div class="flex flex-1 mx-auto max-w-7xl w-full">
		<!-- Sidebar -->
		<aside class="hidden md:block w-56 flex-shrink-0 border-r border-base-600/30 p-4">
			<nav class="sticky top-20 space-y-1">
				{#each nav as item}
					<a
						href={item.href}
						class="block px-3 py-2 text-sm font-display uppercase tracking-wider rounded-lg transition-all {isActive(item.href, $page.url.pathname) ? 'text-neon-pink bg-neon-pink/10' : 'text-gray-500 hover:text-gray-300 hover:bg-base-800/50'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>
		</aside>

		<!-- Mobile nav -->
		{#if mobileOpen}
			<div class="md:hidden fixed inset-0 z-40 bg-base-900/95 backdrop-blur-xl pt-16 px-4">
				<nav class="space-y-1">
					{#each nav as item}
						<a
							href={item.href}
							class="block px-3 py-3 text-sm font-display uppercase tracking-wider rounded-lg {isActive(item.href, $page.url.pathname) ? 'text-neon-pink bg-neon-pink/10' : 'text-gray-400'}"
							onclick={() => mobileOpen = false}
						>
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
		{/if}

		<!-- Content -->
		<main class="flex-1 px-6 py-8 md:px-10 max-w-none prose-invert">
			{@render children()}
		</main>
	</div>
</div>
