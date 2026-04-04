# Cmd Hub

**CmdHub** は VSCode 内でコマンドを管理・実行できる拡張機能です。

フォルダ階層でコマンドを整理でき、ワンクリックでコマンドを実行できます。

![CmdHub demo](https://raw.githubusercontent.com/TonKatu1052/cmdhub/main/images/demo.gif)

## 特徴

- コマンドをフォルダ形式で保存
- 保存したコマンドを実行・編集が可能
- ドラッグ＆ドロップで簡単に整理
- 複数のシェル (cmd, PowerShell, bash) に対応
- キーボードショートカットで素早く実行

## インストール

1. VS Code を開き、拡張機能ビュー (Ctrl+Shift+X) に移動します。
2. "CmdHub" を検索し、インストールします。
3. または、[Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=tonkatu1052.cmdhub) から直接インストール。

## 要件

- Visual Studio Code バージョン 1.109.0 以上

## 使い方

### コマンドビュー

- CmdHubツリーにコマンド・フォルダが表示されます
- コマンドやフォルダの追加は右上のアイコンボタンから

### 基本操作

- **コマンド追加**: コマンド名と実行内容を入力
- **フォルダ追加**: 階層化して整理
- **編集**: ノード名やコマンド内容を変更
- **削除**: ノードを削除
- **実行**: コマンドをターミナルで即実行
- **ターミナルセット**: コマンドを現在のターミナルにセット

### ドラッグ＆ドロップ

- コマンドやフォルダの並び替えが可能
- ドロップ先がフォルダの場合、階層移動も可能

### 設定

拡張機能の設定で、各シェルのパスをカスタマイズできます：

- `cmdhub.shellPaths.cmd`: cmd.exe のパス
- `cmdhub.shellPaths.powershell`: PowerShell.exe のパス
- `cmdhub.shellPaths.bash`: bash.exe のパス

設定は VS Code の設定 (Ctrl+,) から "CmdHub" を検索して変更してください。

### キーバインド

- `Ctrl+Alt+A`: 選択したコマンドを実行 (デフォルト)

## 貢献

バグ報告や機能リクエストは [GitHub リポジトリ](https://github.com/TonKatu1052/cmdhub) からお願いします。

## ライセンス

MIT © tonkatu1052
