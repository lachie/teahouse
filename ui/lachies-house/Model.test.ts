import { adjustKidweek } from './Model'
import { addDays, differenceInCalendarDays, addWeeks } from 'date-fns'

test('adjustKidweek', () => {
  type T = ['kid' | 'non', string, string]
  const t: T[] = [
    ['non', '2023-01-20', '2023-02-03'],
    ['kid', '2023-01-20', '2023-01-20'],
    ['non', '2023-01-22', '2023-01-22'],
    ['kid', '2023-01-22', '2023-02-05'],
  ];

  t.forEach(([dir, from, to]) => {
    expect(adjustKidweek(new Date(from), dir)).toEqual(new Date(to))
  })
})
