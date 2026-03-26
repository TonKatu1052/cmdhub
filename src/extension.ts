import * as vscode from 'vscode';
import { Storage } from './storage';
import { CmdHubDragAndDrop, CmdHubTreeProvider } from './tree';
import { CommandNode, TerminalType } from './types';
import { addNode, createNode, removeNodeById, replaceNodeInTree } from './utility';
import { Terminal } from './terminal';

export function activate(context: vscode.ExtensionContext) {
  const storage = new Storage(context);
  const provider = new CmdHubTreeProvider(storage);
  let selectedNode: CommandNode | undefined;

  const treeView = vscode.window.createTreeView('cmdhub.tree', {
    treeDataProvider: provider,
    dragAndDropController: new CmdHubDragAndDrop(provider, storage),
    showCollapseAll: true
  });

  treeView.onDidChangeSelection((event) => {
    selectedNode = event.selection[0];
  });

  context.subscriptions.push(

    vscode.commands.registerCommand('cmdhub.addCommand', async (targetNode?: CommandNode) => {
      addCommand(targetNode);
    }),

    vscode.commands.registerCommand('cmdhub.addCommandFromToolbar', async () => {
      addCommand(selectedNode);
    }),

    vscode.commands.registerCommand('cmdhub.addFolder', async (targetNode?: CommandNode) => {
      addFolder(targetNode);
    }),

    vscode.commands.registerCommand('cmdhub.addFolderFromToolbar', async () => {
      addFolder(selectedNode);
    }),

    vscode.commands.registerCommand('cmdhub.edit', async (targetNode?: CommandNode) => {
      if (!targetNode) { return; }
      const name = await vscode.window.showInputBox({ value: targetNode.name });
      if (!name) { return; }
      if (targetNode.type === 'command') {
        const command = await vscode.window.showInputBox({ value: targetNode.command });
        if (!command) { return; }
        targetNode.command = command;
      }
      targetNode.name = name;

      const nodes = replaceNodeInTree(
        await storage.read(),
        targetNode
      );

      await storage.write(nodes);
      provider.refresh();
    }),

    vscode.commands.registerCommand('cmdhub.editTerminalType', async (targetNode?: CommandNode) => {
      if (!targetNode) { return; }

      const selected = await vscode.window.showQuickPick([
        { label: 'Default', value: undefined, description: '' },
        { label: 'cmd', value: 'cmd', description: 'Windows の cmd.exe' },
        { label: 'powershell', value: 'powershell', description: 'PowerShell' },
        { label: 'bash', value: 'bash', description: 'bash / WSL / Git Bash など' }
      ], {
        title: '使用するターミナルを選択',
        placeHolder: 'どのターミナルでコマンドを実行しますか？',
      });

      if (!selected) { return; }
      
      targetNode.terminalType = selected.value
        ? selected.value as TerminalType
        : undefined;

      await storage.write(replaceNodeInTree(await storage.read(), targetNode));
      provider.refresh();
    }),

    vscode.commands.registerCommand('cmdhub.delete', async (targetNode?: CommandNode) => {
      if (!targetNode) { return; }

      const nodes = removeNodeById(
        await storage.read(),
        targetNode.id
      );

      await storage.write(nodes);
      provider.refresh();
    }),

    vscode.commands.registerCommand('cmdhub.run', async (targetNode?: CommandNode) => {
      if (!targetNode || targetNode.type !== 'command') { return; }
      Terminal.runCommand(targetNode);
    }),

    vscode.commands.registerCommand('cmdhub.setToTerminal', async (targetNode?: CommandNode) => {
      if (!targetNode || targetNode.type !== 'command') { return; }
      Terminal.setToTerminal(targetNode);
    }),

    vscode.commands.registerCommand('cmdhub.openStorage', async () => {
      storage.open();
    }),

    vscode.commands.registerCommand('cmdhub.reload', async () => {
      await storage.read();
      provider.refresh();
    })
  );

  async function addCommand(targetNode?: CommandNode) {
      const name = await vscode.window.showInputBox({ prompt: 'Command name' });
      if (!name) { return; }
      const command = await vscode.window.showInputBox({ prompt: 'Command' });
      if (!command) { return; }

      const newNode: CommandNode = createNode('command', name, command);
      const nodes = addNode(
        await storage.read(),
        targetNode,
        newNode
      );

      await storage.write(nodes);
      provider.refresh();
  }

  async function addFolder(targetNode?: CommandNode) {
      const name = await vscode.window.showInputBox({ prompt: 'Folder name' });
      if (!name) { return; }

      const newNode: CommandNode = createNode('folder', name);
      const nodes = addNode(
        await storage.read(),
        targetNode,
        newNode
      );

      await storage.write(nodes);
      provider.refresh();
  }
}

export function deactivate() {}