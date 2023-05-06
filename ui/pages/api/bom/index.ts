import { consoleLogger } from '@influxdata/influxdb-client'
import { default as axios } from 'axios'

// from https://github.com/gcanti/fp-ts/blob/master/src/Json.ts
interface JsonRecord {
    readonly [key: string]: Json
}
interface JsonArray extends ReadonlyArray<Json> { }
type Json = boolean | number | string | null | JsonArray | JsonRecord

type BomForecast = {
    location: string,
    kind: string
}
// https://api.weather.bom.gov.au/v1/locations/r3gxbv/forecasts/daily
// https://api.weather.bom.gov.au/v1/locations/r3gxbv/forecasts/3-hourly
// https://api.weather.bom.gov.au/v1/locations/r3gxbv/observations

const bomPath = ({ location, kind }: BomForecast): string => `https://api.weather.bom.gov.au/v1/locations/${location}/${kind}`
const grab = async (spec: BomForecast): Promise<Json> => {
    try {
        const rsp = await axios(bomPath(spec), {headers: {accept: 'application/json'}, responseType: 'json'})
        // console.log("data", rsp.data)
        return rsp.data.data as Json
    } catch(e) {
        console.log("error", e.toJSON())
        if(axios.isAxiosError(e)) {
            return {error: e.toJSON() as JsonRecord, kind: 'axios'}
        } else {
            return {error: e, kind: 'unknown'}
        }

    }
}

const location = 'r3gxbv'

export default async function handler(req, res) {
    // console.log("fetching bom")
    const bom = {
        daily: await grab({location, kind: 'forecasts/daily'}),
        // hourly: await grab({location, kind: 'forecasts/3-hourly'}),
        observations: await grab({location, kind: 'observations'}),
    }
    res.status(200).json(bom)
  }