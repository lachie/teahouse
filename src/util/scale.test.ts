import { sawNorm, sawUnit } from './scale'

test('sawUnit', () => {
    expect(sawUnit(0)).toEqual(0)
    expect(sawUnit(0.5)).toEqual(1.0)
    expect(sawUnit(1.0)).toEqual(0)
})

test('sawNorm', () => {
    const s = sawNorm(100, 200)
    expect(s(0)).toEqual(100)
    expect(s(0.5)).toEqual(200)
    expect(s(1.0)).toEqual(100)
})