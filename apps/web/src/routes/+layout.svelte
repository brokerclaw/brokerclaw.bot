<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Header />
	<main class="flex-1 mx-auto w-full max-w-7xl px-4 py-6">
		{@render children()}
	</main>
	<Footer />
</div>
