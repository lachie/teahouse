<script lang="ts">
	import { dispatchMsgTaggerSync } from '$lib/dispatchMsg';
	import type { SetRoomScene } from '$lib/lachies-house/Msg';
	import { roomScene } from '$lib/modelStore';
	import { LightBulb } from 'svelte-hero-icons';
	import ControlButton from './ControlButton.svelte';

	export let label: string | undefined = undefined;
	export let room: string;
	const currentScene = roomScene(room);
	$: off = $currentScene === 'off';
	$: nextScene = off ? 'bright' : 'off';

	const setScene = (scene: string) =>
		dispatchMsgTaggerSync<SetRoomScene>(() => ({ type: 'set-scene', room, scene }));
</script>

<ControlButton
	on:click={setScene(nextScene)}
	icon={LightBulb}
	{label}
	extraClass={off ? 'bg-zinc-500' : 'bg-amber-300'}
/>
