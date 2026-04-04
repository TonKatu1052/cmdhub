import * as vscode from 'vscode';
import type { CommandNode, Node, TerminalType } from './node';

export class TerminalManager {
    private static defaultTerminalName = 'CmdHub';

    private static getOrCreateTerminal(node: CommandNode, name: string = TerminalManager.defaultTerminalName): vscode.Terminal {
        if (!node.terminalType) {
            return vscode.window.activeTerminal || vscode.window.createTerminal(name);
        }

        return vscode.window.activeTerminal?.name === node.terminalType
            ? vscode.window.activeTerminal
            : vscode.window.createTerminal({
                  name: node.terminalType,
                  shellPath: this.getShellPath(node.terminalType),
              });
    }

    private static getShellPath(terminalType: TerminalType): string | undefined {
        const config = vscode.workspace.getConfiguration('cmdhub.shellPaths');

        return config.get<string>(terminalType);
    }

    public static runCommand(node: CommandNode, terminalName?: string) {
        const commandText = node.command?.trim();
        if (!commandText) {
            vscode.window.showWarningMessage('実行するコマンドが空です。コマンドを入力してください。');
            return;
        }

        const terminal = this.getOrCreateTerminal(node, terminalName);
        terminal.show();
        terminal.sendText(commandText);
    }

    public static setToTerminal(node: CommandNode, terminalName?: string) {
        const commandText = node.command?.trim();
        if (!commandText) {
            vscode.window.showWarningMessage('ターミナルにセットするコマンドが空です。');
            return;
        }

        const terminal = this.getOrCreateTerminal(node, terminalName);
        terminal.show();
        terminal.sendText(commandText, false);
    }

    static async runTask(node: CommandNode): Promise<void> {
        const commandText = node.command?.trim();
        if (!commandText) {
            vscode.window.showWarningMessage('実行するコマンドが空です。');
            return;
        }

        const task = new vscode.Task(
            { type: 'shell' },
            vscode.TaskScope.Workspace,
            node.name,
            this.defaultTerminalName,
            new vscode.ShellExecution(commandText),
        );

        const execution = await vscode.tasks.executeTask(task);
        await this.waitForTaskFinish(execution.task);
    }

    static async runTasks(node: Node): Promise<void> {
        const commands = node.type === 'folder'
            ? node.list.filter((node): node is CommandNode => node.type === 'command')
            : [node];

        if (commands.length === 0) {
            vscode.window.showInformationMessage('このフォルダーにコマンドがありません。');
            return;
        }

        vscode.window.showInformationMessage(`${commands.length} 件のコマンドを順番に実行します...`);

        for (const command of commands) {
            await this.runTask(command);
        }

        vscode.window.showInformationMessage('すべてのコマンドの実行が完了しました。');
    }

    private static waitForTaskFinish(task: vscode.Task): Promise<void> {
        return new Promise((resolve) => {
            const disposable = vscode.tasks.onDidEndTaskProcess((event) => {
                if (event.execution.task === task) {
                    disposable.dispose();
                    resolve();
                }
            });
        });
    }
}
