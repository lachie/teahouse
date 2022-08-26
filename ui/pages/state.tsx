import { NextPage } from "next"
import useSWR from "swr"
import { StdLayoutLook } from "../components/StdLayout"


const fetcher = (url: string) => fetch(url).then((res) => res.json());

const House = () => {
  const { data, error } = useSWR("http://bops:3030/house", fetcher)

  if (error) return <>error {JSON.stringify(error)}</>
  if (!data) return <>loading...</>

  return <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
}
const Model = () => {
  const { data, error } = useSWR("http://bops:3030/model", fetcher)

  if (error) return <>error {JSON.stringify(error)}</>
  if (!data) return <>loading...</>

  return <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
}

const State: NextPage = () => {
  return <StdLayoutLook>
    <>
      <div>
        model
        <Model />
      </div>
      <div>
        house
        <House />
      </div>
    </>
  </StdLayoutLook>
}
export default State
