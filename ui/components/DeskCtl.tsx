import { useDispatchMsgTagger } from "lib/useDispatchMsg";
import { DeskCommand } from "../lachies-house/Msg";
import { Button } from "./Buttons";
import { ModelProps } from "./ModelProps";

export const DeskCtl = ({model}: ModelProps) => {
  const up = useDispatchMsgTagger(() => DeskCommand('office','up'))
  const down = useDispatchMsgTagger(() => DeskCommand('office','down'))
  const stop = useDispatchMsgTagger(() => DeskCommand('office','idle'))

    return <>
    <Button onClick={up}>up</Button>
    <Button onClick={down}>down</Button>
    <Button onClick={stop}>stop</Button>
    </>
}