<script lang="ts">
	import type { Model } from '$lib/lachies-house/Model';
	import { formatTime } from '$lib/time';
	import { Sun, Moon, Icon } from 'svelte-hero-icons';

	export let model: Model | null;
	export let showTime = true;
	$: [prog, dayNight] = model?.sunProgress || [0, 'day'];
	$: date = model?.date || new Date();

	$: console.log('dayNight', dayNight, prog);

	$: icon = dayNight === 'day' ? Sun : Moon;
	$: left = `${Math.round(prog * 100)}%`;
	$: timeS = formatTime(date);
</script>

<div class="h-20 w-full">
	<div class="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
		<div class="px-4 w-full">
			<div class="relative h-8 w-8 -mx-4 text-white" style:left>
				<Icon src={icon} />
			</div>
		</div>
	</div>
	{#if showTime}
		<div class="px-4 w-full">
			<div class="relative h-8 w-8 -mx-4 text-s font-semibold text-gray-400 text-center" style:left>
				{timeS}
			</div>
		</div>
	{/if}
</div>
