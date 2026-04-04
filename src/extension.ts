import * as vscode from 'vscode';
import { Storage } from './storage';
import { CmdHubDragAndDrop, CmdHubTreeProvider } from './tree';
import type { TerminalType} from './node';
import { NodeManager, type Node } from './node';
import { TerminalManager } from './terminal';

export function activate(context: vscode.ExtensionContext) {
    const storage = new Storage(context);
    const provider = new CmdHubTreeProvider(storage);
    let selectedNode: Node | undefined;

    const treeView = vscode.window.createTreeView('cmdhub.tree', {
        treeDataProvider: provider,
        dragAndDropController: new CmdHubDragAndDrop(provider, storage),
        showCollapseAll: true,
    });

    treeView.onDidChangeSelection((event) => {
        selectedNode = event.selection[0];
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('cmdhub.addCommand', async (targetNode?: Node) => {
            await addCommand(targetNode);
        }),

        vscode.commands.registerCommand('cmdhub.addCommandFromToolbar', async () => {
            await addCommand(selectedNode);
        }),

        vscode.commands.registerCommand('cmdhub.addFolder', async (targetNode?: Node) => {
            await addFolder(targetNode);
        }),

        vscode.commands.registerCommand('cmdhub.addFolderFromToolbar', async () => {
            await addFolder(selectedNode);
        }),

        vscode.commands.registerCommand('cmdhub.edit', async (targetNode?: Node) => {
            if (!targetNode) {
                return;
            }

            const name = (await vscode.window.showInputBox({ value: targetNode.name }))?.trim();
            if (!name) {
                return;
            }
            targetNode.name = name;

            if (targetNode.type === 'command') {
                const command = (await vscode.window.showInputBox({ value: targetNode.command }))?.trim();
                if (!command) {
                    return;
                }
                targetNode.command = command;
            }

            const nodes = NodeManager.editNode(await storage.read(), targetNode);
            await storage.write(nodes);
            provider.refresh();
        }),

        vscode.commands.registerCommand('cmdhub.editTerminalType', async (targetNode?: Node) => {
            if (!targetNode || targetNode.type !== 'command') {
                return;
            }

            const selected = await vscode.window.showQuickPick([
                { label: 'Default', value: undefined, description: '' },
                { label: 'cmd', value: 'cmd', description: 'Windows の cmd.exe' },
                { label: 'powershell', value: 'powershell', description: 'PowerShell' },
                { label: 'bash', value: 'bash', description: 'bash / WSL / Git Bash など' },
            ], {
                title: '使用するターミナルを選択',
                placeHolder: 'どのターミナルでコマンドを実行しますか？',
            });
            if (!selected) {
                return;
            }
            targetNode.terminalType = selected.value
                ? (selected.value as TerminalType)
                : undefined;

            const nodes = NodeManager.editNode(await storage.read(), targetNode);
            await storage.write(nodes);
            provider.refresh();
        }),

        vscode.commands.registerCommand('cmdhub.editShortcut', async (targetNode?: Node) => {
            if (!targetNode || targetNode.type !== 'command') {
                return;
            }

            const shortcut = await vscode.window.showInputBox({ value: targetNode.shortcut });
            if (shortcut === undefined) {
                return;
            }
            targetNode.shortcut = shortcut || undefined;

            const nodes = NodeManager.editNode(await storage.read(), targetNode);
            await storage.write(nodes);
            provider.refresh();
        }),

        vscode.commands.registerCommand('cmdhub.delete', async (targetNode?: Node) => {
            if (!targetNode) {
                return;
            }

            const nodes = NodeManager.removeNode(await storage.read(), targetNode.id);
            await storage.write(nodes);
            provider.refresh();
        }),

        vscode.commands.registerCommand('cmdhub.run', (targetNode?: Node) => {
            if (!targetNode || targetNode.type !== 'command') {
                return;
            }

            TerminalManager.runCommand(targetNode);
        }),

        vscode.commands.registerCommand('cmdhub.setToTerminal', (targetNode?: Node) => {
            if (!targetNode || targetNode.type !== 'command') {
                return;
            }

            TerminalManager.setToTerminal(targetNode);
        }),

        vscode.commands.registerCommand('cmdhub.runFolder', async (targetNode?: Node) => {
            if (!targetNode || targetNode.type !== 'folder') {
                return;
            }

            await TerminalManager.runTasks(targetNode);
        }),

        vscode.commands.registerCommand('cmdhub.openStorage', async () => {
            await storage.open();
        }),

        vscode.commands.registerCommand('cmdhub.reload', async () => {
            await storage.read();
            provider.refresh();
        }),

        vscode.commands.registerCommand('cmdhub.shortcutRun', async () => {
            const nodes = await storage.read();
            const commandNodes = NodeManager.flattenCommands(nodes);
            const items = commandNodes.map((node, index) => {
                return {
                    label: `${node.shortcut || index}: ${node.name}`,
                    description: node.command,
                    node: node,
                };
            });

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'コマンドを実行',
                canPickMany: false,
            });
            if (!selected) {
                return;
            }

            TerminalManager.runCommand(selected.node);
        }),
    );

    async function addCommand(targetNode?: Node) {
        const name = (await vscode.window.showInputBox({ prompt: 'Command name' }))?.trim();
        if (!name) {
            return;
        }
        const command = (await vscode.window.showInputBox({ prompt: 'Command' }))?.trim();
        if (!command) {
            return;
        }

        const newNode = NodeManager.createCommandNode(name, command);
        const nodes = NodeManager.addNode(await storage.read(), targetNode, newNode);

        await storage.write(nodes);
        provider.refresh();
    }

    async function addFolder(targetNode?: Node) {
        const name = await vscode.window.showInputBox({ prompt: 'Folder name' });
        if (!name) {
            return;
        }

        const newNode = NodeManager.createFolderNode(name);
        const nodes = NodeManager.addNode(await storage.read(), targetNode, newNode);

        await storage.write(nodes);
        provider.refresh();
    }
}

export function deactivate() {}
