import * as t from 'io-ts'

type DispatchMessage<Msg> = (m: Msg) => void
type GetModel<Model> = () => Model
type SubToModelChange<Model> = (listener: (m: Model) => void) => unknown
type UnsubToModelChange<Model> = (listener: (m: Model) => void) => unknown

export abstract class InterfaceFactory<Msg, Model> {
  public dispatchMessage?: DispatchMessage<Msg>
  public getModel?: GetModel<Model>
  public subToModelChange?: SubToModelChange<Model>
  public unsubToModelChange?: UnsubToModelChange<Model>

  abstract build(): void

  bindDispatchMessage(dispatchMessage: DispatchMessage<Msg>) {
    this.dispatchMessage = dispatchMessage
  }
  bindGetModel(getModel: GetModel<Model>) {
    this.getModel = getModel
  }
  bindModelChange(
    sub: SubToModelChange<Model>,
    unsub: UnsubToModelChange<Model>,
  ) {
    this.subToModelChange = sub
    this.unsubToModelChange = unsub
  }
}
