import { randomUUID } from 'crypto';
import type { CommandNode, NodeType } from './types';

export function createNode(type: NodeType, name: string, command?: string): CommandNode {
    return {
        id: randomUUID(),
        type: type,
        name: name,
        command: type === 'command' ? command : undefined,
        list: type === 'folder' ? [] : undefined,
    };
}

export function addNode(nodes: CommandNode[], targetNode: CommandNode | undefined, newNode: CommandNode): CommandNode[] {
    if (targetNode) {
        if (targetNode.type === 'folder') {
            if (!targetNode.list) {
                targetNode.list = [];
            }
            targetNode.list.push(newNode);
            nodes = replaceNodeInTree(nodes, targetNode);
        } else {
            const parentNode = findParent(nodes, targetNode.id);
            if (parentNode) {
                if (!parentNode.list) {
                    parentNode.list = [];
                }
                const index = findIndex(parentNode, targetNode);
                if (index !== undefined) {
                    parentNode.list.splice(index + 1, 0, newNode);
                } else {
                    parentNode.list.push(newNode);
                }
                nodes = replaceNodeInTree(nodes, parentNode);
            } else {
                nodes.push(newNode);
            }
        }
    } else {
        nodes.push(newNode);
    }

    return nodes;
}

export function findIndex(parentNode: CommandNode, targetNode: CommandNode): number | undefined {
    return parentNode.list?.findIndex((n) => n.id === targetNode.id);
}

export function findParent(list: CommandNode[], id: string): CommandNode | undefined {
    for (const node of list) {
        if (node.list?.some((child) => child.id === id)) {
            return node;
        }
        if (node.list) {
            const found = findParent(node.list, id);
            if (found) {
                return found;
            }
        }
    }

    return undefined;
}

export function findNodeById(nodes: CommandNode[], id: string): CommandNode | undefined {
    for (const n of nodes) {
        if (n.id === id) {
            return n;
        }
        if (n.type === 'folder' && n.list) {
            const found = findNodeById(n.list, id);
            if (found) {
                return found;
            }
        }
    }

    return undefined;
}

export function removeNodeById(nodes: CommandNode[], id: string): CommandNode[] {
    return nodes
        .filter((n) => n.id !== id)
        .map((n) => {
            if (n.type === 'folder' && n.list) {
                n.list = removeNodeById(n.list, id);
            }
            return n;
        });
}

export function replaceNodeInTree(nodes: CommandNode[], target: CommandNode): CommandNode[] {
    return nodes.map((n) => {
        if (n.id === target.id) {
            return target;
        }
        if (n.type === 'folder' && n.list) {
            n.list = replaceNodeInTree(n.list, target);
        }

        return n;
    });
}
