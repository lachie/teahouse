
export type Schedule<Msg> = { 
  type: 'schedule',
  id: string,
  after: number,
  msg: Msg
}

type Context = { timers: Record<string, NodeJS.Timeout>}

export async function run<T>(ctx: Context, _model: unknown, msg: Schedule<T>, schedule: (msg: T)=>void) {
  console.log('... command: schedule', msg)

  const existingTimer = ctx.timers[msg.id]
  if (existingTimer !== undefined) {
    clearTimeout(existingTimer)
    delete ctx.timers[msg.id]
  }

  const delay: number = msg.after

  if (delay < 0) {
    console.error('at is in the past...')
    return
  }

  const newTimer = setTimeout(() => {
    console.log('running scheduled input', msg)
    schedule(msg.msg)
  }, delay)
  ctx.timers[msg.id] = newTimer
}