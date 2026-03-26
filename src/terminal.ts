import * as vscode from 'vscode';
import { CommandNode, TerminalType } from './types';

export class Terminal {
    private static defaultTerminalName = "CmdHub";

    private static getOrCreateTerminal(node: CommandNode, name: string = Terminal.defaultTerminalName): vscode.Terminal {
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
        const terminal = this.getOrCreateTerminal(node, terminalName);
        terminal.show();
        terminal.sendText(node.command || '');
    }

    public static setToTerminal(node: CommandNode, terminalName?: string) {
        const terminal = this.getOrCreateTerminal(node, terminalName);
        terminal.show();
        terminal.sendText(node.command || '', false);
    }
}