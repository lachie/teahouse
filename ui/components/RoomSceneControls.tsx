import { RoomModel } from '../lachies-house/Model'
import { ReactElement } from 'react'
import { useDispatchMsgTagger } from '../lib/useDispatchMsg'
import { SetScene } from '../lachies-house/Msg'
import { SceneButton } from '../components/SceneButton'
import { ModelProps } from './ModelProps'
import { Rooms, roomScenes } from './RoomScenes'

type ThisRoomProps = ModelProps & { room: RoomModel }
export const RoomSceneControls = (key: Rooms) => ({ room }: ThisRoomProps): ReactElement => {
    const scenes = roomScenes[key]
  const setScene = useDispatchMsgTagger(SetScene(key))

  return (
    <div>
      {scenes.map((s, i) => (
        <SceneButton
          key={i}
          sceneSpec={s}
          currentScene={room.scene}
          setScene={async () => {
            await setScene(s.scene)
          }}
        />
      ))}
    </div>
  )
}