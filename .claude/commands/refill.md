# refill

$ARGUMENTS

問題バンクを補充します。

## 引数の形式
[カテゴリ] [難易度] [問題数]

例：
- `react ★★☆ 10`
- `type ★★★ 5`
- `node ★☆☆ 3`

## 手順
1. src/data/questions.json を読んで既存のIDと問題数を確認する
2. generate-questionsスキルのprompts/system.md を読む
3. 指定されたカテゴリ・難易度・件数で問題を生成する
4. セルフレビューを実施する
5. src/data/questions.json に重複なく追記する
6. 追記後の総問題数・カテゴリ別内訳を表示する
7. 以下のコマンドを実行する：
   ```
   git add src/data/questions.json
   git commit -m "chore: add $ARGUMENTS questions"
   git push
   ```
