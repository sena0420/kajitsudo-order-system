# Firestore Security Rules 説明書

このドキュメントでは、本システムのFirestore Security Rulesの設計思想とルール内容を説明します。

## 設計思想

### マルチテナント対応
本システムは複数の顧客（スーパーマーケット）が利用するマルチテナントアプリケーションです。各顧客は**自分のデータのみ**にアクセスできる必要があります。

### 権限レベル
1. **管理者（Admin）**: 全てのデータにアクセス可能
2. **一般ユーザー（Customer）**: 自分の得意先IDに紐づくデータのみアクセス可能

### ゼロトラストアプローチ
- デフォルトで全てのアクセスを拒否
- 明示的に許可されたアクセスのみ通す
- クライアント側の処理は信用せず、サーバー側（Security Rules）で検証

## ヘルパー関数

### `isAuthenticated()`
ユーザーが認証済みかどうかを確認します。

```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

### `isAdmin()`
ユーザーが管理者権限を持っているかを確認します。Custom Claimsの`admin`フラグで判定します。

```javascript
function isAdmin() {
  return isAuthenticated() && (
    request.auth.token.admin == true ||
    request.auth.token.email == 'admin@example.com' // 開発用（本番では削除推奨）
  );
}
```

**Custom Claimsの設定方法**:
```bash
# Firebase Admin SDKを使用
firebase functions:shell
> admin.auth().setCustomUserClaims('ユーザーUID', { admin: true, customerId: '000001' })
```

### `getCustomerId()`
ログインユーザーの得意先IDを取得します。

```javascript
function getCustomerId() {
  return request.auth.token.customerId;
}
```

### `isOwnCustomer(customerId)`
指定された得意先IDが、ログインユーザーの得意先IDと一致するかを確認します。

```javascript
function isOwnCustomer(customerId) {
  return isAuthenticated() && getCustomerId() == customerId;
}
```

## コレクション別ルール

### 1. 顧客マスタ (`customers`)

**目的**: 顧客（スーパーマーケット）の基本情報を管理

**読み取り**:
- ✅ 管理者: 全ての顧客データ
- ✅ 一般ユーザー: 自分の顧客データのみ

**書き込み**:
- ✅ 管理者のみ

```javascript
match /customers/{customerId} {
  allow read: if isAdmin() || isOwnCustomer(customerId);
  allow create, update, delete: if isAdmin();
}
```

### 2. 納品先マスタ (`deliveryLocations`)

**目的**: 各顧客の納品先情報を管理（複数納品先対応）

**読み取り**:
- ✅ 管理者: 全ての納品先データ
- ✅ 一般ユーザー: 自分の得意先に紐づく納品先のみ

**書き込み**:
- ✅ 管理者のみ

```javascript
match /deliveryLocations/{locationId} {
  allow read: if isAdmin() || (
    isAuthenticated() &&
    existingData().customerId == getCustomerId()
  );
  allow create, update, delete: if isAdmin();
}
```

### 3. 営業担当者マスタ (`salesStaff`)

**目的**: 営業担当者の情報を管理

**アクセス**:
- ✅ 管理者のみ全アクセス可能

```javascript
match /salesStaff/{staffId} {
  allow read, write: if isAdmin();
}
```

### 4. 商品マスタ (`products`)

**目的**: 顧客ごとの商品カタログを管理

**読み取り**:
- ✅ 管理者: 全ての商品データ
- ✅ 一般ユーザー: 自分の得意先の商品のみ

**作成・削除**:
- ✅ 管理者のみ

**更新**:
- ✅ 管理者: 全フィールド更新可能
- ✅ 一般ユーザー: **発注回数（orderCount）のみ**更新可能
  - 他のフィールド（customerId, workCode, name, specification, origin, unitPrice, minDeliveryDays, isActive）は変更不可

```javascript
match /products/{productId} {
  allow read: if isAdmin() || (
    isAuthenticated() &&
    existingData().customerId == getCustomerId()
  );
  allow create, delete: if isAdmin();
  allow update: if isAdmin() || (
    isAuthenticated() &&
    existingData().customerId == getCustomerId() &&
    // 更新可能なフィールドを限定（発注回数のみ）
    incomingData().customerId == existingData().customerId &&
    // ... 他のフィールドは変更不可
  );
}
```

### 5. 発注データ (`orders`)

**目的**: 発注履歴を管理

**読み取り**:
- ✅ 管理者: 全ての発注データ
- ✅ 一般ユーザー: 自分の発注のみ

**作成**:
- ✅ 認証済みユーザー（以下の条件を満たす場合）:
  - `customerId`が自分の得意先ID
  - `userId`が自分のユーザーID
  - 必須フィールド（customerId, userId, items, totalAmount, status, createdAt）が全て存在
  - `status`が`pending`
  - `createdAt`が現在時刻

**更新**:
- ✅ 管理者: 全フィールド更新可能
- ✅ 一般ユーザー: 自分の発注のうち、**ステータスのみ**更新可能
  - 他のフィールド（customerId, userId, items, totalAmount, createdAt）は変更不可

**削除**:
- ✅ 管理者のみ

```javascript
match /orders/{orderId} {
  allow read: if isAdmin() || (
    isAuthenticated() &&
    existingData().customerId == getCustomerId()
  );
  allow create: if isAuthenticated() &&
    incomingData().customerId == getCustomerId() &&
    incomingData().userId == request.auth.uid &&
    incomingData().keys().hasAll(['customerId', 'userId', 'items', 'totalAmount', 'status', 'createdAt']) &&
    incomingData().status == 'pending' &&
    incomingData().createdAt == request.time;
  allow update: if isAdmin() || (
    isAuthenticated() &&
    existingData().customerId == getCustomerId() &&
    // ステータスのみ変更可能
    incomingData().customerId == existingData().customerId &&
    // ... 他のフィールドは変更不可
  );
  allow delete: if isAdmin();
}
```

### 6. 通知データ (`notifications`)

**目的**: メール・LINE通知のキューを管理

**読み取り**:
- ✅ 管理者のみ

**作成**:
- ✅ 認証済みユーザー（発注時に自動作成）

**更新・削除**:
- ✅ 管理者のみ

```javascript
match /notifications/{notificationId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated();
  allow update, delete: if isAdmin();
}
```

### 7. バッチ処理履歴 (`batchLogs`)

**目的**: CSV一括登録などのバッチ処理履歴を記録（将来の拡張用）

**アクセス**:
- ✅ 管理者のみ全アクセス可能

```javascript
match /batchLogs/{logId} {
  allow read, write: if isAdmin();
}
```

### 8. デフォルトルール

上記に該当しないコレクションは**全てのアクセスを拒否**します。

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

## デプロイ方法

### 1. Firebase CLIでデプロイ

```bash
firebase deploy --only firestore:rules
```

### 2. Firebase Consoleで手動デプロイ

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. Firestore Database > ルール
4. `firestore.rules`の内容をコピー＆ペースト
5. 「公開」ボタンをクリック

## Custom Claimsの設定

本番環境では、Custom Claimsを使用してユーザーの権限を管理します。

### 管理者権限の付与

```javascript
// Firebase Admin SDK (Cloud Functions または Firebase Functions Shell)
const admin = require('firebase-admin');

