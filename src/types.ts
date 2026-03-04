export type NodeType = 'folder' | 'command';

export interface CommandNode {
  id: string;
  type: NodeType;
  name: string;
  command?: string;
  list?: CommandNode[];
}