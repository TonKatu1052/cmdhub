import { randomUUID } from 'crypto';

export type NodeType = 'folder' | 'command'
export type TerminalType = 'cmd' | 'powershell' | 'bash';

export interface BaseNode {
    id: string;
    type: NodeType;
    name: string;
}

export interface FolderNode extends BaseNode {
    type: 'folder';
    list: Node[];
}

export interface CommandNode extends BaseNode {
    type: 'command';
    command: string;
    terminalType?: TerminalType;
    shortcut?: string;
}

export type Node = FolderNode | CommandNode;

export class NodeManager {
    static normalize(raw: unknown[]): Node[] {
        const normalizeRecord = (node: unknown): Node | null => {
            if (!NodeManager.isRecord(node)) {
                return null;
            }

            return node.type === 'folder'
                ? {
                    id: String(node.id),
                    type: 'folder',
                    name: String(node.name),
                    list: ((Array.isArray(node.list)) ? node.list : [])
                        .map((child) => normalizeRecord(child))
                        .filter((node): node is Node => node !== null),
                } : {
                    id: String(node.id),
                    type: 'command',
                    name: String(node.name),
                    command: String(node.command),
                    terminalType: node.terminalType === undefined
                        ? undefined
                        : String(node.terminalType as unknown) as TerminalType,
                    shortcut: node.shortcut === undefined
                        ? undefined
                        : String(node.shortcut as unknown),
                };
        };

        return raw
            .map((node) => normalizeRecord(node))
            .filter((node): node is Node => node !== null);
    }

    private static isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }

    static createFolderNode(name: string): FolderNode {
        return {
            id: randomUUID(),
            type: 'folder',
            name: name,
            list: [],
        };
    }

    static createCommandNode(name: string, command: string): CommandNode {
        return {
            id: randomUUID(),
            type: 'command',
            name: name,
            command: command,
        };
    }

    static addNode(nodes: Node[], targetNode: Node | undefined, newNode: Node): Node[] {
        if (!targetNode) {
            return [...nodes, newNode];
        }

        if (targetNode.type === 'folder') {
            return this.editNode(nodes, {
                ...targetNode,
                list: [...targetNode.list, newNode]
            });
        }

        return nodes.map((node) => {
            if (node.type === 'folder') {
                const index = node.list.findIndex((child) => child.id === targetNode.id);

                if (index !== -1) {
                    return {
                        ...node,
                        list: [
                            ...node.list.slice(0, index + 1),
                            newNode,
                            ...node.list.slice(index + 1),
                        ],
                    };
                }

                return {
                    ...node,
                    list: this.addNode(node.list, targetNode, newNode),
                };
            }

            return node;
        });
    }

    static editNode(nodes: Node[], targetNode: Node): Node[] {
        return nodes.map((node) => {
            if (node.id === targetNode.id) {
                return targetNode;
            }
            if (node.type === 'folder') {
                return {
                    ...node,
                    list: this.editNode(node.list, targetNode),
                };
            }

            return node;
        });
    }

    static removeNode(nodes: Node[], targetId: string): Node[] {
        return nodes
            .filter((node) => node.id !== targetId)
            .map((node) => {
                if (node.type === 'folder') {
                    return {
                        ...node,
                        list: this.removeNode(node.list, targetId),
                    };
                }

                return node;
            });
    }

    static findNodeById(nodes: Node[], targetId: string): Node | null {
        for (const node of nodes) {
            if (node.id === targetId) {
                return node;
            }
            if (node.type === 'folder') {
                const result = this.findNodeById(node.list, targetId);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    static moveNode(nodes: Node[], dragged: Node, target: Node | undefined): Node[] | null {
        if (dragged.id === target?.id) {
            return null;
        }
        if (dragged.type === 'folder' && target && this.isNodeInSubtree(dragged, target)) {
            return null;
        }

        const parent = this.findParentNode(nodes, dragged);
        const removed =
            parent
                ? this.editNode(nodes, {
                    ...parent,
                    list: this.removeNode(parent.list, dragged.id)
                })
                : this.removeNode(nodes, dragged.id);

        if (target?.type === 'folder') {
            target = {
                ...target,
                list: this.removeNode(target.list, dragged.id),
            };
        }

        return this.addNode(removed, target, dragged);
    }

    static findParentNode(nodes: Node[], targetNode: Node): FolderNode | null {
        for (const node of nodes) {
            if (node.type === 'folder') {
                if (node.list.some((child) => child.id === targetNode.id)) {
                    return node;
                }
                const result = this.findParentNode(node.list, targetNode);
                if (result) {
                    return result;
                }
            }
        }

        return null;
    }

    private static isNodeInSubtree(parent: Node, target: Node): boolean {
        if (parent.type !== 'folder') {
            return false;
        }

        for (const child of parent.list) {
            if (child.id === target.id) {
                return true;
            }
            if (child.type === 'folder' && this.isNodeInSubtree(child, target)) {
                return true;
            }
        }

        return false;
    }

    static flattenCommands(nodes: Node[]): CommandNode[] {
        return nodes.flatMap((node) => {
            if (node.type === 'folder') {
                return [...this.flattenCommands(node.list)];
            }

            return node;
        });
    }
}
