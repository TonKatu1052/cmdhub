import * as vscode from 'vscode';
import type { Node} from './node';
import { NodeManager } from './node';

export class Storage {
    constructor(
        private context: vscode.ExtensionContext,
    ) {}

    private get fileUri(): vscode.Uri {
        return vscode.Uri.joinPath(
            this.context.globalStorageUri,
            'commands.json',
        );
    }

    private async prepareStorage(): Promise<void> {
        await vscode.workspace.fs.createDirectory(
            this.context.globalStorageUri,
        );

        try {
            await vscode.workspace.fs.stat(this.fileUri);
        } catch {
            await vscode.workspace.fs.writeFile(
                this.fileUri,
                Buffer.from('[]'),
            );
        }
    }

    async open(): Promise<void> {
        await this.prepareStorage();
        const doc = await vscode.workspace.openTextDocument(this.fileUri);
        await vscode.window.showTextDocument(doc);
    }

    async read(): Promise<Node[]> {
        await this.prepareStorage();

        try {
            const data = await vscode.workspace.fs.readFile(this.fileUri);
            const text = Buffer.from(data).toString();
            const raw = JSON.parse(text) as unknown[];

            return NodeManager.normalize(raw);
        } catch {
            await this.write([]);

            return [];
        }
    }

    async write(nodes: Node[]): Promise<void> {
        const text = JSON.stringify(nodes, null, 2);
        await vscode.workspace.fs.writeFile(this.fileUri, Buffer.from(text));
    }
}
