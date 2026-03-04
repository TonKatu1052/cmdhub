import * as vscode from 'vscode';
import { CommandNode } from './types';

export class Storage {
  constructor(private context: vscode.ExtensionContext) {}

  private get fileUri(): vscode.Uri {
    return vscode.Uri.joinPath(this.context.globalStorageUri, 'commands.json');
  }

  async open(): Promise<void> {
    await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
    try {
      await vscode.workspace.fs.stat(this.fileUri);
    } catch {
      await vscode.workspace.fs.writeFile(this.fileUri, Buffer.from('[]')); 
    }
    const doc = await vscode.workspace.openTextDocument(this.fileUri);
    await vscode.window.showTextDocument(doc);
  }

  async read(): Promise<CommandNode[]> {
    await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
    try {
      const data = await vscode.workspace.fs.readFile(this.fileUri);
      const text = Buffer.from(data).toString();
      return JSON.parse(text) as CommandNode[];
    } catch {
      await this.write([]);
      return [];
    }
  }

  async write(nodes: CommandNode[]): Promise<void> {
    const text = JSON.stringify(nodes, null, 2);
    await vscode.workspace.fs.writeFile(this.fileUri, Buffer.from(text));
  }
}