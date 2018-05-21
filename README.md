# README
# Title
Bookers1-test

## Overview
- 概要
	- 課題Bookers1の自動テスト用コードです。

#### Description
- Bookers1のコードを読み取り、chromeを裏で起動してビューのテストを行います。
- Bookers1のテスト内容の詳細はスプレッドシートにて確認して下さい。


- 追加要件
	- ルートパスの設定
	- 新規投稿したらshowページに移行すること
	- class名の指定
		- 一覧ページのshowボタンのclass名: show_#{id}
		- 一覧ページのeditボタンのclass名: edit_#{id}
		- 一覧ページのdestroyボタンのclass名: destroy_#{id}
		- 詳細ページのeditボタンのclass名: edit_#{id}
		- タイトル投稿フォームのclass名: book_title
		- 内容投稿フォームのclass名: book_body
		- 戻る(back)ボタンにclass: back


## Dependency
※ 必須
- 環境: HomeBrew/Vagrant
- 言語: Node.js
- ライブラリ: puppeteer


## Setup
セットアップ方法、環境構築
- ここから必要なものをインストールして環境を作成する
- まずはnode.jsのインストール(puppeteerはnode.jsで起動しているため)
```
$ curl -sL https://deb.nodesource.com/setup_10.x | bash -
$ apt-get install -y nodejs
```

- ビルドツールのインストール
```
apt-get install -y build-essential
```

-  puppeteerのインストール
```
npm i puppeteer
```
ローカル環境でのセットアップは以上です。


## Usage
- Code Commitのリポジトリbookers1のbookers.jsファイルを
cloneしたアプリケーションのディレクトリに配置するapp/

- railsでサーバーを立ち上げておく
```
$ rails s
```

- 別タブでテスト実行コマンド
```
$ node bookers.js
```

- 正しくテストが実行できるとapp/image/テスト実行の画像が作成される


#### Example
使用例があれば記入


#### Demo
デモがあればわかりやすくGIFなどつける


#### Install
インストール方法


## Author
記入者
18/5/20 Rina.W
