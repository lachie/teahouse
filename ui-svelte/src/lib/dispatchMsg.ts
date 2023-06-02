import { apiBaseUrl } from './apiHost';
import type { Msg } from './lachies-house/Msg';

export async function dispatchMsg(msg: Msg, baseUrl = apiBaseUrl) {
	const url = `${baseUrl}/msg`;
	console.log('dispatching msg: ', msg, url);
	return fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(msg)
	});
}

export async function dispatchMsgTagger(tagger: (...args: any[]) => Msg, baseUrl = apiBaseUrl) {
	return async (...args: any[]) => {
		await dispatchMsg(tagger(...args), baseUrl);
	};
}

export function dispatchMsgTaggerSync<TMsg extends Msg>(
	tagger: (...args: any[]) => TMsg,
	baseUrl = apiBaseUrl
) {
	console.log('mk dispatchMsgTaggerSync');
	return (...args: any[]) => {
		console.log('dispatchMsgTaggerSync', args, tagger(...args));
		dispatchMsg(tagger(...args), baseUrl);
	};
}
