import * as assert from 'assert';
import * as vscode from 'vscode';
import { TerminalManager } from '../terminal';
import { NodeManager } from '../node';

suite('TerminalManager Tests', () => {
    test('runTasks: フォルダ内のコマンドを抽出して実行', async () => {
        const folder = NodeManager.createFolderNode('Test Folder');
        folder.list = [
            NodeManager.createCommandNode('Cmd1', 'echo 1'),
            NodeManager.createCommandNode('Cmd2', 'echo 2'),
        ];

        const originalShowInfo = vscode.window.showInformationMessage;
        const messages: string[] = [];
        const mockShowInfo = (message: string) => {
            messages.push(message);
            return Promise.resolve(undefined);
        };
        vscode.window.showInformationMessage = mockShowInfo;

        const originalRunTask = TerminalManager.runTask.bind(TerminalManager);
        const executedCommands: string[] = [];
        TerminalManager.runTask = async (command) => {
            executedCommands.push(command.command);
            await Promise.resolve();
        };

        try {
            await TerminalManager.runTasks(folder);

            assert.strictEqual(messages.length, 2);
            assert.strictEqual(messages[0], '2 件のコマンドを順番に実行します...');
            assert.strictEqual(messages[1], 'すべてのコマンドの実行が完了しました。');
            assert.deepStrictEqual(executedCommands, ['echo 1', 'echo 2']);
        } finally {
            vscode.window.showInformationMessage = originalShowInfo;
            TerminalManager.runTask = originalRunTask;
        }
    });

    test('runTasks: コマンドなしフォルダでメッセージを表示', async () => {
        const folder = NodeManager.createFolderNode('Empty Folder');

        const originalShowInfo = vscode.window.showInformationMessage;
        let message: string = '';
        const mockShowInfo = (msg: string) => {
            message = msg;
            return Promise.resolve(undefined);
        };
        vscode.window.showInformationMessage = mockShowInfo;

        try {
            await TerminalManager.runTasks(folder);
            assert.strictEqual(message, 'このフォルダーにコマンドがありません。');
        } finally {
            vscode.window.showInformationMessage = originalShowInfo;
        }
    });

    test('runTasks: 単一コマンドノードを直接実行', async () => {
        const command = NodeManager.createCommandNode('Single Cmd', 'echo single');

        const originalRunTask = TerminalManager.runTask.bind(TerminalManager);
        let executedCommand: string = '';
        TerminalManager.runTask = async (cmd) => {
            executedCommand = cmd.command;
            await Promise.resolve();
        };

        try {
            await TerminalManager.runTasks(command);
            assert.strictEqual(executedCommand, 'echo single');
        } finally {
            TerminalManager.runTask = originalRunTask;
        }
    });
});
