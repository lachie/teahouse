import * as schedule from './schedule'
import * as unschedule from './unschedule'
import * as sendMessage from "./sendMessage"


export type CmdNone = { type: 'cmd-none' }
export const CmdNone: CmdNone = { type: 'cmd-none' }
export type Command<T> = schedule.Schedule<T> | unschedule.Unschedule | sendMessage.SendMessage | CmdNone

export async function run<T>(context: any, model: any, cmd: Command<T>, update: (msg: T)=>void) {
    switch(cmd.type) {
        case 'schedule':
            return schedule.run(context, model, cmd, update)
        case 'unschedule':
            return unschedule.run(context, model, cmd)
        case 'send-message':
            return sendMessage.run(context, model, cmd)
    }
}