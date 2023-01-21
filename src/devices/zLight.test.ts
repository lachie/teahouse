import { ZLight } from './zLight'


test('light make', () => {
    const light = ZLight.make('test', 'ikea', 'zig/topic', {white: [1,1,'cosy']})
    expect(light.type).toBe('zLight')
    expect(light).toEqual(expect.objectContaining({key: 'test', kind: 'ikea'}))
})

test('light parsePayload white', () => {
    const light = ZLight.make('test', 'ikea', 'zig/topic', {})
    const lightDev = new ZLight

    let payload

    // morning
    light.payload = {white: [1,1,'cosy']}
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(250)

    // noon
    light.payload = {white: [1,0.5,'cosy']}
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(454)

    // arvo
    light.payload = {white: [1,0,'cosy']}
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(250)

    light.kind = 'ikea-spot'

    // morning
    light.payload = {white: [1,1,'cosy']}
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(312.5)

    // noon
    light.payload = {white: [1,0.5,'cosy']}
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(454)

    // arvo
    light.payload = {white: [1,0,'cosy']}
    payload = lightDev.parsePayload(light)
    console.log(payload.color_temp)
    expect(payload.color_temp).toEqual(312.5)
})