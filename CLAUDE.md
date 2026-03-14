# ts-daily-drill

## プロジェクト概要
TypeScript学習用デイリードリルアプリ。
毎日5問・4択形式・スマホPWAで動作。通勤中に使う想定。

## 技術スタック
- **フレームワーク**: Astro + React Islands
- **言語**: TypeScript（strict mode）
- **スタイリング**: Tailwind CSS + shadcn/ui（Radixベース）
- **Lint/Format**: Biome（設定ファイル1つ・保存時自動実行）
- **テスト**: Vitest
- **PWA**: @astrojs/pwa
- **パッケージ管理**: pnpm
- **スクリプト実行**: bun
- **ホスティング**: GitHub Pages
- **CI/CD**: GitHub Actions

## ディレクトリ構成
```
ts-daily-drill/
├── src/
│   ├── components/
│   │   └── DrillApp.tsx        # クイズUI本体（React Island・shadcn/ui使用）
│   ├── data/
│   │   └── questions.json      # 問題バンク（75問）
│   ├── lib/
│   │   ├── questions.ts        # 出題ロジック
│   │   └── progress.ts         # LocalStorage管理
│   └── pages/
│       └── index.astro         # シェルのみ・メタ情報
├── scripts/
│   └── generate-questions.ts   # 問題生成スクリプト（bun run）
├── .claude/
│   ├── skills/                 # Claude Codeスキル
│   ├── commands/               # カスタムコマンド
│   └── settings.json
├── .github/
│   └── workflows/
│       └── deploy.yml          # push → GitHub Pages自動デプロイ
├── docs/
│   └── prompts.md              # プロンプト設計書（3層構造）
└── CLAUDE.md
```

## よく使うコマンド
```bash
pnpm dev                                    # 開発サーバー起動
pnpm build                                  # 静的ビルド
pnpm test                                   # Vitest実行
pnpm lint                                   # Biome lint
bun run scripts/generate-questions.ts       # 問題生成（初回・補充）
```

## コーディング規約
- 関数はアロー関数で統一
- `any`は禁止・型は必ず明示（`unknown`を使う）
- コンポーネントはnamed exportで統一
- Biomeのルールに従う（保存時自動フォーマット）
- コミットメッセージはConventional Commits形式
  - `feat:` 新機能
  - `fix:` バグ修正
  - `chore:` 問題バンク更新・設定変更
  - `docs:` ドキュメント更新

## 問題JSONスキーマ
```typescript
type Question = {
  id: string                // 例: type_001, react_003
  category: string          // 型・文法 / デザインパターン / コードレビュー /
                            // リファクタリング / React/フレームワーク / Node.js/API設計 /
                            // JS基礎・トリッキー
  difficulty: 1 | 2 | 3    // ★☆☆=1 ★★☆=2 ★★★=3
  topic: string             // 具体的なトピック名
  question_format: "definition" | "why" | "review" | "best_impl"
  question: string          // 問題文
  code: string              // コードブロック（なければ空文字）
  options: string[]         // 4択（"A. ..."形式）
  correct: number           // 0〜3のインデックス
  explanation: string       // 解説（2〜4文）
  interview_likely: boolean // 技術面接で出やすい問題
}
```

## 出題ロジックの仕様
- 間違えた問題を優先出題
- 難易度は段階的に解放：★☆☆→★★☆→★★★（各難易度8割正解で昇格）
- 全問クリア後はリセットして再出題
- LocalStorageキー: `ts-drill-progress`
- 1日1セット（5問）を管理。同日2回目は「今日は完了」を表示

## 問題バンク構成（91問）
| カテゴリ             | ★☆☆ | ★★☆ | ★★★ | 合計 |
|---------------------|-----|-----|-----|------|
| 型・文法             |  7  |  9  |  4  |  20  |
| デザインパターン     |  2  |  5  |  3  |  10  |
| コードレビュー       |  2  |  5  |  3  |  10  |
| リファクタリング     |  2  |  5  |  3  |  10  |
| React/フレームワーク |  3  |  8  |  4  |  15  |
| Node.js/API設計      |  2  |  5  |  3  |  10  |
| JS基礎・トリッキー   |  3  |  9  |  4  |  16  |
| **合計**             | **21** | **46** | **24** | **91** |

## 対象者プロファイル（問題生成の前提）
- Java実務経験あり（クラスベース思考が染みついている）
- TypeScript: ジェネリクス・ユーティリティ型は使える
- 条件型・Mapped Types・inferはまだ不確実
- 使用文脈: React（学習中）+ Node.js/Honoバックエンド
- TS 5.x を前提とする

## 注意事項
- shadcn/uiはReact Islands（.tsx）の中でのみ使用（.astroでは使わない）
- questions.jsonはgitにコミットしてOK（APIキーは含まない）
- .envはgitignore済み（ANTHROPIC_API_KEYを含む）
- generate-questions.tsはローカルのbunでのみ実行（ブラウザからは叩かない）
