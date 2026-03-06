<script lang="ts">
	import OfferList from '$lib/components/OfferList.svelte';
	import CreateOfferForm from '$lib/components/CreateOfferForm.svelte';
</script>

<svelte:head>
	<title>Offers — BrokerClaw</title>
</svelte:head>

<div class="space-y-8 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold tracking-tight mb-2">OTC Offers</h1>
		<p class="text-gray-400">Browse open offers or create your own. All trades settle atomically on Base.</p>
	</div>

	<div class="grid lg:grid-cols-3 gap-8">
		<div class="lg:col-span-2">
			<OfferList showFilters={true} />
		</div>
		<div>
			<CreateOfferForm />
		</div>
	</div>
</div>
