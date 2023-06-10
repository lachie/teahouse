import { ZLight } from './zLight'


test('light make', () => {
    const light = ZLight.make('test', 'ikea', 'zig/topic', ZLight.cosy(1, 1))
    expect(light.type).toBe('zLight')
    expect(light).toEqual(expect.objectContaining({ key: 'test', kind: 'ikea' }))
})

test('light parsePayload white', () => {
    const light = ZLight.make('test', 'ikea', 'zig/topic', {})
    const lightDev = new ZLight

    let payload

    // morning
    light.payload = ZLight.cosy(1, 0)
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(250)

    // noon
    light.payload = ZLight.cosy(1, 0.5)
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(454)

    // arvo
    light.payload = ZLight.cosy(1, 1.0)
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(250)

    light.kind = 'ikea-spot'

    // morning
    light.payload = ZLight.cosy(1, 0)
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(312.5)

    // noon
    light.payload = ZLight.cosy(1, 0.5)
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(454)

    // arvo
    light.payload = ZLight.cosy(1, 1)
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(312.5)
})