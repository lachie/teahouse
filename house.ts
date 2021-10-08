export type Node = {
  type: string
  key: string
}

export type Container<Msg> = Node & {
  children?: AnyNode<Msg>[]
}

export const Empty: Node = { type: 'empty', key: 'empty' }

export const Room = <Msg>(key: string, ...children: Container<Msg>[]) => ({
  type: 'room',
  key,
  children,
})

export function isContainer<Msg>(node: AnyNode<Msg>): node is Container<Msg> {
  return 'children' in node && node.children !== undefined
}

export type AnyNode<Msg> = Node | Container<Msg>

export const childrenToRecord = <Msg>(
  node: AnyNode<Msg>,
): Record<string, AnyNode<Msg>> =>
  'children' in node && node.children
    ? node.children.reduce(
        (nodes: Record<string, AnyNode<Msg>>, r) => ((nodes[r.key] = r), nodes),
        {},
      )
    : {}
