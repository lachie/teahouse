<script lang="ts">
	import MsgButton from '$lib/components/MsgButton.svelte';
	import { model } from '$lib/stores/modelStore';
	import { DoorbellCancel, DoorbellTrigger, LeaveHouse } from '$lib/lachies-house/Msg';
	import { Bell, BellSlash } from 'svelte-hero-icons';
	import { doorbellRinging } from '$lib/stores/doorbell';
</script>

<div class="grid grid-cols-4 gap-4 mx-auto max-w-full p-4">
	{#if $doorbellRinging}
		<MsgButton tagger={DoorbellCancel} icon={BellSlash} />
	{:else}
		<MsgButton tagger={DoorbellTrigger} icon={Bell} />
	{/if}
</div>
<pre>
    {JSON.stringify($model, null, 2)}
</pre>
