export type Unschedule = {
    type: 'unschedule',
    id: string
}

type Context = { timers: Record<string, NodeJS.Timeout>}

export async function run(ctx: Context, _model: unknown, msg: Unschedule) {
  console.log('... command: unschedule', msg)

  const existingTimer = ctx.timers[msg.id]
  if (existingTimer !== undefined) {
    clearTimeout(existingTimer)
    delete ctx.timers[msg.id]
  }
}