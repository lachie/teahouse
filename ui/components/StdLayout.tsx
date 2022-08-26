import { HomeIcon } from "@heroicons/react/outline"
import classNames from "classnames"
import { ReactElement, ReactNode } from "react"
import { ModelUpdater } from "../components/ModelUpdater"
import { Model, ModelT } from "../lib/Model"

export type StdLayoutLookProps = { children: ReactNode, alert?: boolean }
export const StdLayoutLook = ({ children, alert }: StdLayoutLookProps) => <div className="bg-blue-300 min-h-screen 2xl:pt-16">
    <div className="container mx-auto max-w-full 2xl:max-w-2xl 2xl:shadow-lg 2xl:rounded-xl">
        <header className={classNames("2xl:rounded-t-xl mx-auto h-16 2xl:h-32", { "bg-purple-600": !alert, "bg-red-600": alert })}>
            <section className="flex items-center justify-center min-h-full">
                <div className="text-center text-white text-3xl font-semibold flex flex-row">
                    T<HomeIcon className="w-8 h-8" />
                </div>
            </section>
        </header>

        <section className="mx-auto bg-white">
            {children}
        </section>
        <footer className="bg-purple-400 2xl:rounded-b-xl mx-auto h-8"></footer>
    </div>
</div>


export type StdLayoutProps = { children: (model: Model) => ReactNode }
const StdLayout = ({ children }: StdLayoutProps) =>
    <ModelUpdater render={(model) => <StdLayoutLook alert={model.doorbell}>
        {children(model)}
    </StdLayoutLook>
    } />

export default StdLayout