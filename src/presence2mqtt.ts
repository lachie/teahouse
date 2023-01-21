// import * as mdns from 'mdns'
import * as dhcp from 'dhcp'
import mqtt from 'async-mqtt'
import secrets from '../secrets.json'
import * as fs from 'node:fs/promises'

const mgmt = "https://wap.mgmt/ubus/controller.core.get_clients_range"

const readArp = async () => {
    console.log("reading arp")
    const arp = await fs.readFile("/proc/net/arp", 'utf8')
    const lines = arp.split("\n").slice(1).map(l => l.split(/\s+/)).map(([,,,mac,,]) => mac)
    console.log("arp", lines)
}

console.log("read arp...")
setInterval(readArp, 5 * 1000)

readArp()

const mqttClient = mqtt.connect(secrets.mqtt.broker, {
  username: secrets.mqtt.username,
  password: secrets.mqtt.password,
})
const dhcpH = dhcp.createBroadcastHandler()

const dhcpCommandToString = (n: number): string => {
  let event: string
  switch(n) {
    case dhcp.DHCPDISCOVER:
        return 'discover'
    case dhcp.DHCPOFFER:
        return 'offer'
    case dhcp.DHCPREQUEST:
        return 'request'
    case dhcp.DHCPDECLINE:
        return 'decline'
    case dhcp.DHCPACK:
        return 'ack'
    case dhcp.DHCPNAK:
        return 'nack'
    case dhcp.DHCPRELEASE:
        return 'release'
    case dhcp.DHCPINFORM:
        return 'inform'
    default:
        return 'unknown'
  }
}

dhcpH.on('message', (data: any) => {
    const dhcpCommand = dhcpCommandToString(data.options[53])
    const mac = data.chaddr.replaceAll('-', ':').toLowerCase()
    const s = {kind: 'dhcp', command: dhcpCommand, mac}
    mqttClient.publish(`presence/global`, JSON.stringify(s))
})

dhcpH.listen()
