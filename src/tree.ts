import * as vscode from 'vscode';
import { NodeManager, type Node } from './node';
import type { Storage } from './storage';

export class CmdHubTreeProvider implements vscode.TreeDataProvider<Node> {
    private _onDidChangeTreeData = new vscode.EventEmitter<Node | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private storage: Storage,
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    async getChildren(element?: Node): Promise<Node[]> {
        if (!element) {
            return await this.storage.read();
        }
        if (element.type === 'folder' && element.list) {
            return element.list;
        }

        return [];
    }

    getTreeItem(element: Node): vscode.TreeItem {
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

export class CmdHubDragAndDrop implements vscode.TreeDragAndDropController<Node> {
    private mimeType = 'application/vnd.code.tree.cmdhub';

    dropMimeTypes = [this.mimeType];
    dragMimeTypes = [this.mimeType];

    constructor(
        private provider: CmdHubTreeProvider,
        private storage: Storage,
    ) {}

    handleDrag(source: readonly Node[], dataTransfer: vscode.DataTransfer): void {
        dataTransfer.set(this.mimeType, new vscode.DataTransferItem(source[0].id));
    }

    async handleDrop(target: Node | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
        const draggedId = dataTransfer.get(this.mimeType)?.value as string;
        if (!draggedId) {
            return;
        }

        const nodes = await this.storage.read();
        const dragged = NodeManager.findNodeById(nodes, draggedId);
        if (!dragged) {
            return;
        }

        const newNodes = NodeManager.moveNode(nodes, dragged, target);
        if (!newNodes) {
            return;
        }

        await this.storage.write(newNodes);
        this.provider.refresh();
    }
}