// 管理者権限を付与
await admin.auth().setCustomUserClaims('ユーザーUID', {
  admin: true,
  customerId: null // 管理者は特定の得意先に紐づかない
});
```

### 一般ユーザーの権限設定

```javascript
// 一般ユーザー（得意先コード: 000001）
await admin.auth().setCustomUserClaims('ユーザーUID', {
  admin: false,
  customerId: '000001'
});
```

### Custom Claimsの確認

```javascript
const user = await admin.auth().getUser('ユーザーUID');
console.log(user.customClaims); // { admin: false, customerId: '000001' }
```

## セキュリティのベストプラクティス

### ✅ やるべきこと

1. **Custom Claimsの使用**: emailアドレスベースの判定は開発環境のみ
2. **定期的なルール監査**: アクセスログを確認し、不正なアクセスがないか監視
3. **最小権限の原則**: 必要最低限の権限のみ付与
4. **フィールドレベルの制御**: 一般ユーザーが更新できるフィールドを厳密に制限

### ❌ やってはいけないこと

1. **クライアント側の検証に頼らない**: Security Rulesで必ず検証
2. **開発用ルールを本番で使用しない**: `allow read, write: if true`は絶対NG
3. **パスワードやAPIキーをFirestoreに保存しない**: 機密情報は適切に暗号化

## トラブルシューティング

### エラー: "Missing or insufficient permissions"

**原因**: Security Rulesでアクセスが拒否されています。

**解決方法**:
1. ユーザーのCustom Claimsを確認
2. Firebase Console > Firestore > ルール でルールが正しくデプロイされているか確認
3. ブラウザの開発者ツールでエラー詳細を確認

### Custom Claimsが反映されない

**原因**: トークンのリフレッシュが必要です。

**解決方法**:
```javascript
// ユーザーを再ログインさせる
await firebase.auth().signOut();
await firebase.auth().signInWithEmailAndPassword(email, password);
```

## 参考リンク

- [Firestore Security Rules 公式ドキュメント](https://firebase.google.com/docs/firestore/security/get-started)
- [Custom Claims 公式ドキュメント](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Security Rules テストツール](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
