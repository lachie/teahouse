import { Model, initialModel, adjustKidweek } from './Model'

test('playroom kid week', () => {
  const now = new Date
  const model = initialModel(adjustKidweek(now, 'kid'));
  // const model = initialModel(adjustKidweek(new Date, 'to'));
  console.log(model)
})
