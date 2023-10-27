<script lang="ts">
	import { model, modelValue } from '$lib/stores/modelStore';
	import { doorbellRinging } from '$lib/stores/doorbell';
	import SceneButton from '$lib/components/SceneButton.svelte';
	import Card from './Card.svelte';
	import Sound from '$lib/components/Sound.svelte';
	import { DoorbellCancel, LeaveHouse } from '$lib/lachies-house/Msg';
	import MsgButton from '$lib/components/MsgButton.svelte';
	import { Moon, BellSlash, Bell, HandRaised } from 'svelte-hero-icons';
	import DayProgress from '$lib/components/DayProgress.svelte';
	import { fully } from '$lib/fullyKiosk';
	import Clock from '$lib/components/Clock.svelte';

	const sawUnit = (v: number) => (v <= 0.5 ? v * 2 : (1 - v) * 2);
	const normalise =
		(min: number, max: number) =>
		(v: number): number =>
			Math.sign(max - min) * v * Math.abs(max - min) + min;
	const sawNorm = (min: number, max: number) => (v: number) => normalise(min, max)(sawUnit(v));
	const dayBrightness = sawNorm(50, 100);

	$: if ($model && fully) {
		if ($doorbellRinging) {
			fully.stopScreensaver();
			fully.showToast('door bell!');
		}
		const [progress, dayNight] = $model.sunProgress;

		if (dayNight === 'night') {
			fully.setScreenBrightness(50);
		} else {
			fully.setScreenBrightness(dayBrightness(progress));
		}
	}
</script>

{#if $doorbellRinging}
	<Sound src="/audio/doorbell-1.mp3" />
{/if}

<div class="grid lg:grid-cols-4 grid-cols-2 gap-4 mx-auto max-w-full p-4">
	<Card>
		<SceneButton room="playroom" />
	</Card>
	<Card>
		<SceneButton room="backroom" label="backroom" />
		<MsgButton tagger={LeaveHouse} icon={HandRaised} />
	</Card>
	<Card>
		<MsgButton
			tagger={DoorbellCancel}
			extraClass={$doorbellRinging ? 'bg-red-400' : undefined}
			icon={$doorbellRinging ? BellSlash : Bell}
			size={$doorbellRinging ? 'large' : 'normal'}
		/>
	</Card>
	<Card>
		<div class="flex flex-col w-full">
			<DayProgress model={$model} showTime={false} />
			<Clock model={$model} />
		</div>
	</Card>
</div>
