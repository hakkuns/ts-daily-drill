# 層②：問題生成プロンプト（バッチ単位）

## 生成プロンプトテンプレート

以下のテンプレートに値を埋めて使用する。

```
以下の条件でTypeScript学習問題を{N}問生成してください。

カテゴリ：{category}
難易度：{difficulty}（{difficulty_description}）
対象トピック：{topics}
問題形式：{question_formats}（複数形式をバランスよく混ぜる）

出力形式（JSONのみ・前後に説明不要）：
[
  {
    "id": "{category_prefix}_{連番3桁}",
    "category": "{category}",
    "difficulty": {1|2|3},
    "topic": "具体的なトピック名",
    "question_format": "definition|why|review|best_impl",
    "question": "問題文",
    "code": "コードブロック（なければ空文字）",
    "options": ["A. 選択肢", "B. 選択肢", "C. 選択肢", "D. 選択肢"],
    "correct": 0,
    "explanation": "解説（2〜4文）",
    "interview_likely": true|false
  }
]
```

---

## バッチ定義（全18バッチ・合計75問）

### 型・文法（20問）

**バッチ1: type ★☆☆ 7問**
```
カテゴリ：型・文法
難易度：1（★☆☆ 構文・APIを知っていれば解ける）
問題形式：definition, best_impl
トピック：
- as const と型推論の違い
- オプショナルチェーン（?.）とnon-null assertion（!）の使い分け
- Partial<T> / Required<T> / Readonly<T> / Pick<T,K> / Omit<T,K>
- unknown vs any の違い
- 型エイリアス（type）vs インターフェース（interface）の基本
```

**バッチ2: type ★★☆ 9問**
```
カテゴリ：型・文法
難易度：2（★★☆ なぜそうなるかの理解が必要）
問題形式：why, review, best_impl
トピック：
- ナローイング（typeof / instanceof / in / is）
- Union型とIntersection型の挙動の違い
- ジェネリクス制約（extends）
- satisfies演算子（TS4.9+）
- Discriminated Union（タグ付きUnion）
- never型が現れる場面
- 関数オーバーロード
```

**バッチ3: type ★★★ 4問**
```
カテゴリ：型・文法
難易度：3（★★★ 設計・トレードオフの判断が必要）
問題形式：why, best_impl
トピック：
- Conditional Types（T extends U ? X : Y）
- infer キーワード
- Mapped Types（[K in keyof T]）
- 共変・反変（covariance/contravariance）
```

---

### デザインパターン（10問）

**バッチ4: pattern ★☆☆ 2問**
```
カテゴリ：デザインパターン
難易度：1
問題形式：definition
トピック：
- Strategyパターンの定義と目的
- Singletonのアンチパターン認識（TypeScriptでのモジュールによる代替）
```

**バッチ5: pattern ★★☆ 5問**
```
カテゴリ：デザインパターン
難易度：2
問題形式：review, best_impl
トピック：
- Strategy実装（TypeScript interfaceで実装）
- Observer実装（EventEmitter的パターン）
- Factory Method
- Decorator（JavaのDecoratorパターン ≠ TSの@decorator に注意）
- Builder vs コンストラクタオーバーロード
```

**バッチ6: pattern ★★★ 3問**
```
カテゴリ：デザインパターン
難易度：3
問題形式：best_impl, why
トピック：
- 複数パターンの比較・選択（どれが最適か）
- OCP違反の検出と修正方針
- TypeScriptでのDI（依存性注入）の実現方法
```

---

### コードレビュー（10問）

**バッチ7: review ★☆☆ 2問**
```
カテゴリ：コードレビュー
難易度：1
問題形式：review
トピック：
- anyの多用（型安全性の欠如）
- 型アノテーション不足
```

**バッチ8: review ★★☆ 5問**
```
カテゴリ：コードレビュー
難易度：2
問題形式：review
トピック：
- == vs === の型的な問題
- エラーハンドリング不足（try-catchなし・res.okチェックなし）
- 非同期処理の型（Promise<T>・await忘れ）
- 型アサーション（as）の乱用
- undefinedの未考慮
```

