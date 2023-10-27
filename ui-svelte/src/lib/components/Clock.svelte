<script lang="ts">
	import type { Model } from '$lib/lachies-house/Model';
	import { formatTime } from '$lib/time';
	export let model: Model | null;

	$: date = model?.date || new Date();
	$: timeS = formatTime(date);
</script>

<div class="flex flex-row content-center items-center w-full px-4">
	<div class="text-6xl lg:text-8xl px-3">{timeS}</div>
	<div class="flex flex-col text-2xl content-center px-3">
		<div class="border-b">
			{date.getDate()}
		</div>
		<div>{date.getMonth() + 1}</div>
	</div>
</div>
