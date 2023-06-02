<script lang="ts">
	import { browser } from '$app/environment';
	export let src: string;
</script>

{#if browser}
	<audio {src} id="doorbell" preload="auto" autoplay loop />
{/if}