**バッチ9: review ★★★ 3問**
```
カテゴリ：コードレビュー
難易度：3
問題形式：review
トピック：
- 設計レベルの問題（責務過多・SRP違反）
- 型が実態を表していない（anyや緩すぎる型）
- 循環依存・凝集度の問題
```

---

### リファクタリング（10問）

**バッチ10: refactor ★☆☆ 2問**
```
カテゴリ：リファクタリング
難易度：1
問題形式：best_impl
トピック：
- any → 具体的な型への置き換え
- 型アサーション（as）→ 型ガードへの置き換え
```

**バッチ11: refactor ★★☆ 5問**
```
カテゴリ：リファクタリング
難易度：2
問題形式：best_impl, why
トピック：
- 条件分岐 → Discriminated Union
- クラス継承 → コンポジション
- switch文 → Strategyパターン
- コールバック地獄 → async/await + 型
- 重複型定義 → ジェネリクス化
```

**バッチ12: refactor ★★★ 3問**
```
カテゴリ：リファクタリング
難易度：3
問題形式：best_impl
トピック：
- 複数のリファクタ案から最適を選ぶ（トレードオフあり）
- SRP・OCPの同時適用
- 型の設計変更（より表現力の高い型への移行）
```

---

### React/フレームワーク（15問）

**バッチ13: react ★☆☆ 3問**
```
カテゴリ：React/フレームワーク
難易度：1
問題形式：definition, why
トピック：
- useState の再レンダリングのトリガー条件
- useEffect の依存配列（空・あり・なしの違い）
- useRef と useState の使い分け（再レンダリングを起こさない）
```

**バッチ14: react ★★☆ 8問**
```
カテゴリ：React/フレームワーク
難易度：2
問題形式：why, review, best_impl
トピック：
- useMemo / useCallback の正しい使いどころ（過剰メモ化のアンチパターン）
- カスタムHooksへの抽出（いつ・なぜ分離するか）
- コンポーネント分割の判断基準（propsバケツリレー vs Context vs 外部状態）
- useReducer が useState より適切な場面
- Reactの再レンダリングが起きる3条件（state/props/context）
- Next.js: SSR / SSG / ISR の選択判断
- Next.js: Server Components vs Client Components の境界設計
- stateのイミュータブル更新（Javaのフィールド直接変更との違い）
```

**バッチ15: react ★★★ 4問**
```
カテゴリ：React/フレームワーク
難易度：3
問題形式：why, best_impl
トピック：
- Hooksのルール（なぜ条件分岐の中でHooksを呼べないか・内部構造）
- useEffect vs useSyncExternalStore の使い分け
- コンポーネント設計：Compound Component vs Props drilling vs Context
- パフォーマンス最適化：React.memo / useMemo / useCallback の組み合わせ
```

---

### Node.js/API設計（10問）

**バッチ16: node ★☆☆ 2問**
```
カテゴリ：Node.js/API設計
難易度：1
問題形式：definition
トピック：
- HTTPメソッドの正しい使い分け（GET/POST/PUT/PATCH/DELETE）
- RESTステータスコード（200/201/400/401/403/404/409/500の意味と使い分け）
```

**バッチ17: node ★★☆ 5問**
```
カテゴリ：Node.js/API設計
難易度：2
問題形式：why, review, best_impl
トピック：
- イベントループ：setTimeoutとPromiseの実行順序（マクロタスク vs マイクロタスク）
- async/awaitとPromise.allの使い分け（直列 vs 並列処理）
- Node.jsのシングルスレッドでI/Oがブロックしない仕組み（なぜ系）
- REST APIのリソース設計（URLの名詞/動詞問題）
- エラーレスポンスの設計（4xx系の適切なステータス選択）
```

**バッチ18: node ★★★ 3問**
```
カテゴリ：Node.js/API設計
難易度：3
問題形式：best_impl, why
トピック：
- CPU負荷の高い処理をNode.jsでどう扱うべきか（Worker Threads / 別サービス分離）
- 冪等性（idempotency）の観点からのAPI設計選択
- 認証トークンの設計（JWT vs セッションのトレードオフ）
```
