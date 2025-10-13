# データベース移行ガイド

## 概要
このドキュメントは、本番環境でのデータベース構造変更時の標準手順を定義します。

---

## 移行プロセス（7ステップ）

### Step 1: 計画・設計
- [ ] 移行の目的と背景を文書化
- [ ] 影響範囲の特定（コレクション、ドキュメント数、コード）
- [ ] ダウンタイム戦略の決定
- [ ] ロールバック計画の作成
- [ ] ステークホルダーへの通知

### Step 2: 移行スクリプト開発
- [ ] 移行スクリプトの作成（`scripts/` ディレクトリ）
- [ ] Dry-Runモードの実装
- [ ] バッチ処理の実装（500件単位）
- [ ] エラーハンドリングの実装
- [ ] ログ出力の実装

### Step 3: ステージング環境でテスト
- [ ] 本番データのスナップショットを取得
- [ ] ステージング環境で移行実行
- [ ] データ整合性の検証
- [ ] アプリケーション全機能のテスト
- [ ] パフォーマンステスト

### Step 4: バックアップ
```bash
# Firebaseコンソールから手動エクスポート
# または CLI でエクスポート
firebase firestore:export gs://[YOUR-BUCKET]/backups/$(date +%Y%m%d-%H%M%S)
```
- [ ] Firestoreデータのエクスポート
- [ ] バックアップの検証（復元テスト）
- [ ] バックアップ保存場所の記録

### Step 5: 移行実行
#### パターンA: メンテナンスモード移行（推奨: 小規模変更）
```
1. アプリにメンテナンス画面を表示
2. 移行スクリプト実行
3. データ検証
4. メンテナンス解除
```

#### パターンB: ゼロダウンタイム移行（推奨: 大規模変更）
```
1. 新旧両対応のコードをデプロイ（後方互換性）
2. バックグラウンドで移行スクリプト実行
3. 全データ移行完了を確認
4. 古いコード削除のデプロイ
```

### Step 6: 検証
- [ ] データ件数の比較（移行前 vs 移行後）
- [ ] NULL値チェック
- [ ] サンプルデータの目視確認
- [ ] アプリケーション動作確認
- [ ] エラーログ確認

### Step 7: モニタリング
- [ ] エラーログ監視（最低24時間）
- [ ] パフォーマンスメトリクス監視
- [ ] ユーザーフィードバックの収集
- [ ] 問題発生時のロールバック準備

---

## 実例: deliveryLocationId 追加移行

### 背景
- 2025年10月9日に複数納品先機能を実装
- それ以前の15件のordersには`deliveryLocationId`フィールドが存在しない
- 発注履歴が表示されない問題が発生

### 移行計画

#### 影響範囲
- コレクション: `orders`
- 対象件数: 15件
- 追加フィールド: `deliveryLocationId`, `deliveryLocationName`
- ダウンタイム: 不要（ゼロダウンタイム移行）

#### 移行戦略（段階的アプローチ）

**フェーズ1: 後方互換性コードのデプロイ**
```javascript
// useOrders.js の修正
// 古いorders（deliveryLocationIdなし）も表示できるように
if (deliveryLocationId) {
  ordersData = ordersData.filter(order =>
    order.deliveryLocationId === deliveryLocationId ||
    !order.deliveryLocationId // 古いordersも含める
  );
}
```

**フェーズ2: 移行スクリプト実行**
```bash
# 方法1: Node.jsスクリプト
node scripts/migrateOrdersDeliveryLocation.js

# 方法2: 管理者画面から実行（推奨）
# 管理者 → マスタ管理 → データ移行タブ
```

**フェーズ3: 移行完了後の最適化**
```javascript
// deliveryLocationIdが必須であることを前提にコード最適化
// Firestoreクエリで納品先フィルタリング（複合インデックス活用）
```

---

## ベストプラクティス

### ✅ DO（すべきこと）

1. **後方互換性を保つ**
   ```javascript
   // Good: 古いデータも動作する
   const locationId = order.deliveryLocationId || 'LOC0001';

   // Bad: 古いデータでエラーになる
   const locationId = order.deliveryLocationId;
   ```

2. **段階的にリリース**
   ```
   Week 1: 後方互換性コードをデプロイ
   Week 2: 移行スクリプト実行
   Week 3: モニタリング
   Week 4: 古いコード削除
   ```

3. **詳細なログ出力**
   ```javascript
   console.log(`✅ 更新: ${doc.id} → ${deliveryLocation.name}`);
   console.log(`⚠️ スキップ: ${doc.id} (理由: すでに設定済み)`);
   console.log(`❌ エラー: ${doc.id} (エラー: ${error.message})`);
   ```

4. **Dry-Runモードの実装**
   ```javascript
   const DRY_RUN = true; // 最初はtrue
   if (!DRY_RUN) {
     await batch.commit();
   }
   ```

5. **バッチ処理で大量データに対応**
   ```javascript
   const BATCH_SIZE = 500; // Firestore制限
   if (batchCounter >= BATCH_SIZE) {
     await batch.commit();
     batch = db.batch();
     batchCounter = 0;
   }
   ```

### ❌ DON'T（避けるべきこと）

1. **バックアップなしで移行しない**
2. **本番で直接テストしない**
3. **ロールバック計画なしで実行しない**
4. **移行中にスキーマ変更しない**
5. **ユーザーへの事前通知なしで実行しない**

---

## トラブルシューティング

### 問題: 移行中にエラーが発生
```javascript
// 解決策: トランザクション/バッチの活用
try {
  await batch.commit();
} catch (error) {
  console.error('バッチ失敗:', error);
  // 個別に再試行
}
```

### 問題: 移行後もデータが表示されない
```javascript
// 原因: キャッシュ
// 解決策: ブラウザのハードリロード（Ctrl+Shift+R）
// またはFirestoreキャッシュをクリア
await clearIndexedDbPersistence(db);
```

### 問題: パフォーマンス劣化
```javascript
// 原因: インデックス不足
// 解決策: 複合インデックスを作成
// firestore.indexes.json に追加してデプロイ
```

---

## チェックリスト

移行実行前に以下を確認：

- [ ] 移行計画書を作成
- [ ] ステークホルダーに通知
- [ ] バックアップを取得
- [ ] ステージング環境でテスト完了
- [ ] Dry-Runモードで動作確認
- [ ] ロールバック手順を準備
- [ ] モニタリングツールを設定
- [ ] 緊急連絡先を確認

---

## 参考資料

- [Firestore データ移行ガイド](https://firebase.google.com/docs/firestore/manage-data/move-data)
- [バックアップとエクスポート](https://firebase.google.com/docs/firestore/manage-data/export-import)
- [セキュリティルール更新](https://firebase.google.com/docs/firestore/security/get-started)

---

**最終更新**: 2025年10月11日
