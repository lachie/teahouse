import * as axios from 'axios';
import uuid4 from 'uuid4'
import md5 from 'md5'

export class Api {
    constructor(public sharedKey = '') { }

    url(host: string, p: string): string {
        return `http://${host}/${p}`
    }

    signPacket(packet: any) {
        const messageId = md5(uuid4())
        const timestamp = Math.floor(Date.now() / 1000)
        const signature = md5(messageId + this.sharedKey + timestamp)

        packet.header.messageId = messageId
        packet.header.timestamp = timestamp
        packet.header.sign = signature

        return packet
    }

    async deviceInfo(host: string): Promise<unknown> {
        const data = this.signPacket({
            'header': {
                'from': '',
                'method': 'GET',
                'namespace': 'Appliance.System.All'
            },
            'payload': {}
        })

        const url = this.url(host, 'config')

        console.log(url, data)

        const rsp = await axios.default({
            url,
            method: 'post',
            data: data,
            headers: { 'Content-Type': 'application/json' }
        })

        return rsp.data
    }
    async abilities(host: string): Promise<unknown> {
        const data = this.signPacket({
            'header': {
                'from': '',
                'method': 'GET',
                'namespace': 'Appliance.System.Ability'
            },
            'payload': {}
        })

        const url = this.url(host, 'config')

        console.log(url, data)

        const rsp = await axios.default({
            url,
            method: 'post',
            data: data,
            headers: { 'Content-Type': 'application/json' }
        })

        return rsp.data
    }



    // async post(p: string) {
    //     return await got.post(this.url(p, ''), {
    //         json: {
    //             hello: 'world'
    //         }
    //     }).json();

    // }
}