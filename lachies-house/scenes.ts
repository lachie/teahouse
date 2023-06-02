import { Model, RoomModel } from "./Model"

type SceneSpec = string | string[]

export type DevicePayload = Record<string, unknown>
type Payload<T extends DevicePayload> = T | ((progress: number) => T)
type MapToPayload<T extends DevicePayload[]> = { [K in keyof T]: Payload<T[K]> };

export type MatchLine<T extends DevicePayload[]> = [SceneSpec, ...MapToPayload<T>[]]
export type DefiniteMatchLine<T extends DevicePayload[]> = [string, ...T]


export const matchScene = <T extends DevicePayload[]>(
    scene: string,
    m: MatchLine<T>[]
): MatchLine<T> | undefined => {
    const found = m.find(([key,]) => {
        console.log("find", scene, key)
        if (typeof key === 'string') {
            return scene === key
        } else {
            return key.includes(scene)
        }
    })
    console.log("found", found)

    if (found !== undefined) {
        const [, ...rest] = found
        return [scene, ...rest]
    }
}

export const reifyProgress = <T extends DevicePayload>(arity: number, progress: number, payloads: Payload<T>[]): T[] => {
    const reified: T[] = new Array(arity)

    for (let i = 0; i < arity; i++) {
        let p = payloads[i]
        if (p === undefined) {
            reified[i] = reified[i - 1]
        } else if (typeof p !== 'function') {
            reified[i] = p
        } else {
            reified[i] = p(progress)
        }
    }

    return reified
}

export function match<
    Scene extends string,
    T extends DevicePayload[],
    >(
        model: Model,
        room: RoomModel,
        resolveScene: (model: Model, room: RoomModel) => Scene,
        payloadArity: number,
        matches: MatchLine<T>[],
): DefiniteMatchLine<T> {
    const [prog, dayNight] = model.sunProgress
    let progress = dayNight === 'day' ? prog : 1.0

    const scene = resolveScene(model, room)
    const output = matchScene(scene, matches)
    if (output !== undefined) {
        const [, ...payloads] = output
        return [scene, ...reifyProgress(payloadArity, progress, payloads)]
    }

    return
}