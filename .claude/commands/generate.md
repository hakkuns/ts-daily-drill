# generate

questions.jsonをフルで生成します（初回・全件再生成）。

## 手順
1. generate-questionsスキルを使って全18バッチを順番に生成する
2. 各バッチ生成後にセルフレビューを実施する
3. src/data/questions.json を新規作成（既存は上書き）
4. 生成完了後にカテゴリ別・難易度別の問題数サマリーを表示する
5. 以下のコマンドを実行する：
   ```
   git add src/data/questions.json
   git commit -m "chore: generate questions bank"
   git push
   ```
