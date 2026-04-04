import * as assert from 'assert';
import { NodeManager, type CommandNode, type Node } from '../node';

suite('NodeManager Tests', () => {

    const folderA = NodeManager.createFolderNode('FolderA');
    const folderB = NodeManager.createFolderNode('FolderB');
    const cmd1 = NodeManager.createCommandNode('Cmd1', 'echo 1');

    const initialTree: Node[] = [
        {
            ...folderA,
            list: [cmd1]
        },
        folderB
    ];

    test('normalize: 正常に構造がパースされる', () => {
        const raw = [
            {
                id: '1',
                type: 'folder',
                name: 'F',
                list: [
                    { id: '2', type: 'command', name: 'C', command: 'echo hi' }
                ]
            }
        ];

        const normalized = NodeManager.normalize(raw);

        assert.strictEqual(normalized.length, 1);
        assert.strictEqual(normalized[0].type, 'folder');

        const child = (normalized[0]).list[0];
        assert.strictEqual(child.type, 'command');
        assert.strictEqual((child).command, 'echo hi');
    });

    test('findNodeById: ネストしたNodeを取得できる', () => {
        const found = NodeManager.findNodeById(initialTree, cmd1.id);
        assert.ok(found);
        assert.strictEqual(found.id, cmd1.id);
    });

    test('findNodeById: 存在しないNodeはnull', () => {
        const found = NodeManager.findNodeById(initialTree, 'unknown');
        assert.strictEqual(found, null);
    });

    test('findParentNode: 親フォルダを取得できる', () => {
        const parent = NodeManager.findParentNode(initialTree, cmd1);
        assert.ok(parent);
        assert.strictEqual(parent.id, folderA.id);
    });

    test('addNode: targetなし → ルートに追加', () => {
        const nodes = [folderA];
        const added = NodeManager.addNode(nodes, undefined, cmd1);

        const found = NodeManager.findNodeById(added, cmd1.id);
        assert.ok(found);
    });

    test('addNode: フォルダへ子追加', () => {
        const nodes = [folderA];
        const updated = NodeManager.addNode(nodes, folderA, cmd1);

        const parent = NodeManager.findParentNode(updated, cmd1);
        assert.ok(parent);
        assert.strictEqual(parent.id, folderA.id);
    });

    test('editNode: Node が置き換わる', () => {
        const newNode: CommandNode = {
            ...cmd1,
            name: 'Updated'
        };

        const updated = NodeManager.editNode(initialTree, newNode);
        const found = NodeManager.findNodeById(updated, cmd1.id) as CommandNode;

        assert.strictEqual(found.name, 'Updated');
    });

    test('removeNode: Node が削除される', () => {
        const removed = NodeManager.removeNode(initialTree, cmd1.id);

        const found = NodeManager.findNodeById(removed, cmd1.id);
        assert.strictEqual(found, null);
    });

    test('moveNode: ノードが別フォルダへ移動する', () => {
        const moved = NodeManager.moveNode(initialTree, cmd1, folderB);
        assert.ok(moved);

        const newParent = NodeManager.findParentNode(moved, cmd1);
        assert.ok(newParent);
        assert.strictEqual(newParent.id, folderB.id);
    });

    test('moveNode: target が undefined → ルートへ移動', () => {
        const moved = NodeManager.moveNode(initialTree, cmd1, undefined);
        assert.ok(moved);

        const parent = NodeManager.findParentNode(moved, cmd1);
        assert.strictEqual(parent, null);

        const root = moved.find(n => n.id === cmd1.id);
        assert.ok(root);
    });

    test('moveNode: 同じフォルダ内へ移すと増殖しない', () => {
        const moved = NodeManager.moveNode(initialTree, cmd1, folderA);
        assert.ok(moved);

        const commands = NodeManager.flattenCommands(moved);
        assert.strictEqual(commands.filter(c => c.id === cmd1.id).length, 1);
    });

    test('moveNode: 循環参照を防ぐ（フォルダを自身のサブフォルダに移動できない）', () => {
        const subFolder = NodeManager.createFolderNode('SubFolder');
        const folderWithSub = {
            ...folderA,
            list: [subFolder, cmd1]
        };
        const nestedTree: Node[] = [folderWithSub];

        const moved = NodeManager.moveNode(nestedTree, folderWithSub, subFolder);
        assert.strictEqual(moved, null);
    });

    test('moveNode: 循環参照でない場合は移動可能', () => {
        const subFolder = NodeManager.createFolderNode('SubFolder');
        const nestedTree: Node[] = [
            {
                ...folderA,
                list: [subFolder, cmd1]
            },
            folderB
        ];

        const moved = NodeManager.moveNode(nestedTree, subFolder, folderB);
        assert.ok(moved);

        const parent = NodeManager.findParentNode(moved, subFolder);
        assert.ok(parent);
        assert.strictEqual(parent.id, folderB.id);
    });

    test('flattenCommands: ネストしたコマンドをすべて取得できる', () => {
        const tree: Node[] = [
            {
                ...folderA,
                list: [
                    cmd1,
                    NodeManager.createCommandNode('Cmd2', 'echo 2'),
                    {
                        ...NodeManager.createFolderNode('InnerFolder'),
                        list: [
                            NodeManager.createCommandNode('Cmd3', 'echo 3')
                        ]
                    }
                ]
            },
            NodeManager.createCommandNode('Cmd4', 'echo 4')
        ];

        const commands = NodeManager.flattenCommands(tree);
        assert.strictEqual(commands.length, 4);

        const names = commands.map(c => c.name).sort();
        assert.deepStrictEqual(names, ['Cmd1', 'Cmd2', 'Cmd3', 'Cmd4']);
    });
});
