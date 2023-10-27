<script lang="ts">
	import ControlButton from './ControlButton.svelte';
	import type { IconSource } from 'svelte-hero-icons';
	import { dispatchMsgTaggerSync } from '$lib/dispatchMsg';
	import type { Msg } from '$lib/lachies-house/Msg';

	export let icon: IconSource;
	// export let extraClass: string = undefined;
	export let extraClass: string | undefined = undefined;
	export let tagger: () => Msg;
	export let size: 'normal' | 'large' = 'normal';

	extraClass = extraClass || 'bg-zinc-500';
</script>

<ControlButton {size} {icon} {extraClass} on:click={dispatchMsgTaggerSync(tagger)} />
