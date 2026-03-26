export type NodeType = 'folder' | 'command';
export type TerminalType = 'cmd' | 'powershell' | 'bash';

export interface CommandNode {
  id: string;
  type: NodeType;
  name: string;
  command?: string;
  terminalType?: TerminalType;
  list?: CommandNode[];
}