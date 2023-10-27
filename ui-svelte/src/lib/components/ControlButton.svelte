<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Icon, type IconSource } from 'svelte-hero-icons';

	export let icon: IconSource;
	export let extraClass: string = 'bg-zinc-500';
	export let label: string | undefined = undefined;
	export let size: 'normal' | 'large' = 'normal';

	const dispatcher = createEventDispatcher();
</script>

<button on:click={() => dispatcher('click')} class="relative mx-4 text-center">
	{#if size === 'large'}
		<div class="rounded-xl p-3 w-28 h-28 {extraClass ?? ''} mx-auto content-center align-top">
			<Icon src={icon} class="h-18 w-18" />
		</div>
	{:else}
		<div class="rounded-xl p-5 w-24 h-24 {extraClass ?? ''} mx-auto content-center align-top">
			<Icon src={icon} class="h-14 w-14" />
		</div>
	{/if}
	{#if label}
		<div class="absolute uppercase text-xs font-normal text-center w-full mt-1 text-zinc-400">
			{label}
		</div>
	{/if}
</button>
