import * as assert from 'assert';
import {
  createNode,
  addNode,
  findParent,
  findNodeById,
  removeNodeById,
  replaceNodeInTree
} from '../utility';
import { CommandNode } from '../types';

suite('CmdHub Utility Tests', () => {

  test('createNode - command', () => {
    const node = createNode('command', 'TestCmd', 'echo hello');
    assert.strictEqual(node.type, 'command');
    assert.strictEqual(node.name, 'TestCmd');
    assert.strictEqual(node.command, 'echo hello');
    assert.strictEqual(node.list, undefined);
  });

  test('createNode - folder', () => {
    const node = createNode('folder', 'TestFolder');
    assert.strictEqual(node.type, 'folder');
    assert.strictEqual(node.name, 'TestFolder');
    assert.deepStrictEqual(node.list, []);
  });

  test('addNode - add to root', () => {
    const nodes: CommandNode[] = [];
    const newNode = createNode('command', 'A', 'ls');
    const result = addNode(nodes, undefined, newNode);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'A');
  });

  test('addNode - add after command (same level)', () => {
    const node1 = createNode('command', 'A', 'ls');
    const node2 = createNode('command', 'B', 'pwd');

    const nodes = [node1];
    const result = addNode(nodes, node1, node2);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[1].name, 'B');
  });

  test('findNodeById', () => {
    const child = createNode('command', 'Child', 'echo');
    const folder = createNode('folder', 'Parent');
    folder.list?.push(child);

    const nodes = [folder];
    const found = findNodeById(nodes, child.id);

    assert.ok(found);
    assert.strictEqual(found?.name, 'Child');
  });

  test('findParent', () => {
    const child = createNode('command', 'Child', 'echo');
    const folder = createNode('folder', 'Parent');
    folder.list?.push(child);

    const nodes = [folder];
    const parent = findParent(nodes, child.id);

    assert.ok(parent);
    assert.strictEqual(parent?.name, 'Parent');
  });

  test('removeNodeById', () => {
    const node1 = createNode('command', 'A', 'ls');
    const node2 = createNode('command', 'B', 'pwd');

    const nodes = [node1, node2];
    const result = removeNodeById(nodes, node1.id);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'B');
  });

  test('replaceNodeInTree', () => {
    const node = createNode('command', 'Old', 'ls');
    const nodes = [node];

    const updated: CommandNode = {
      ...node,
      name: 'New'
    };

    const result = replaceNodeInTree(nodes, updated);

    assert.strictEqual(result[0].name, 'New');
  });

});