import { MatchLine, matchScene, reifyProgress } from './scenes'
import { expect } from 'chai'

const commonAreaMatch: MatchLine<unknown>[] = [
    [['off', 'none'], { state: 'OFF' }, { state: 'OFF' }],
    [
        'doorbell',
        [
            {
                state: 'ON',
                color: { r: 255, g: 0, b: 0 },
                brightness: 255,
            },
            {
                state: 'ON',
                color: { r: 255, g: 0, b: 0 },
                brightness: 255 * 0.25,
            },
        ],
    ],
]

describe('reifyProgress', () => {
    const r = reifyProgress<any>(3, 0.5, [{ a: 'b' }, (p: number) => ({ b: 'c', p })])
    expect(r[0]).to.eql({ a: 'b' })
    console.log(r)
})

describe('matchScene', () => {
    const m1 = matchScene('off', commonAreaMatch)
    console.log(m1)
})