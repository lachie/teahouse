import { writable, derived, type Readable } from 'svelte/store';
import { ModelT, type Model, type RoomModel } from '../lachies-house/Model';
import { browser } from '$app/environment';
import * as immutable from 'object-path-immutable';
import type { z } from 'zod';

let hostname = 'http://10.28.10.28'; // $page.url.hostname
const port = 3030;
let url = `${hostname}:${port}/model-updates`;

type UnknownRecord = Record<string, unknown>
type ValidModel = z.SafeParseReturnType<UnknownRecord, Model>

const rawModel = writable<Record<string, unknown>>({}, (set) => {
	if (browser) {
		const evtSource = new EventSource(url);
		evtSource.onmessage = function (event) {
			//console.log(event);
			var dataobj = JSON.parse(event.data);
			set(dataobj);
		};

		return () => (evtSource.onmessage = null);
	}
});

export const validModel: Readable<ValidModel> = derived(rawModel, ($rawModel) => ModelT.safeParse($rawModel))
export const model: Readable<Model | null> = derived(validModel, ($validModel) => {
	if ($validModel.success) {
		return $validModel.data;
	}
	return null;
});

export const modelValue = (key: string | null) =>
	derived(validModel, ($validModel) => {
		if (key === null || !$validModel.success) {
			return null;
		}
		return immutable.get($validModel.data, key);
	});

export const roomScene = (roomKey: string | null) =>
	derived(validModel, ($validModel) => {
		if (roomKey === null || !$validModel.success) {
			return null;
		}
		const room = ($validModel.data.rooms as Record<string, RoomModel>)[roomKey];
		return room?.scene;
	});
