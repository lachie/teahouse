import * as immutable from 'object-path-immutable'
import fs from 'fs'
import * as t from 'io-ts'
import { failure } from 'io-ts/PathReporter'
import { match, mapLeft, getOrElseW } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/function'
import { InterfaceFactory } from '.'

const getOrError = getOrElseW((errors: t.Errors) => {
  throw new Error(failure(errors).join(','))
})
const mapErrors = mapLeft((errors: t.Errors) => failure(errors).join(','))

export class ModelCacheFactory<Model, ModelCache, Msg> extends InterfaceFactory<
  Msg,
  Model
> {
  constructor(
    public cachePath: string,
    public modelCacheCodec: t.Decoder<unknown, ModelCache>,
    public modelToModelCache: (m: Model) => ModelCache,
  ) {
    super()
  }

  build() {
    const { subToModelChange, unsubToModelChange } = this
    if (subToModelChange === undefined) {
      throw new Error(
        "can't build modelCache interface without subToModelChange",
      )
    }

    subToModelChange((m: Model) => {
      const modelCache = this.modelToModelCache(m)
      fs.writeFileSync(this.cachePath, JSON.stringify(modelCache))
    })
  }

  initialModel(m: Model): Model {
    return immutable.merge(m, undefined, this.loadCache())
  }

  loadCache(): ModelCache {
    let raw
    try {
      // TODO io-ts
      raw = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'))
    } catch (e) {
      raw = {
        rooms: {
          playroom: { lightOn: 'detect' },
        },
      }
    }

    return pipe(raw, this.modelCacheCodec.decode, getOrError)
  }
}
