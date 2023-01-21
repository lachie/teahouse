import { Model, modelZero, newModel } from './Model'
import { update } from './update'


test('clear room scene', () => {
    const model = newModel()
    model.rooms.backroom.scene = 'hello'
    const [nextModel,cmd] = update(model, {type:'clear-room-scenes'})
    expect(nextModel.rooms.backroom.scene).toBe(undefined)
})