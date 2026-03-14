---
name: add-test
description: Vitestでユニットテストを追加・作成するときに使う。
  「テストを書いて」「テストを追加して」「カバレッジを上げて」
  「この関数のテストケースを考えて」と言われたら必ずこのスキルを使う。
---

# テスト追加スキル（Vitest）

## テストの対象
このプロジェクトでテストすべき主な対象：
- `src/lib/questions.ts` → 出題ロジック（最重要）
- `src/lib/progress.ts`  → LocalStorage管理ロジック

## テストファイルの配置
```
src/lib/questions.ts     → src/lib/questions.test.ts
src/lib/progress.ts      → src/lib/progress.test.ts
```

## テストの書き方

### 基本構造
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('関数名', () => {
  beforeEach(() => {
    // セットアップ
  })

  it('正常系: ○○のとき△△になる', () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected)
  })

  it('異常系: ○○がない場合は△△を返す', () => {
    // ...
  })
})
```

### LocalStorageのモック
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    clear: vi.fn(() => { store = {} }),
  }
})()
vi.stubGlobal('localStorage', localStorageMock)
```

## テストケースの網羅観点
questions.tsのテストで必ず含めること：
- 通常の5問ランダム出題
- 間違えた問題が優先されること
- 難易度ロックが機能すること（★★☆は★☆☆8割正解前はでないこと）
- 全問クリア後のリセット動作
- 今日の出題済みチェック（同日2回目は空を返す）

## 実行コマンド
```bash
pnpm test           # 全テスト実行
pnpm test --watch   # ウォッチモード
pnpm test --coverage # カバレッジ計測
```
