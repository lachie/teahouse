import { writable, derived, type Readable } from 'svelte/store';
import { ModelT, type Model, type RoomKey, type RoomModel } from './lachies-house/Model';
import { pipe } from 'fp-ts/lib/function';
import { type Json, parse } from 'fp-ts/Json';
import { map, mapLeft, match } from 'fp-ts/Either';
import type t from 'io-ts';
import { failure } from 'io-ts/PathReporter';
import { page } from '$app/stores';
import { getOrElse } from 'fp-ts/lib/Either';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import * as immutable from 'object-path-immutable';

let hostname = 'http://10.28.10.28'; // $page.url.hostname
const port = 3030;
let url = `${hostname}:${port}/model-updates`;

type ValidModel = { success: false; parseError: string } | { success: true; model: Model };

const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join('\n'));

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

export const validModel: Readable<ValidModel> = derived(rawModel, ($rawModel) => {
	return pipe(
		$rawModel,
		(x: any) => (console.log(x), x),
		ModelT.decode,
		mapErrors,
		match<string, Model, ValidModel>(
			(parseError) => {
				console.error(`Could not decode model: ${parseError}`);
				return { success: false, parseError };
			},
			(model) => {
				console.log('model: ', model);
				return { success: true, model };
			}
		)
	);
});

export const model: Readable<Model | null> = derived(validModel, ($validModel) => {
	if ($validModel.success) {
		return $validModel.model;
	}
	return null;
});

export const modelValue = (key: string | null) =>
	derived(validModel, ($validModel) => {
		if (key === null || !$validModel.success) {
			return null;
		}
		return immutable.get($validModel.model, key);
	});

export const roomScene = (roomKey: string | null) =>
	derived(validModel, ($validModel) => {
		if (roomKey === null || !$validModel.success) {
			return null;
		}
		const room = ($validModel.model.rooms as Record<string, RoomModel>)[roomKey];
		return room?.scene;
	});
