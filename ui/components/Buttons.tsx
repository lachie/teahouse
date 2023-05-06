import { ReactElement } from "react"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>
export const Button = (props: ButtonProps): ReactElement => (
  <button
    className="w-16 h-12 rounded py-2 px-4 w-full flex flex-row content-center border border-gray-400"
    {...props}
  />
)