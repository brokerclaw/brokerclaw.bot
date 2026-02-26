<script lang="ts">
	let { score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' } = $props();

	const tier = $derived(
		score >= 95 ? { label: 'Diamond', color: 'text-cyan-300', bg: 'bg-cyan-500/15', icon: '💎' }
		: score >= 85 ? { label: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-500/15', icon: '🥇' }
		: score >= 70 ? { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-400/15', icon: '🥈' }
		: score >= 50 ? { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/15', icon: '🥉' }
		: { label: 'New', color: 'text-gray-500', bg: 'bg-gray-600/15', icon: '🆕' }
	);

	const sizeClasses: Record<string, string> = {
		sm: 'text-xs px-2 py-0.5',
		md: 'text-sm px-2.5 py-1',
		lg: 'text-base px-3 py-1.5'
	};
</script>

<span class="inline-flex items-center gap-1 rounded-full font-medium {tier.bg} {tier.color} {sizeClasses[size]}">
	<span>{tier.icon}</span>
	<span>{score}</span>
</span>
