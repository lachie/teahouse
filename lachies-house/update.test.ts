import { Model, modelZero, newModel, initialModel } from './Model'
import { update } from './update'

test('clear room scene', () => {
  const model = newModel()
  model.rooms.backroom.scene = 'hello'
  const [nextModel] = update(model, { type: 'clear-room-scenes' })
  expect(nextModel.rooms.backroom.scene).toBe(undefined)
})

test('kid week lights', () => {
  const now = new Date()
  const model = initialModel(now)
  const [nextModel] = update(model, { type: 'set-hour', date: now })
  expect(nextModel.rooms.backroom.scene).toBe(undefined)
  console.log(nextModel)
})
