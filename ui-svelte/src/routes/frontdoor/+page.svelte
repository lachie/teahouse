<script lang="ts">
	import { model, modelValue } from '$lib/stores/modelStore';
	import { doorbellRinging } from '$lib/stores/doorbell';
	import SceneButton from '$lib/components/SceneButton.svelte';
	import Card from './Card.svelte';
	import Sound from '$lib/components/Sound.svelte';
	import { DoorbellCancel, LeaveHouse } from '$lib/lachies-house/Msg';
	import MsgButton from '$lib/components/MsgButton.svelte';
	import { Moon, BellSlash, Bell } from 'svelte-hero-icons';
	import DayProgress from '$lib/components/DayProgress.svelte';
	import { fully } from '$lib/fullyKiosk';

	console.log('doorbellRinging', $doorbellRinging);

	$: if ($model && fully) {
		if ($doorbellRinging) {
			fully.stopScreensaver();
			fully.showToast('door bell!');
		}
		const [progress, dayNight] = $model.sunProgress;

		if (dayNight === 'night') {
			fully.setScreenBrightness(50);
		} else {
			fully.setScreenBrightness(50 + 50 * progress);
		}
	}
</script>

{#if $doorbellRinging}
	<Sound src="/audio/doorbell-1.mp3" />
{/if}

<div class="grid grid-cols-4 gap-4 mx-auto max-w-full p-4">
	<Card>
		<SceneButton room="playroom" />
	</Card>
	<Card>
		<SceneButton room="backroom" label="backroom" />
		<MsgButton tagger={LeaveHouse} icon={Moon} />
	</Card>
	<Card>
		<MsgButton
			tagger={DoorbellCancel}
			extraClass={$doorbellRinging ? 'bg-red-400' : undefined}
			icon={$doorbellRinging ? BellSlash : Bell}
		/>
	</Card>
	<Card>
		<DayProgress model={$model} />
	</Card>
</div>
