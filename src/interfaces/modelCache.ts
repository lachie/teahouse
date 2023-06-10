import * as immutable from 'object-path-immutable'
import * as z from 'zod'
import fs from 'fs'
import { InterfaceFactory } from '.'

export class ModelCacheFactory<Model, ModelCache, Msg> extends InterfaceFactory<
  Msg,
  Model
> {
  constructor(
    public cachePath: string,
    public modelCacheCodec: z.ZodSchema<ModelCache>,
    public modelZero: unknown,
    public modelToModelCache: (m: Model) => ModelCache,
  ) {
    super()
  }

  build() {
    const { subToModelChange } = this
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
      return this.modelCacheCodec.parse(raw)
    } catch (e) {
      raw = this.modelZero
      return this.modelCacheCodec.parse(raw)
    }
  }
}
