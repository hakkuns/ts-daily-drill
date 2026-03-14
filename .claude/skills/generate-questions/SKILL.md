---
name: generate-questions
description: TypeScript学習問題を生成・追加・補充するときに使う。
  「問題を追加して」「バンクを補充して」「questions.jsonを生成して」
  「〇〇カテゴリの問題を増やして」と言われたら必ずこのスキルを使う。
---

# 問題生成スキル

## 概要
TypeScript学習問題バンク（questions.json）を生成・補充するスキル。
3層のプロンプト構造で品質を担保する。

## 参照ファイル
- `prompts/system.md`  → 層①：対象者プロファイル・品質基準（全生成共通）
- `prompts/batch.md`   → 層②：カテゴリ×難易度×トピックの生成テンプレート
- `prompts/review.md`  → 層③：セルフレビュー（品質チェック）

## 実行手順

### フル生成（初回）
1. `prompts/system.md` を読んで対象者プロファイルと品質基準を把握する
2. `prompts/batch.md` のバッチ定義に従い、カテゴリ×難易度ごとに問題を生成する
3. 生成した問題を `prompts/review.md` の基準でセルフレビューする
4. レビューを通過した問題のみ `src/data/questions.json` に書き込む
5. カテゴリ別・難易度別の問題数サマリーを表示する
6. `git add src/data/questions.json && git commit -m "chore: generate questions bank (75問)" && git push`

### 補充（カテゴリ・難易度・件数を指定）
1. `src/data/questions.json` を読んで既存IDを確認する（重複防止）
2. `prompts/system.md` を読む
3. 指定カテゴリ・難易度・件数で問題を生成する
4. `prompts/review.md` でセルフレビューする
5. `src/data/questions.json` に追記する（既存データは変更しない）
6. 追記後の総問題数・カテゴリ別内訳を表示する
7. `git add src/data/questions.json && git commit -m "chore: add {カテゴリ} {難易度} {件数}問" && git push`

## IDの採番ルール
```
{category_prefix}_{連番3桁}

カテゴリプレフィックス:
  type     → 型・文法
  pattern  → デザインパターン
  review   → コードレビュー
  refactor → リファクタリング
  react    → React/フレームワーク
  node     → Node.js/API設計
  jstricky → JS基礎・トリッキー

例: type_001, react_012, node_003, jstricky_001
```

## 注意事項
- 既存のIDと重複しないこと
- correctは0〜3のインデックス（0=A, 1=B, 2=C, 3=D）
- codeフィールドはコードがない問題では空文字""にする
- interview_likely: 技術面接で出やすい問題はtrue
