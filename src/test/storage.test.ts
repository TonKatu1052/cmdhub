import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { Storage } from '../storage';
import { NodeManager } from '../node';

suite('Storage Tests', () => {
    let storage: Storage;
    let mockContext: Partial<vscode.ExtensionContext>;

    suiteSetup(() => {
        mockContext = {
            globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-storage')),
            subscriptions: [],
        };
        storage = new Storage(mockContext as vscode.ExtensionContext);
    });

    test('write and read: 正常に保存・読み込みできる', async () => {
        const nodes = [
            NodeManager.createCommandNode('Test Cmd', 'echo test'),
            NodeManager.createFolderNode('Test Folder'),
        ];

        await storage.write(nodes);
        const readNodes = await storage.read();

        assert.strictEqual(readNodes.length, 2);
        assert.strictEqual(readNodes[0].name, 'Test Cmd');
        assert.strictEqual(readNodes[1].name, 'Test Folder');
    });

    test('read: ファイルが存在しない場合、空配列を返す', async () => {
        // 新しいストレージインスタンスでテスト
        const emptyMockContext: Partial<vscode.ExtensionContext> = {
            globalStorageUri: vscode.Uri.file(path.join(process.cwd(), 'test-storage-empty')),
            subscriptions: [],
        };
        const emptyStorage = new Storage(emptyMockContext as vscode.ExtensionContext);

        const nodes = await emptyStorage.read();
        assert.deepStrictEqual(nodes, []);
    });

    test('normalize integration: 破損したJSONでも回復する', async () => {
        // 直接ファイルに破損データを書き込む
        const invalidJson = 'invalid json';
        const fileUri = vscode.Uri.joinPath(mockContext.globalStorageUri!, 'commands.json');
        await vscode.workspace.fs.createDirectory(mockContext.globalStorageUri!);
        await vscode.workspace.fs.writeFile(fileUri, Buffer.from(invalidJson));

        const nodes = await storage.read();
        assert.deepStrictEqual(nodes, []);
    });
});
