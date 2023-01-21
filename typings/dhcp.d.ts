declare module 'dhcp' {
    type DhcpMessage = {
        options: number[]
        chaddr: string

    }
    export function createBroadcastHandler(): DhcpHandler
    export class DhcpHandler {
        listen(): void
        close(): void
        on(msg: 'message', cb: (data: DhcpMessage) => void)
    }
    export const DHCPDISCOVER: number
  export const DHCPOFFER: number
  export const DHCPREQUEST: number
  export const DHCPDECLINE: number
  export const DHCPACK: number
  export const DHCPNAK: number
  export const DHCPRELEASE: number
  export const DHCPINFORM: number
}