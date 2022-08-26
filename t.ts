import {Api} from './devices/vendor/meross/api'

(async () => {

const a = new Api
// const info: any = await a.deviceInfo('10.28.20.52')
const info: any = await a.abilities('10.28.20.52')
console.dir(info.payload, {depth:null})

})()