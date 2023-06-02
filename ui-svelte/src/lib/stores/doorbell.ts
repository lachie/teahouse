
import { derived } from 'svelte/store'
import { model } from '../modelStore'
import { doorbellRinging as isDoorbellRinging } from '$lib/lachies-house/Model'

export const doorbellRinging = derived(model, $model => $model && isDoorbellRinging($model))