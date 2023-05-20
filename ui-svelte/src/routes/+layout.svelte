<script>
	import '../app.css';
</script>

<slot />

<style lang="postcss">
	:global(body) {
		@apply bg-zinc-700 text-zinc-100;
	}
</style>
