import * as vscode from 'vscode';
import { CommandNode } from './types';
import { Storage } from './storage';
import { findIndex, findNodeById, findParent, removeNodeById, replaceNodeInTree } from './utility';

export class CmdHubTreeProvider implements vscode.TreeDataProvider<CommandNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<CommandNode | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private storage: Storage) {}

  refresh(): void { this._onDidChangeTreeData.fire(); }

  async getChildren(element?: CommandNode): Promise<CommandNode[]> {
    const nodes = await this.storage.read();
    if (!element) { return nodes; }
    if (element.type === 'folder' && element.list) { return element.list; }
    return [];
  }

  getTreeItem(element: CommandNode): vscode.TreeItem {
    const collapsibleState = element.type === 'folder'
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new vscode.TreeItem(element.name, collapsibleState);
    item.contextValue = element.type;
    item.id = element.id;

    if (element.type === 'command') {
      item.description = element.command;
      item.tooltip = element.command;
    }

    return item;
  }
}

export class CmdHubDragAndDrop implements vscode.TreeDragAndDropController<CommandNode> {
  dropMimeTypes = ['application/vnd.code.tree.cmdhub'];
  dragMimeTypes = ['application/vnd.code.tree.cmdhub'];

  constructor(private provider: CmdHubTreeProvider, private storage: Storage) {}

  handleDrag(source: readonly CommandNode[], dataTransfer: vscode.DataTransfer): void {
    dataTransfer.set('application/vnd.code.tree.cmdhub', new vscode.DataTransferItem(source[0].id));
  }

  async handleDrop(targetNode: CommandNode | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
    const draggedId = dataTransfer.get('application/vnd.code.tree.cmdhub')?.value as string;
    if (!draggedId) { return; }

    const nodes = await this.storage.read();
    const draggedNode = findNodeById(nodes, draggedId);
    if (!draggedNode) { return; }

    const newNodes = removeNodeById(nodes, draggedId);

    if (targetNode) {
      targetNode = removeNodeById([targetNode], draggedId)[0];

      if (targetNode.type === 'folder') {
        if (!targetNode.list) { targetNode.list = []; }
        targetNode.list.unshift(draggedNode);
        const updatedNodes = replaceNodeInTree(newNodes, targetNode);
        await this.storage.write(updatedNodes);
      } else {
        const parentNode = findParent(newNodes, targetNode.id);
        if (parentNode) {
          if (!parentNode.list) { parentNode.list = []; }
          const index = findIndex(parentNode, targetNode);
          if (index !== undefined) {
            parentNode.list.splice(index + 1, 0, draggedNode);
          } else {
            parentNode.list.push(draggedNode);
          }
          const updatedNodes = replaceNodeInTree(newNodes, parentNode);
          await this.storage.write(updatedNodes);
        } else {
          newNodes.push(draggedNode);
          await this.storage.write(newNodes);
        }
      }
    } else {
      newNodes.push(draggedNode);
      await this.storage.write(newNodes);
    }

    this.provider.refresh();
  }
}
