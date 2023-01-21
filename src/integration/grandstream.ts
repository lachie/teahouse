import { default as axiosLib } from 'axios'
import * as https from 'node:https'
import * as immutable from 'object-path-immutable'

const axios = axiosLib.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
})

export type Client = {
  client_mac: string
  online: boolean
}

export class Grandstream {
  baseUrl = 'https://wap.mgmt/ubus'
  ssid = 'Baldrick'
  sessionId?: string
  #reqId = 0

  constructor(
    public readonly username: string,
    public readonly password: string,
  ) {}
  url(path: string): string {
    return `${this.baseUrl}/${path}`
  }
  reqId(): number {
    return ++this.#reqId
  }

  async login() {
    const data = {
      id: this.reqId(),
      jsonrpc: '2.0',
      method: 'call',
      params: [
        '00000000000000000000000000000000',
        'session',
        'login',
        { username: this.username, password: this.password },
      ],
    }
    const req = await axios.post(this.url('session.login'), data)
    this.sessionId = immutable.get(req.data, 'result.1.ubus_rpc_session')
    // expiry?
  }

  async getClients(): Promise<Client[]> {
    // TODO paginate
    const data = {
      id: this.reqId(),
      jsonrpc: '2.0',
      method: 'call',
      params: [
        this.sessionId,
        'controller.core',
        'get_clients_range',
        { start: 0, end: 100, wireless: 2, radio: 0, ssid: this.ssid, online: 1 },
      ],
    }

    const req = await axios.post(
      this.url('controller.core.get_clients_range'),
      data,
    )


    return immutable.get(req.data, 'result.1.clients')
  }
}

// (async () => {
// const gs = new Grandstream('admin', '9Pt8nVFJ')
//     console.log("login")
//     await gs.login()
//     console.log("ok")

//     console.log("getting clients")
//     const clients = await gs.getClients()
//     console.log("clients", clients)
// })()
