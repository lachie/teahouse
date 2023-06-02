<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Icon, type IconSource } from 'svelte-hero-icons';

	export let icon: IconSource;
	export let extraClass: string = 'bg-zinc-500';
	export let label: string | undefined = undefined;

	const dispatcher = createEventDispatcher();
</script>

<button on:click={() => dispatcher('click')} class="relative mx-4">
	<div class="rounded p-3 w-12 h-12 {extraClass} mx-auto content-center align-top">
		<Icon src={icon} class="h-6 w-6" />
	</div>
	{#if label}
		<div class="absolute uppercase text-xs font-normal -ml-2 mt-1 text-zinc-400">{label}</div>
	{/if}
</button>
