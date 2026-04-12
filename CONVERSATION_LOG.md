# スーパーバイヤー向け発注システム開発ログ

## 概要
このファイルは、Claude Codeを使用してスーパーバイヤー向け発注システムを開発した際の会話履歴と進捗記録です。

**開発日時**: 2025年9月2日  
**プロジェクト名**: order-system  
**プロジェクトパス**: C:\claude\project1  

## 要件定義

**ユーザーからの初期要件**:
> 顧客であるスーパーのバイヤー等が弊社の営業担当にLINEやショートメールで発注しているのを、こちらが用意したwebアプリから発注できるようにしたいです。できる限り少ない入力工数で、簡単に発注できるUIにしてほしいです。

**システム要件の詳細化**:
- 商品について：顧客ごとに異なる商品マスタ
- 商品マスタ項目：作業コード、商品名、規格、産地、単価
- 発注の流れ：数量のみ入力で発注完了
- 納期：最短納期+7日をデフォルト表示
- UI/UX：検索機能不要、よく発注する商品を上位表示
- 技術構成：Firebase（クラウドデータベース）
- その他機能：発注履歴確認、営業担当への通知

## 技術構成

### フロントエンド
- **React 18**: UIライブラリ
- **Material-UI 5**: UIコンポーネント
- **React Router**: ルーティング（単純な状態管理で実装）

### バックエンド
- **Firebase Authentication**: 認証システム
- **Cloud Firestore**: NoSQLデータベース
- **Cloud Functions**: サーバーサイド処理・通知

### 通知システム
- **Nodemailer**: メール送信
- **LINE Bot API**: LINE通知（実装予定）

## 開発進捗

### ✅ 完了したタスク

1. **プロジェクト構成とpackage.jsonのセットアップ**
   - React プロジェクトの基本構造作成
   - 必要な依存関係の定義
   - Material-UI、Firebase、React Routerの設定

2. **Firebaseプロジェクトの設定とFirestore設計**
   - Firebase設定ファイル作成 (`src/firebase/config.js`)
   - データベースサービス実装 (`src/firebase/services.js`)
   - データベース設計書作成 (`src/firebase/schema.md`)
   - 環境変数テンプレート作成 (`.env.example`)

3. **認証機能の実装（顧客ログイン）**
   - AuthContext作成 (`src/contexts/AuthContext.js`)
   - ログインページ実装 (`src/components/LoginPage.js`)
   - Firebase認証とモックデータの両対応

4. **商品マスタ管理機能の実装**
   - useProducts カスタムフック作成 (`src/hooks/useProducts.js`)
   - 商品データの取得・管理
   - 発注回数による上位表示機能

5. **発注画面UI/UXの実装（数量入力、上位表示）**
   - 発注ページ実装 (`src/components/OrderPage.js`)
   - 商品カード表示
   - 数量調整機能（+/-ボタン）
   - カート機能
   - 発注確認ダイアログ

6. **発注履歴確認機能の実装**
   - useOrders カスタムフック作成 (`src/hooks/useOrders.js`)
   - 発注履歴ページ実装 (`src/components/OrderHistory.js`)
   - アコーディオン形式での履歴表示
   - 発注ステータス管理

7. **営業担当への通知機能の実装**
   - Cloud Functions実装 (`functions/index.js`)
   - メール通知テンプレート
   - 緊急通知機能（高額・大量発注）
   - 通知ユーティリティ (`src/utils/notifications.js`)

8. **レスポンシブデザインとスマートフォン対応**
   - Material-UIテーマのカスタマイズ
   - ブレークポイント設定
   - モバイル用UI調整
   - タッチフレンドリーなボタンサイズ

### 📁 プロジェクト構造

```
C:\claude\project1\
├── public/
│   └── index.html                 # メインHTMLファイル
├── src/
│   ├── components/               # Reactコンポーネント
│   │   ├── LoginPage.js          # ログイン画面
│   │   ├── OrderPage.js          # 発注画面
│   │   └── OrderHistory.js       # 発注履歴画面
│   ├── contexts/
│   │   └── AuthContext.js        # 認証コンテキスト
│   ├── hooks/
│   │   ├── useProducts.js        # 商品管理フック
│   │   └── useOrders.js          # 発注管理フック
│   ├── firebase/
│   │   ├── config.js             # Firebase設定（デモモード対応）
│   │   ├── services.js           # Firebase操作
│   │   └── schema.md             # データベース設計書
│   ├── utils/
│   │   └── notifications.js      # 通知機能ユーティリティ
│   ├── App.js                    # メインアプリケーション
│   ├── index.js                  # エントリーポイント
│   └── index.css                 # 基本スタイル
├── functions/                    # Cloud Functions
│   ├── index.js                  # 通知処理
│   └── package.json              # Functions依存関係
├── firebase.json                 # Firebase設定
├── .env.example                  # 環境変数テンプレート
├── package.json                  # プロジェクト設定
├── README.md                     # プロジェクト説明書
├── TESTING.md                    # テスト手順書
└── CONVERSATION_LOG.md           # この会話履歴ファイル
```

## データベース設計

### コレクション構造

#### customers (顧客マスタ)
```javascript
{
  id: "CUST001",
  name: "〇〇スーパー",
  email: "customer@example.com", 
  salesStaffId: "STAFF001",
  minDeliveryDays: 2,
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### products (商品マスタ)
```javascript
{
  id: "auto-generated",
  customerId: "CUST001",
  workCode: "A123",
  name: "りんご",
  specification: "5kg箱",
  origin: "青森県", 
  unitPrice: 2500,
  orderCount: 15, // よく発注する商品判定用
  lastOrderDate: Timestamp,
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### orders (発注データ)
```javascript
{
  id: "auto-generated",
  customerId: "CUST001",
  customerName: "〇〇スーパー",
  salesStaffId: "STAFF001",
  orderDate: "2024-01-15",
  deliveryDate: "2024-01-22",
  status: "processing", // processing, shipped, delivered, cancelled
  totalAmount: 15600,
  items: [
    {
      productId: "PROD001",
      workCode: "A123",
      productName: "りんご",
      specification: "5kg箱",
      origin: "青森県",
      quantity: 3,
      unitPrice: 2500,
      subtotal: 7500
    }
  ],
  notes: "",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## テスト実施記録

### 環境セットアップ
**日時**: 2025年9月2日  
**実施者**: ユーザー  
**環境**: Windows、コマンドプロンプト  

#### セットアップ手順
1. **依存関係のインストール**: `npm install` 実行成功
2. **開発サーバーの起動**: 当初 `npm start` でエラー、`npx react-scripts start` で成功
3. **Firebase設定エラー**: invalid-api-key エラー発生
4. **Firebase設定修正**: デモモード対応により解決
5. **アプリケーション起動**: `http://localhost:3000` で正常表示

#### 発生した問題と解決方法

**問題1**: `'react-scripts' は、内部コマンドまたは外部コマンドとして認識されていません`
- **原因**: Windows環境でのパス問題
- **解決**: `npx react-scripts start` を使用

**問題2**: `Firebase: Error (auth/invalid-api-key)`
- **原因**: 環境変数未設定でFirebase初期化エラー
- **解決**: デモモード実装により Firebase 設定なしで動作可能に

### 機能テスト結果

#### ✅ ログイン機能テスト
- **テスト内容**: 任意の顧客ID・パスワードでログイン
- **結果**: 成功
- **確認事項**: 
  - ログイン画面が正常表示
  - デモモードメッセージがコンソールに表示
  - ログイン後、発注画面に遷移

#### 🔄 発注機能テスト（実施予定）
- 商品一覧表示
- 数量調整機能
- カート機能
- 発注確認・実行

#### 🔄 発注履歴テスト（実施予定）
- 履歴一覧表示
- 詳細情報展開

#### 🔄 レスポンシブデザインテスト（実施予定）
- モバイル表示確認
- タブレット表示確認

## 実装されている主要機能

### 🔐 認証システム
- 顧客ID・パスワードによるログイン
- デモモード（Firebase設定不要）
- セッション管理

### 📦 商品管理
- 顧客別商品マスタ
- 発注回数による上位表示
- 商品情報（作業コード、名前、規格、産地、価格、納期）

### 🛒 発注システム
- 直感的な数量調整（+/-ボタン）
- リアルタイム合計計算
- 発注確認ダイアログ
- 発注完了通知

### 📊 発注履歴
- 時系列での履歴表示
- ステータス管理（処理中、配送中、完了）
- 詳細情報の展開表示

### 📱 レスポンシブ対応
- デスクトップ・タブレット・スマートフォン対応
- タッチフレンドリーなUI
- 適応的なレイアウト

### 📧 通知システム
- 営業担当者への自動メール通知
- 緊急通知（高額・大量発注）
- LINE通知対応（実装予定）

## モックデータ

### 商品データサンプル
- りんご (5kg箱) - 青森県 - ¥2,500
- みかん (10kg箱) - 愛媛県 - ¥3,200  
- バナナ (13kg箱) - フィリピン - ¥1,800
- キャベツ (1玉) - 群馬県 - ¥150
- トマト (4kg箱) - 熊本県 - ¥1,200

### 発注履歴サンプル
- 2024年1月15日発注 - 合計¥15,600 (配送完了)
- 2024年1月10日発注 - 合計¥8,400 (配送中)
- 2024年1月8日発注 - 合計¥5,000 (処理中)

## 今後の拡張予定

### 短期的な改善
- [ ] Firebase本格連携
- [ ] LINE通知機能の完全実装
- [ ] 管理者画面の追加

### 中期的な機能追加
- [ ] 定期発注機能
- [ ] 在庫連携システム
- [ ] 価格変動通知
- [ ] 発注承認ワークフロー

### 長期的な展開
- [ ] 複数サプライヤー対応
- [ ] AI推奨発注機能
- [ ] 配送追跡機能
- [ ] 売上分析ダッシュボード

## トラブルシューティング

### よくある問題

#### npm start が動作しない
```bash
# 解決方法
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npx react-scripts start
```

#### ポート3000が使用中
```bash
# 別のポートを使用
npm start -- --port 3001
```

#### Firebase エラー
- デモモードで動作するため、Firebase設定は不要
- 本番環境では `.env` ファイルで設定

## 技術的メモ

### カスタムフック活用
- `useProducts`: 商品データ管理、発注回数更新
- `useOrders`: 発注履歴管理、楽観的更新
- `useAuth`: 認証状態管理、Firebase/モック両対応

### Material-UI カスタマイズ
- レスポンシブブレークポイント設定
- モバイル用ボタンサイズ調整
- テーブルのモバイル対応

### Firebase 設計
- セキュリティルール設計済み
- インデックス設計完了
- Cloud Functions による自動通知

## 参考ファイル
- [README.md](./README.md): プロジェクト概要と使用方法
- [TESTING.md](./TESTING.md): 詳細なテスト手順
- [src/firebase/schema.md](./src/firebase/schema.md): データベース設計詳細

## 連絡事項
このプロジェクトはClaude Codeを使用して開発されました。質問や改善要望がある場合は、このファイルと関連する技術情報を参照してください。

---

## 2025年10月6日の開発作業

### 実装した機能

#### 1. **管理者画面 - 実行履歴タブの詳細機能実装**

**場所**: `src/components/AdminPage.js` - 実行履歴タブ

**実装内容**:
- ✅ **詳細表示機能**: 各ログ行を展開してアップロード者、処理結果の詳細を表示
- ✅ **エラー詳細ダイアログ**: エラーボタンクリックで全エラーを一覧表示（行番号、フィールド名、エラー内容、入力値）
- ✅ **フィルタリング機能**: データ種別（全て/商品/顧客）と期間（開始日〜終了日）で絞り込み
- ✅ **ページネーション**: 10件ごとに表示、ページ切り替え機能
- ✅ **充実したモックデータ**: 5件の履歴データ、成功/一部エラー/完了の各ステータス

#### 2. **CSV文字化け対策（BOM付きUTF-8対応）**

**問題**: ExcelでUTF-8のCSVファイルをダブルクリックで開くと文字化けする

**解決策**: BOM（Byte Order Mark）付きUTF-8での入出力

**実装箇所**:
- ✅ **CSVダウンロード時**: BOM（`0xEF, 0xBB, 0xBF`）を先頭に追加
  - エラー行ダウンロード
  - テンプレートダウンロード
- ✅ **CSVアップロード時**: BOM（`\uFEFF`）を自動検出・除去

**効果**: Excelでダブルクリックしても日本語が正常に表示される

#### 3. **エラー行CSVダウンロード機能の改善**

**ユーザー要望**:
> エラー一覧をダウンロードし、そのファイルを修正したら、それをアップロードすれば修正が完了するようにしたい

**実装内容**:
- ✅ **元の行データの保持**: エラー履歴に`rowData`プロパティを追加して、エラー発生時の元のCSVデータを完全に保存
- ✅ **元のCSVと同じ形式で出力**: エラー行のみを元のアップロードファイルと同じ列構成で出力
- ✅ **警告メッセージの追加**:
  - 処理日時の明示
  - 古いデータで上書きするリスクの警告
  - 速やかなアップロードの推奨

**出力例（商品マスタ）**:
```csv
customerId,customerName,workCode,productName,specification,origin,quantity,boxPrice,leadTime
000001,サンプル顧客,00015,トマト,1箱,北海道,10,ABC,3
000002,テスト商店,123,きゅうり,1袋,群馬県,20,800,2
```

**使用フロー**:
1. エラー詳細ダイアログで「エラー行をダウンロード」
2. Excelで開く（BOM付きUTF-8なので文字化けなし）
3. エラー箇所を修正（例: ABC → 1200）
4. 上書き保存
5. 一括更新タブで修正済みCSVを再アップロード
6. Upsert処理で該当行のみ更新（正常行は影響なし）

#### 4. **データ管理リスクへの対応**

**リスク分析**:
- 古いデータでの上書きリスク（エラーCSVをダウンロード後、他の担当者がマスタを更新した場合）
- 部分的なデータ不整合

**対策**:
- エラー詳細ダイアログに警告メッセージを表示
- 処理日時を明示して、データの鮮度を確認可能に
- 速やかなアップロードを推奨

### 技術的な実装詳細

#### BOM付きUTF-8の実装
```javascript
// ダウンロード時
const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });

// アップロード時
if (text.charCodeAt(0) === 0xFEFF) {
  text = text.substring(1); // BOMを除去
}
```

#### エラー行データ構造
```javascript
{
  row: 15,
  field: 'boxPrice',
  error: '単価が数値ではありません',
  value: 'ABC',
  rowData: {
    customerId: '000001',
    customerName: 'サンプル顧客',
    workCode: '00015',
    productName: 'トマト',
    specification: '1箱',
    origin: '北海道',
    quantity: '10',
    boxPrice: 'ABC',
    leadTime: '3'
  }
}
```

### 完成した機能一覧

**管理者画面（AdminPage）**:
- ✅ 一括更新タブ（CSV一括アップロード）
- ✅ 手動管理タブ（個別登録）
- ✅ **実行履歴タブ（詳細機能完備）** ← 今回実装
  - 詳細表示・展開機能
  - エラー詳細ダイアログ
  - フィルタリング（データ種別、期間）
  - ページネーション
  - エラー行CSVダウンロード
  - 警告メッセージ表示

**CSV関連機能**:
- ✅ BOM付きUTF-8対応（文字化け対策）
- ✅ テンプレートダウンロード
- ✅ エラー行のみダウンロード
- ✅ 自動フォーマット（得意先コード6桁、作業コード5桁）
- ✅ パスワード自動生成

### ファイル更新履歴

**更新ファイル**:
- `src/components/AdminPage.js`
  - 実行履歴タブUI大幅拡張（900行 → 1700行以上）
  - モックデータに元の行データを追加
  - BOM対応のCSV入出力実装
  - エラー詳細ダイアログ実装
  - フィルタリング・ページネーション実装

### 次回への引き継ぎ事項

**完了した作業**:
- ✅ 管理者画面のマスタデータ管理機能は完成
- ✅ CSV文字化け問題を解決
- ✅ エラー修正フローを完全に整備

**今後の検討事項**:
1. Firebase本番環境への接続
2. 営業担当者向け画面の設計・実装
3. 画面遷移・権限設計の整理
4. 実データでのテスト

**技術的な課題**:
- 実際のFirebase Cloud Functionsの実装（現在はモックのみ）
- 認証システムの本格実装
- セキュリティルールの適用

---

## 2025年10月7日の開発作業

### 実装した機能

#### 1. **発注データエクスポート機能の実装**

**場所**: `src/components/AdminPage.js` - 発注データエクスポートタブ（新規追加）

**実装内容**:
- ✅ **管理者画面に4つ目のタブを追加**: 発注データエクスポート
- ✅ **エクスポート条件のフィルタリング**:
  - 期間指定（開始日〜終了日）
  - 得意先指定（オートコンプリート）
  - ステータス指定（全て/処理中/配送中/配送完了）
  - リアルタイムでエクスポート対象件数を表示

- ✅ **出力列の自由選択**:
  - デフォルト列: 作業コード、配送日、数量、直送コード
  - 利用可能な列: 発注日、得意先コード、得意先名、作業コード、商品名、規格、産地、数量、単価、配送日、ステータス、直送コード
  - 列選択ダイアログで直感的に選択可能
  - すべて選択/すべて解除機能

- ✅ **出力形式の選択**:
  - **CSV形式**: BOM付きUTF-8（Excelで文字化けしない）
  - **Excel形式**: `.xlsx`形式で出力
  - ラジオボタンで切り替え

- ✅ **販売管理システム連携対応**:
  - 直送コードフィールドを追加（デフォルトは空欄）
  - 出力列を自由にカスタマイズ可能
  - CSV/Excel両対応で既存システムに柔軟に対応

**技術実装**:
- `xlsx`ライブラリを使用したExcel出力
- BOM付きUTF-8でのCSV出力（文字化け対策）
- localStorageを活用した発注データ管理

**使用フロー**:
1. 管理者画面の「発注データエクスポート」タブを開く
2. エクスポート条件を設定（期間、得意先、ステータス）
3. 「列を選択」ボタンで出力する列を選択
4. CSV/Excelをラジオボタンで選択
5. ダウンロードボタンでエクスポート
6. 販売管理システムにインポート

---

#### 2. **発注履歴管理とステータス自動更新機能の実装**

**実装箇所**:
- `src/hooks/useOrders.js` - 発注履歴フックの大幅拡張
- `src/components/OrderPage.js` - 発注時の履歴追加
- `src/components/OrderHistory.js` - ステータス表示の更新
- `src/components/AdminPage.js` - エクスポート時のステータス更新

**ステータスフロー**:
```
発注ボタン → 「発注済み」 → エクスポート → 「処理中」 → 納期到来 → 「配送完了」
```

**詳細機能**:

1. **発注時の自動履歴追加**
   - ユーザーが発注ボタンを押した瞬間に履歴に追加
   - ステータス: 「発注済み」（`ordered`）
   - localStorageに保存（ブラウザをリロードしても保持）

2. **管理者エクスポート時の自動ステータス更新**
   - AdminPageで発注データをCSV/Excelエクスポート
   - エクスポートされた「発注済み」の発注は自動的に「処理中」（`processing`）に変更
   - 全顧客のlocalStorageを横断的に更新

3. **納期による自動ステータス更新**
   - 発注履歴ページを開いた際に自動チェック
   - 納期が今日以前で、ステータスが「処理中」または「配送中」の場合
   - 自動的に「配送完了」（`delivered`）に更新

4. **リアルタイムデータ同期**
   - すべての画面でlocalStorageを共有
   - 発注ページ、履歴ページ、管理者画面で常に最新状態を表示

**ステータスアイコン**:
- 発注済み: 📄 (Receipt)
- 処理中: ⏰ (Schedule)
- 配送中: 🚚 (LocalShipping)
- 配送完了: ✅ (CheckCircle)

**データ永続化**:
- localStorageを使用して顧客ごとに発注データを保存
- キー: `orders_${customerId}`
- 形式: JSON配列

---

### 技術的な実装詳細

#### 発注データエクスポート機能

**モックデータ構造**:
```javascript
{
  id: 'ORD12345678',
  orderDate: '2025-10-07',
  deliveryDate: '2025-10-09',
  customerId: '000001',
  customerName: 'サンプル顧客',
  status: 'ordered', // ordered, processing, shipped, delivered
  items: [
    {
      workCode: '00001',
      productName: 'トマト',
      specification: '1箱',
      origin: '北海道',
      quantity: 10,
      unitPrice: 1200,
      deliveryDate: '2025-10-09'
    }
  ]
}
```

**CSV出力（BOM付きUTF-8）**:
```javascript
const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
```

**Excel出力（xlsxライブラリ）**:
```javascript
const worksheet = XLSX.utils.json_to_sheet(rows);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, '発注データ');
XLSX.writeFile(workbook, `orders_export_${timestamp}.xlsx`);
```

#### 発注履歴管理機能

**localStorageデータ管理**:
```javascript
// 保存
localStorage.setItem(`orders_${customerId}`, JSON.stringify(ordersData));

// 読み込み
const savedOrders = JSON.parse(localStorage.getItem(`orders_${customerId}`));

// ステータス更新
const updatedOrders = orders.map(order =>
  orderIds.includes(order.id)
    ? { ...order, status: newStatus, updatedAt: new Date() }
    : order
);
```

**納期による自動更新ロジック**:
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

const deliveryDate = new Date(order.deliveryDate);
deliveryDate.setHours(0, 0, 0, 0);

if (deliveryDate <= today && (order.status === 'processing' || order.status === 'shipped')) {
  return { ...order, status: 'delivered', updatedAt: new Date() };
}
```

---

### ファイル更新履歴

**新規作成**:
- なし（既存ファイルの拡張のみ）

**更新ファイル**:
1. **src/components/AdminPage.js**
   - 発注データエクスポートタブを追加（4つ目のタブ）
   - エクスポート機能の実装（CSV/Excel）
   - エクスポート時のステータス自動更新機能
   - モックデータをlocalStorageから取得するように変更
   - 約300行追加

2. **src/hooks/useOrders.js**
   - localStorageへのデータ保存機能
   - ステータス更新機能（単一・複数）
   - 納期による自動ステータス更新機能
   - 約100行追加

3. **src/components/OrderPage.js**
   - useOrdersフックの統合
   - 発注時に履歴へ自動追加
   - 約5行変更

4. **src/components/OrderHistory.js**
   - 「発注済み」ステータスの追加
   - Receiptアイコンの追加
   - 約10行変更

5. **package.json**
   - `xlsx`ライブラリの追加

---

### 完成した機能一覧

**管理者画面（AdminPage）**:
- ✅ 一括更新タブ（CSV一括アップロード）
- ✅ 手動管理タブ（個別登録）
- ✅ 実行履歴タブ（詳細機能完備）
- ✅ **発注データエクスポートタブ（新規）** ← 今回実装
  - 期間・得意先・ステータスフィルタ
  - 出力列の自由選択
  - CSV/Excel両対応
  - エクスポート時の自動ステータス更新

**発注履歴管理システム**:
- ✅ **発注時の自動履歴追加** ← 今回実装
- ✅ **ステータス管理システム** ← 今回実装
  - 発注済み（ordered）
  - 処理中（processing）
  - 配送中（shipped）
  - 配送完了（delivered）
- ✅ **納期による自動ステータス更新** ← 今回実装
- ✅ **localStorageによるデータ永続化** ← 今回実装

---

### 次回への引き継ぎ事項

**完了した作業**:
- ✅ 発注データエクスポート機能の完成
- ✅ 発注履歴とステータス管理システムの完成
- ✅ 販売管理システム連携の基盤整備

**今後の検討事項**:
1. Firebase本番環境への接続（localStorageからFirestoreへの移行）
2. 営業担当者向け画面の設計・実装
3. 配送中（shipped）ステータスへの手動更新機能
4. 発注履歴の検索・フィルタリング機能
5. 実データでのテスト

**技術的な課題**:
- localStorageはブラウザ依存のため、複数デバイス間での同期が必要な場合はFirestoreへの移行が必要
- 発注データのバックアップ機能の検討
- 大量データのパフォーマンス最適化

**ユーザー要望対応**:
- ✅ CSV/Excelエクスポートでの販売管理システム連携
- ✅ 発注履歴のリアルタイム反映
- ✅ ステータス管理の自動化

---

## 2025年10月8日の開発作業

### 実装した機能

#### 1. **管理者画面の分割とPDF帳票出力機能の実装**

**実装内容**:
- ✅ **管理者画面を2つに分割**:
  - マスタデータ管理画面（AdminPage）
  - 受注データ管理画面（OrderManagementPage - 新規作成）

- ✅ **受注データエクスポート機能**:
  - CSV/Excelエクスポート（AdminPageから移行）
  - 名称変更：「発注データエクスポート」→「受注データエクスポート」

- ✅ **PDF帳票出力機能（新規実装）**:
  - html2canvas + jsPDFでの日本語対応PDF生成
  - ページごとにヘッダー・フッターを表示
  - 1ページ13行のデータ表示
  - ページ番号表示（現在ページ / 総ページ数）
  - 日付形式の統一（yyyy/mm/dd）
  - カスタマイズされた列幅とフォントサイズ

**PDF帳票のレイアウト**:
- ヘッダー: 「受注データ帳票」
- 列構成: 作業CD、納品日、得意先、商品名、規格、産地、数量（太字・大きめ）、単価、小計、発注日、ステータス
- フッター: ページ番号（17pxフォント）
- 背景色: 確認済み=グレー、それ以外=白

---

#### 2. **Firebase本番環境への接続**

**実装箇所**:
- `.env` - Firebase設定情報（新規作成）
- `src/firebase/config.js` - measurementId追加
- `src/contexts/AuthContext.js` - Firestore連携、emailベース認証
- `src/components/LoginPage.js` - メールアドレスログインへ変更
- `src/hooks/useProducts.js` - Firestoreからの商品データ取得
- `src/components/OrderPage.js` - Firestoreへの発注データ保存
- `src/hooks/useOrders.js` - Firestoreからの発注履歴取得
- `firestore.rules` - セキュリティルール（新規作成）
- `firestore.indexes.json` - インデックス定義（新規作成）

**Firebase設定内容**:
1. **Firestoreデータベース**:
   - Standard エディション
   - ロケーション: asia-northeast1（東京）
   - 初期データ投入: customers, products

2. **Authentication**:
   - メール/パスワード認証を有効化
   - テストユーザー作成: `sakura@example.com`
   - 管理者ユーザー作成: `admin@example.com`

3. **セキュリティルール**:
   - 認証済みユーザーのみアクセス可能
   - 顧客は自分のemailと一致するデータのみ読み取り可能
   - 管理者は全データへのアクセス可能
   - emailベースの認証（Custom Claimは今後実装）

4. **複合インデックス**:
   - products: `customerId, isActive, orderCount`
   - orders: `customerId, createdAt`

**データフロー**:
```
ログイン
  ↓ (Firebase Authentication)
Firestoreから顧客情報取得
  ↓
商品一覧表示（Firestoreから取得）
  ↓
発注実行（Firestoreに保存）
  ↓
発注履歴表示（Firestoreから取得）
```

---

#### 3. **ステータスフィルター機能の改善**

**実装内容**:
- ✅ **マルチセレクトチェックボックス方式**:
  - 単一選択ドロップダウンから複数選択チェックボックスへ変更
  - デフォルト選択：「処理待ち」「変更処理待ち」のみ
  - 「確認済」はデフォルトで除外

- ✅ **除外条件の設定が可能**:
  - チェックを外したステータスは出力対象外
  - 受注データエクスポートとPDF帳票出力の両方で適用

**実装箇所**:
- `src/components/OrderManagementPage.js`

---

### 技術的な実装詳細

#### Firebase接続の実装

**.env（新規作成）**:
```env
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=easy-order-6a6y1eaf
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
```

**useProducts.js（Firestore連携）**:
```javascript
if (isFirebaseAvailable) {
  const productsRef = collection(db, 'products');
  const q = query(
    productsRef,
    where('customerId', '==', customerId),
    where('isActive', '==', true),
    orderBy('orderCount', 'desc')
  );
  const querySnapshot = await getDocs(q);
  const productsData = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setProducts(productsData);
}
```

**OrderPage.js（発注データ保存）**:
```javascript
if (isFirebaseAvailable) {
  const ordersRef = collection(db, 'orders');
  await addDoc(ordersRef, {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
```

**useOrders.js（発注履歴取得）**:
```javascript
if (isFirebaseAvailable) {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  const ordersData = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date()
  }));
  setOrders(ordersData);
}
```

#### PDF帳票出力の実装

**html2canvasによる日本語対応**:
```javascript
const element = document.getElementById('pdf-content');
const canvas = await html2canvas(element, {
  scale: 2,
  useCORS: true,
  logging: false
});

const imgData = canvas.toDataURL('image/png');
const pdf = new jsPDF('l', 'mm', 'a4');
const pdfWidth = pdf.internal.pageSize.getWidth();
const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
pdf.save(`受注帳票_${timestamp}.pdf`);
```

**ページ分割処理**:
```javascript
const rowsPerPage = 13;
const totalPages = Math.ceil(allRows.length / rowsPerPage);

for (let pageNum = 0; pageNum < totalPages; pageNum++) {
  const startIdx = pageNum * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const pageRows = allRows.slice(startIdx, endIdx);

  // HTMLテーブル生成、pdf化
}
```

---

### ファイル更新履歴

**新規作成**:
1. **`.env`** - Firebase設定情報
2. **`firestore.rules`** - Firestoreセキュリティルール
3. **`firestore.indexes.json`** - Firestore複合インデックス定義
4. **`src/components/OrderManagementPage.js`** - 受注データ管理画面（約650行）
5. **`scripts/seedData.js`** - 初期データ投入スクリプト（参考用）

**更新ファイル**:
1. **`src/App.js`**
   - 管理者ナビゲーションを2つに分割（マスタ管理、受注管理）
   - OrderManagementPageのインポートとルーティング追加

2. **`src/firebase/config.js`**
   - measurementIdの追加

3. **`src/contexts/AuthContext.js`**
   - Firestoreから顧客情報を取得する処理を追加
   - emailベースの認証に変更
   - メール/パスワードでのログイン処理実装

4. **`src/components/LoginPage.js`**
   - 顧客IDからメールアドレスへの入力変更

5. **`src/hooks/useProducts.js`**
   - Firestoreからの商品データ取得処理を追加
   - 発注回数のFirestore更新処理を追加
   - デモモードとの両対応

6. **`src/components/OrderPage.js`**
   - Firestoreへの発注データ保存処理を追加
   - デモモードとの両対応

7. **`src/hooks/useOrders.js`**
   - Firestoreからの発注履歴取得処理を追加
   - デモモードとの両対応

8. **`src/components/AdminPage.js`**
   - 発注データエクスポート機能を削除（OrderManagementPageに移行）
   - 3つのタブ構成に変更

---

### 完成した機能一覧

**Firebase連携機能**:
- ✅ **Firestore Database連携** ← 今回実装
  - 商品データの取得・更新
  - 発注データの保存・取得
  - 発注履歴の管理
- ✅ **Firebase Authentication連携** ← 今回実装
  - メール/パスワード認証
  - セッション管理
  - 顧客情報の紐付け
- ✅ **セキュリティルール設定** ← 今回実装
  - emailベースの認証・認可
  - 顧客データの分離
  - 管理者権限の管理

**受注データ管理画面（OrderManagementPage）**:
- ✅ **受注データエクスポートタブ** ← AdminPageから移行
  - CSV/Excelエクスポート
  - マルチセレクトフィルター
- ✅ **PDF帳票出力タブ** ← 今回実装
  - 日本語対応PDF生成
  - ページング対応
  - カスタムレイアウト

**マスタデータ管理画面（AdminPage）**:
- ✅ 一括更新タブ
- ✅ 手動管理タブ
- ✅ 実行履歴タブ

---

### 発生した問題と解決方法

#### 問題1: jsPDFでの日本語文字化け
- **原因**: jsPDFはデフォルトで日本語フォントに対応していない
- **解決**: html2canvasでHTMLをキャンバスに変換してからPDF化

#### 問題2: Firestoreセキュリティルールエラー
- **原因**: Custom Claimを参照するルールだが、Custom Claimが未設定
- **解決**: emailベースの認証に一時的に変更

#### 問題3: 複合インデックスエラー
- **原因**: 複数条件のクエリには事前にインデックス作成が必要
- **解決**: Firebase Consoleでエラーメッセージのリンクからインデックスを作成

#### 問題4: ブラウザキャッシュで環境変数が読み込まれない
- **原因**: 開発サーバー起動時に環境変数を読み込むため、.env作成後の再起動が必要
- **解決**: 開発サーバーを完全に停止・再起動

---

### 動作確認結果

#### ✅ Firebase認証テスト
- **テスト内容**: `sakura@example.com`でログイン
- **結果**: 成功
- **確認事項**:
  - Firebase Authenticationでログイン成功
  - Firestoreから顧客情報を取得
  - ユーザー情報が正しく表示される

#### ✅ 商品データ取得テスト
- **テスト内容**: 発注画面で商品一覧を表示
- **結果**: 成功
- **確認事項**:
  - Firestoreから3つの商品データを取得
  - りんご、みかん、キャベツが表示される
  - 発注回数順にソートされている

#### ✅ 発注データ保存テスト
- **テスト内容**: 商品を発注してFirestoreに保存
- **結果**: 成功
- **確認事項**:
  - 「発注が完了しました」メッセージ表示
  - Firebase Consoleでordersコレクションにデータが追加されている
  - 発注データの内容が正しい

#### ✅ 発注履歴取得テスト
- **テスト内容**: 履歴タブでFirestoreから発注履歴を取得
- **結果**: 成功（インデックス作成後）
- **確認事項**:
  - 複合インデックス作成後、履歴が正常に表示される
  - 発注日時、納期、金額が正しく表示される
  - ステータスが正しく表示される

#### ✅ PDF帳票出力テスト
- **テスト内容**: 受注データをPDF形式で出力
- **結果**: 成功
- **確認事項**:
  - 日本語が正しく表示される
  - ページングが正しく機能する
  - レイアウトが仕様通り

---

### 次回への引き継ぎ事項

**完了した作業**:
- ✅ Firebase本番環境への接続完了
- ✅ 商品・発注データのFirestore連携完了
- ✅ PDF帳票出力機能の実装完了
- ✅ 管理者画面の分割完了

**今後の検討事項**:
1. **Custom Claimの設定**:
   - Cloud FunctionsまたはFirebase CLIでcustomerIdとadminフラグを設定
   - セキュリティルールをCustom Claimベースに変更

2. **発注履歴の数量変更機能**:
   - リードタイムチェック
   - ステータス変更（pending → change_pending）

3. **管理者機能の拡張**:
   - 受注確認・ステータス変更機能
   - マスタデータのFirestore連携

4. **通知機能の実装**:
   - Cloud Functionsでの自動メール通知
   - LINE通知（オプション）

5. **パフォーマンス最適化**:
   - リアルタイムリスナーの実装
   - キャッシュ戦略の検討

6. **セキュリティ強化**:
   - より詳細な権限管理
   - 監査ログの実装

**技術的な課題**:
- Custom Claimの設定方法（Cloud Functions or Firebase Admin SDK）
- 大量データでのパフォーマンス検証
- エラーハンドリングの強化

**Firebaseプロジェクト情報**:
- プロジェクトID: `easy-order-6a6y1eaf`
- プラン: Spark（無料プラン）
- ロケーション: asia-northeast1（東京）
- 認証: メール/パスワード
- データベース: Firestore（Standardエディション）

---

## 2025年10月9日の開発作業

### 実装した機能

#### 1. **納品先（deliveryLocations）機能の実装**

**背景**:
- 1つの得意先が複数の納品場所（本店、第2倉庫など）への納品を希望するケースに対応
- 得意先と納品先を分けて管理する必要がある

**データ構造の設計**:
```
得意先 - 納品先A - 商品A/B/C
       - 納品先B - 商品A/C
```

**実装内容**:

1. **deliveryLocationsコレクションのスキーマ設計**
   - ドキュメントID: LOC0001形式（4桁、最大9999箇所まで対応）
   - フィールド: customerId, name, address, zipCode, phone, contactPerson, notes, displayOrder, isActive

2. **Firestoreへのテストデータ作成**
   - LOC0001: 本店
   - LOC0002: 第2倉庫

3. **既存productsコレクションへのdeliveryLocationId追加**
   - 全商品にdeliveryLocationIdを追加

4. **AuthContextへの納品先選択機能追加**
   - deliveryLocations stateの追加
   - ログイン時に納品先一覧を取得
   - setDeliveryLocation関数の実装
   - デモモード対応

5. **納品先選択画面の作成（DeliveryLocationSelector.js）**
   - ログイン後、納品先未選択の場合に表示
   - カード形式で納品先を一覧表示
   - クリックで納品先を選択

6. **商品・注文表示の納品先フィルタリング**
   - useProductsに deliveryLocationId パラメータを追加
   - useOrdersに deliveryLocationId パラメータを追加
   - Firestoreクエリに納品先フィルターを追加
   - デモモードのモックデータにdeliveryLocationIdを追加

7. **発注データへの納品先情報保存**
   - deliveryLocationId（納品先ID）
   - deliveryLocationName（納品先名、スナップショット）

**ユーザーフロー**:
```
ログイン → 納品先選択画面 → 納品先を選択 → 該当納品先の商品のみ表示
```

**管理者フロー**（今後実装予定）:
```
出力条件で得意先を選択 → 関連する納品先のみドロップダウン表示
→ 納品先を選択しなければ全納品先を一括エクスポート
```

---

#### 2. **Security Rulesの更新**

**問題**:
- ログインページにアクセスした時点でFirestoreへのアクセスが発生
- セキュリティルールが厳しすぎてエラーが発生

**解決策**:
1. **deliveryLocationsコレクションのルール追加**:
   ```javascript
   match /deliveryLocations/{locationId} {
     allow read: if isAuthenticated();
     allow write: if isAdmin();
   }
   ```

2. **customersコレクションの読み取り権限を緩和**:
   ```javascript
   match /customers/{customerId} {
     // 開発中: 認証済みユーザーは全て読み取り可能
     allow read: if isAuthenticated();
     allow write: if isAdmin();
   }
   ```

3. **Firebase Consoleへのデプロイ**:
   - Firestore Database > ルール タブで手動デプロイ

---

### 技術的な実装詳細

#### スキーマ設計（schema.md更新）

**deliveryLocationsコレクション**:
```javascript
{
  id: "LOC0001", // Document ID（4桁）
  customerId: "CUST001", // 得意先ID
  name: "本店", // 納品先名
  address: "東京都渋谷区〇〇1-2-3", // 住所（オプション）
  zipCode: "150-0001", // 郵便番号（オプション）
  phone: "03-1234-5678", // 電話番号（オプション）
  contactPerson: "山田花子", // 担当者名（オプション）
  notes: "", // 備考（オプション）
  displayOrder: 1, // 表示順序（オプション）
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**products更新**:
```javascript
{
  // ... 既存フィールド
  deliveryLocationId: "LOC0001", // 追加
  // ...
}
```

**orders更新**:
```javascript
{
  // ... 既存フィールド
  deliveryLocationId: "LOC0001", // 追加
  deliveryLocationName: "本店", // 追加（スナップショット）
  // ...
}
```

**Firestoreインデックス**:
- deliveryLocations: `customerId, isActive`
- products: `customerId, deliveryLocationId, orderCount (desc)`
- orders: `customerId, deliveryLocationId, createdAt (desc)`

---

#### AuthContextの実装

**納品先一覧取得**:
```javascript
// Firestoreから納品先一覧を取得
const locationsRef = collection(db, 'deliveryLocations');
const locationsQuery = query(
  locationsRef,
  where('customerId', '==', customerDoc.id),
  where('isActive', '==', true)
);
const locationsSnapshot = await getDocs(locationsQuery);
const locationsData = locationsSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
setDeliveryLocations(locationsData);
```

**ユーザーオブジェクト**:
```javascript
setUser({
  uid: firebaseUser.uid,
  customerId: customerDoc.id,
  customerName: customerData.name,
  email: firebaseUser.email,
  salesStaffId: customerData.salesStaffId,
  isAdmin: isAdmin,
  deliveryLocationId: null, // 初期値はnull
  deliveryLocationName: null
});
```

**納品先選択関数**:
```javascript
const setDeliveryLocation = (locationId, locationName) => {
  if (user) {
    setUser({
      ...user,
      deliveryLocationId: locationId,
      deliveryLocationName: locationName
    });
  }
};
```

---

#### 納品先選択画面（DeliveryLocationSelector.js）

**UI構成**:
- タイトル: 「納品先を選択してください」
- 顧客名表示
- 納品先カード（Grid表示）
  - アイコン（StorefrontIcon）
  - 納品先名
  - 住所、電話番号、担当者（オプション）
- ホバー時にカードが浮き上がる

**選択処理**:
```javascript
const handleLocationSelect = (location) => {
  setDeliveryLocation(location.id, location.name);
  navigate('/order');
};
```

---

#### App.jsの修正

**納品先選択画面の表示制御**:
```javascript
// 納品先未選択の場合は選択画面を表示（管理者を除く）
if (!user.isAdmin && !user.deliveryLocationId) {
  return <DeliveryLocationSelector />;
}
```

**AppBarへの納品先名表示**:
```javascript
<Typography variant="h6">
  発注システム - {user.customerName}
  {user.deliveryLocationName && ` / ${user.deliveryLocationName}`}
</Typography>
```

---

#### 商品・注文のフィルタリング実装

**useProducts.js**:
```javascript
export const useProducts = (customerId, deliveryLocationId = null) => {
  // ...
  const queryConstraints = [
    where('customerId', '==', customerId),
    where('isActive', '==', true)
  ];

  if (deliveryLocationId) {
    queryConstraints.push(where('deliveryLocationId', '==', deliveryLocationId));
  }

  queryConstraints.push(orderBy('orderCount', 'desc'));
  const q = query(productsRef, ...queryConstraints);
  // ...
}
```

**useOrders.js**:
```javascript
export const useOrders = (customerId, deliveryLocationId = null) => {
  // ...
  const queryConstraints = [
    where('customerId', '==', customerId)
  ];

  if (deliveryLocationId) {
    queryConstraints.push(where('deliveryLocationId', '==', deliveryLocationId));
  }

  queryConstraints.push(orderBy('createdAt', 'desc'));
  const q = query(ordersRef, ...queryConstraints);
  // ...
}
```

**デモモードのモックデータ更新**:
- 商品データにdeliveryLocationIdを追加（LOC0001 or LOC0002）
- 発注履歴データにdeliveryLocationIdとdeliveryLocationNameを追加

---

### 発生した問題と解決方法

#### 問題1: ログイン時に「Missing or insufficient permissions」エラー
- **原因**: AuthContextがログイン前にFirestoreへアクセスしようとした
- **解決**: Security Rulesを緩和（開発中は認証済みユーザーは全て読み取り可能に）

#### 問題2: Firestore Consoleでドキュメントが読み込めない
- **原因**: Security Rulesが厳しすぎてFirebase Consoleからもアクセスできなかった
- **解決**: ルールを更新してデプロイ

#### 問題3: sakura@example.comでログインできない
- **原因**: customersコレクションにsakura@example.com用のドキュメントが存在しなかった
- **対応**: Security Rulesを緩和することで、管理者用のドキュメントがなくても動作するように

---

### ファイル更新履歴

**新規作成**:
1. **`src/components/DeliveryLocationSelector.js`** - 納品先選択画面（約100行）

**更新ファイル**:
1. **`src/firebase/schema.md`**
   - deliveryLocationsコレクションの追加
   - products, ordersへのdeliveryLocationId追加
   - インデックス定義の追加

2. **`src/contexts/AuthContext.js`**
   - deliveryLocations stateの追加
   - 納品先一覧取得処理の追加
   - setDeliveryLocation関数の追加
   - デモモード用の納品先データ追加

3. **`src/App.js`**
   - DeliveryLocationSelectorのインポート
   - 納品先未選択時の表示制御
   - AppBarに納品先名を表示

4. **`src/hooks/useProducts.js`**
   - deliveryLocationIdパラメータの追加
   - Firestoreクエリに納品先フィルター追加
   - デモモードのモックデータにdeliveryLocationIdを追加
   - useEffect依存配列にdeliveryLocationIdを追加

5. **`src/hooks/useOrders.js`**
   - deliveryLocationIdパラメータの追加
   - Firestoreクエリに納品先フィルター追加
   - デモモードのモックデータ（全9件）にdeliveryLocationIdとdeliveryLocationNameを追加

6. **`src/components/OrderPage.js`**
   - useProducts, useOrdersに deliveryLocationId を渡すように変更
   - 発注データに deliveryLocationId と deliveryLocationName を保存

7. **`src/components/OrderHistory.js`**
   - useProducts, useOrdersに deliveryLocationId を渡すように変更

8. **`firestore.rules`**
   - deliveryLocationsコレクションのルール追加
   - customersコレクションの読み取り権限を緩和（開発中）

---

### 完成した機能一覧

**納品先管理機能**:
- ✅ **deliveryLocationsコレクション設計** ← 今回実装
- ✅ **納品先一覧取得機能** ← 今回実装
- ✅ **納品先選択画面** ← 今回実装
- ✅ **商品の納品先フィルタリング** ← 今回実装
- ✅ **注文の納品先フィルタリング** ← 今回実装
- ✅ **発注データへの納品先情報保存** ← 今回実装

**Security Rules更新**:
- ✅ **deliveryLocationsコレクションのルール** ← 今回実装
- ✅ **開発用の緩和されたルール** ← 今回実装

---

### 次回への引き継ぎ事項

**完了した作業**:
- ✅ 納品先機能の基本実装完了
- ✅ 顧客向けの納品先選択フロー完成
- ✅ Security Rulesの更新・デプロイ完了

**今後の実装予定**:
1. **管理者画面への納品先フィルター追加**:
   - 受注データエクスポート画面に納品先フィルターを追加
   - 得意先選択 → 関連する納品先のみドロップダウン表示
   - 納品先未選択の場合は全納品先を一括エクスポート

2. **Security Rulesの本番用更新**:
   - より厳密な権限管理（顧客は自分の得意先の納品先のみアクセス可能）
   - 管理者権限の明確化

3. **納品先マスタ管理機能**:
   - 管理者画面で納品先の追加・編集・削除

4. **Custom Claimの設定**:
   - customerIdやisAdminをCustom Claimとして設定
   - Security Rulesを更新

**技術的な課題**:
- 管理者画面でのFirestore連携（現在はlocalStorage使用）
- 大量の納品先がある場合のパフォーマンス最適化
- 納品先の権限管理の詳細設計

**データ構造の決定事項**:
- 納品先IDは4桁（LOC0001形式）
- Flat Collection構造（サブコレクションではない）
- 納品先名はordersにスナップショットとして保存（履歴の正確性のため）

---

### 動作確認結果

#### ✅ 納品先選択画面の表示テスト
- **テスト内容**: ログイン後に納品先選択画面が表示されるか
- **結果**: 成功
- **確認事項**:
  - ログイン成功後、納品先選択画面が表示される
  - LOC0001（本店）とLOC0002（第2倉庫）が表示される
  - カード形式で見やすく表示される

#### ✅ 納品先フィルタリングテスト（予定）
- **テスト内容**: 納品先選択後、その納品先の商品のみ表示されるか
- **次回確認**:
  - 本店を選択 → 本店の商品のみ表示
  - 第2倉庫を選択 → 第2倉庫の商品のみ表示

#### ✅ ログイン問題の解決
- **テスト内容**: sakura@example.comでログインできるか
- **結果**: 成功（Security Rules更新後）
- **確認事項**:
  - エラーなくログインできる
  - 納品先選択画面が表示される

---

## 2025年10月10日の開発作業

### 実装した機能と修正

#### 1. **納品先選択画面が表示されない問題の解決**

**問題**:
- `sakura@example.com`でログインすると、納品先選択画面がスキップされてしまう

**原因**:
- `src/contexts/AuthContext.js` の管理者リストに `sakura@example.com` が誤って含まれていた（36行目）
- 管理者扱いになったため、納品先選択画面がスキップされていた

**解決策**:
```javascript
// Before
const adminEmails = ['admin@example.com', 'sakura@example.com'];

// After
const adminEmails = ['admin@example.com'];
```

**場所**: `src/contexts/AuthContext.js:36`

---

#### 2. **納品先が1件のみの場合の自動選択機能の実装**

**ユーザー要望**:
> 得意先に紐づく納品先が1件だけの場合、納品先選択画面はスキップして自動的にその納品先の商品発注に進めるようにできませんか？

**実装内容**:

1. **Firebase接続時の自動選択ロジック**（AuthContext.js:63-70）:
```javascript
let autoSelectedLocationId = null;
let autoSelectedLocationName = null;
if (locationsData.length === 1) {
  autoSelectedLocationId = locationsData[0].id;
  autoSelectedLocationName = locationsData[0].name;
  console.log('🎯 納品先が1件のため自動選択:', autoSelectedLocationName);
}
```

2. **デモモード時の自動選択ロジック**（AuthContext.js:141-155）:
```javascript
let autoSelectedLocationId = null;
let autoSelectedLocationName = null;
if (!isAdmin) {
  const demoLocations = [
    { id: 'LOC0001', name: '本店', customerId: customerId, isActive: true },
    { id: 'LOC0002', name: '第2倉庫', customerId: customerId, isActive: true }
  ];
  setDeliveryLocations(demoLocations);

  if (demoLocations.length === 1) {
    autoSelectedLocationId = demoLocations[0].id;
    autoSelectedLocationName = demoLocations[0].name;
    console.log('🎯 デモモード: 納品先が1件のため自動選択:', autoSelectedLocationName);
  }
}
```

**ユーザーフロー**:
- 納品先2件以上: ログイン → 納品先選択画面 → 選択 → 発注画面
- 納品先1件のみ: ログイン → **自動選択** → 発注画面（直接遷移）

**効果**: ユーザー（バイヤー）の操作性が向上

---

#### 3. **React Router エラーの解決**

**エラー内容**:
```
Uncaught runtime errors:
ERROR
useNavigate() may be used only in the context of a <Router> component.
ReferenceError: useNavigate is not defined
```

**原因**:
- `src/components/DeliveryLocationSelector.js` が `useNavigate()` を使用していた
- このアプリはReact Routerを使用していない（単純なstate管理）

**解決策**:
- `useNavigate` のインポートと使用を削除
- `setDeliveryLocation()` を呼ぶだけで、App.jsが自動的に発注画面を表示する

**修正箇所**: `src/components/DeliveryLocationSelector.js`
```javascript
// Before
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
const handleLocationSelect = (location) => {
  setDeliveryLocation(location.id, location.name);
  navigate('/order');
};

// After
const handleLocationSelect = (location) => {
  setDeliveryLocation(location.id, location.name);
  // 納品先を選択すると、App.jsが自動的に発注画面を表示します
};
```

**ユーザーフィードバック**: ブラウザのスーパーリロード（Ctrl+Shift+R）でエラー解消を確認

---

#### 4. **Firestore複合インデックスエラーの解決**

**エラー内容**:
```
商品の取得に失敗しました
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**原因**:
- 納品先機能の追加により、`deliveryLocationId` でのフィルタリングが追加された
- 既存の複合インデックスでは対応できず、新しいインデックスが必要

**解決策**:
1. **Firebase Consoleで複合インデックスを作成**:
   - エラーメッセージのリンクをクリック
   - 2つのインデックスを作成（両方とも「有効」ステータスまで待機）

2. **作成したインデックス**:
   - **products**: `customerId` (昇順), `deliveryLocationId` (昇順), `isActive` (昇順), `orderCount` (降順)
   - **orders**: `customerId` (昇順), `deliveryLocationId` (昇順), `createdAt` (降順)

3. **firestore.indexes.json への記録**:
```json
{
  "indexes": [
    {
      "collectionGroup": "deliveryLocations",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "customerId", "order": "ASCENDING"},
        {"fieldPath": "isActive", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "customerId", "order": "ASCENDING"},
        {"fieldPath": "deliveryLocationId", "order": "ASCENDING"},
        {"fieldPath": "isActive", "order": "ASCENDING"},
        {"fieldPath": "orderCount", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "customerId", "order": "ASCENDING"},
        {"fieldPath": "deliveryLocationId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

**既存インデックスの保持について**:
- ユーザーから「以前のインデックス（deliveryLocationIdなし）を削除してもいいか？」との質問
- **回答**: 保持を推奨
- **理由**:
  - Firestoreの複合インデックスはクエリ条件に完全一致する必要がある
  - 納品先フィルターの有無で異なるインデックスが使用される
  - 管理者の全件表示など、将来の機能拡張に対応可能

**ドキュメント更新**: README.mdに複数インデックス設計の注意点を記載

---

#### 5. **納品先変更ボタンの追加**

**ユーザー要望**:
> 複数の納品先を持つ得意先について、商品発注画面から納品先選択画面に戻るボタンが欲しいです。

**実装内容**:

1. **納品先変更ハンドラーの追加**（App.js:117-119）:
```javascript
const handleChangeDeliveryLocation = () => {
  setDeliveryLocation(null, null);
};
```

2. **AppBarに納品先変更ボタンを追加**（App.js:185-202）:
```javascript
{!user.isAdmin && deliveryLocations.length > 1 && (
  <Button
    color="inherit"
    onClick={handleChangeDeliveryLocation}
    sx={{
      mr: { xs: 0.5, sm: 2 },
      minWidth: { xs: '48px', sm: 'auto' },
      fontSize: { xs: '0.8rem', sm: '0.875rem' },
      backgroundColor: 'transparent',
      px: { xs: 1, sm: 2 }
    }}
  >
    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
      納品先変更
    </Box>
    <ArrowBackIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '1.5rem' }} />
  </Button>
)}
```

**UI設計**:
- **PC表示**: テキスト「納品先変更」
- **モバイル表示**: ArrowBackアイコン（1.5rem）
- **表示条件**: 管理者以外 かつ 納品先が2件以上の場合のみ表示

**インポート追加**（App.js:14）:
```javascript
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
```

---

#### 6. **ログアウトUIの改善（アイコン化）**

**実装の経緯**:
1. 「変更」ボタンをアイコン化したことで、「OUT」テキストも気になり始めた
2. 複数のアイコンを検討:
   - ExitToAppIcon: シンプルすぎる
   - MeetingRoomIcon: 小さくて扉感が分かりづらい
   - **LogoutIcon**: 最終採用（見やすさとわかりやすさのバランスが良い）

**実装内容**（App.js:251-254）:
```javascript
<Button
  color="inherit"
  onClick={logout}
  sx={{
    minWidth: { xs: '48px', sm: 'auto' },
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    padding: { xs: '6px', sm: '6px 8px' },
    whiteSpace: 'nowrap'
  }}
>
  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
    ログアウト
  </Box>
  <LogoutIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '1.5rem' }} />
</Button>
```

**インポート追加**（App.js:15）:
```javascript
import LogoutIcon from '@mui/icons-material/Logout';
```

**UI設計**:
- **PC表示**: テキスト「ログアウト」
- **モバイル表示**: LogoutIcon（1.5rem）

**発生したトラブル**:
- ブラウザキャッシュにより、削除したExitToAppIconを参照するエラーが発生
- スーパーリロード（Ctrl+Shift+R）で解決

---

#### 7. **「発注」「履歴」ボタンのフォントサイズ調整**

**実装の経緯**:
- ユーザーから「発注」「履歴」もアイコンサイズに合わせて1.5remにしてほしいとの要望
- 実装後、「でかすぎました！1.1remくらいにしてもらえますか？」とフィードバック

**最終実装**（App.js:167, 179）:
```javascript
// 「発注」ボタン
fontSize: { xs: '1.1rem', sm: '0.875rem' },

// 「履歴」ボタン
fontSize: { xs: '1.1rem', sm: '0.875rem' },
```

**UI設計**:
- **モバイル**: 1.1rem（見やすさとバランス）
- **PC**: 0.875rem（デフォルトサイズ）

**ユーザーフィードバック**: "Goodです！"

---

#### 8. **Firestoreデータの修正（フィールド名のtypo）**

**問題**:
- sakura@example.comの本店で、りんごとキャベツしか表示されない
- みかんが表示されない

**原因調査**:
- Firestore Databaseのproductsコレクションを確認
- フィールド名が `deliveryLocatonId` (typo: 't'が欠落) になっていた

**解決策**:
- Firebase Consoleで手動修正
- `deliveryLocatonId` → `deliveryLocationId` に変更

**ユーザーフィードバック**: 手動で修正完了

---

#### 9. **納品先1件の自動スキップ機能のテスト**

**テスト内容**:
- LOC0002（第2倉庫）の `isActive` を `false` に設定
- sakura@example.comの納品先が1件（LOC0001）になる状態をシミュレート

**テスト方法**:
1. Firebase Consoleで deliveryLocations/LOC0002 の isActive を false に変更
2. ブラウザをリロード
3. sakura@example.comでログイン

**テスト結果**:
- ✅ 納品先選択画面がスキップされた
- ✅ 直接発注画面に遷移した
- ✅ LOC0001（本店）が自動選択された
- ✅ 本店の商品のみが表示された

**ユーザーフィードバック**: "完璧ですね！"

---

#### 10. **デバッグログの追加**

**目的**: Firestore連携時の動作確認

**追加箇所**: `src/hooks/useProducts.js`

```javascript
// Line 22-23
console.log('🔍 商品取得開始:', { customerId, deliveryLocationId });

// Line 44
console.log('🔍 Firestoreクエリ実行中...');

// Lines 51-52
console.log('✅ 商品データ取得成功:', productsData.length + '件');
```

**効果**: コンソールで商品取得の流れを確認可能

---

### ファイル更新履歴

**更新ファイル**:

1. **`src/contexts/AuthContext.js`**
   - 管理者リストから `sakura@example.com` を削除（36行目）
   - 納品先が1件のみの場合の自動選択ロジック追加（Firebase: 63-70行目、デモモード: 141-155行目）

2. **`src/components/DeliveryLocationSelector.js`**
   - React Router（useNavigate）の使用を削除
   - コメント追加で動作を明確化

3. **`src/App.js`**
   - ArrowBackIcon, LogoutIconのインポート追加（14-15行目）
   - deliveryLocations, setDeliveryLocationをuseAuthから取得（113行目）
   - handleChangeDeliveryLocation関数の追加（117-119行目）
   - 「発注」ボタンのフォントサイズ調整（167行目）
   - 「履歴」ボタンのフォントサイズ調整（179行目）
   - 納品先変更ボタンの追加（185-202行目）
   - ログアウトボタンのアイコン化（251-254行目）

4. **`src/hooks/useProducts.js`**
   - デバッグログの追加（22-23, 44, 51-52行目）

5. **`firestore.indexes.json`**
   - deliveryLocationsの複合インデックス追加
   - productsの納品先フィルター対応インデックス追加
   - ordersの納品先フィルター対応インデックス追加

6. **`README.md`**
   - 複数納品先対応に伴うインデックス設計の注意点セクション追加
   - 納品先フィルターの有無で異なるインデックスが必要な理由を説明

---

### 完成した機能一覧

**今回実装・修正**:
- ✅ **納品先選択画面の表示修正** ← 管理者リストから誤ったユーザーを削除
- ✅ **納品先1件時の自動スキップ機能** ← UX向上
- ✅ **納品先変更ボタン** ← 複数納品先対応
- ✅ **モバイルUIの改善** ← アイコン化、フォントサイズ調整
- ✅ **Firestore複合インデックス** ← 納品先フィルター対応
- ✅ **Firestoreデータ修正** ← フィールド名のtypo修正
- ✅ **機能テスト完了** ← 納品先1件の自動選択を確認

---

### 技術的な実装詳細

#### 納品先自動選択のロジック

**条件**:
- 納品先が1件のみ
- ユーザーが管理者ではない

**実装**:
1. ログイン時にFirestoreから納品先一覧を取得
2. 配列の長さをチェック
3. 1件の場合は自動的にIDと名前を設定
4. App.jsの条件分岐で納品先選択画面をスキップ

**App.js の条件分岐**:
```javascript
// 納品先未選択の場合は選択画面を表示（管理者を除く）
if (!user.isAdmin && !user.deliveryLocationId) {
  return <DeliveryLocationSelector />;
}
```

**自動選択の場合**:
- deliveryLocationIdが既に設定されているため、この条件に該当せず、発注画面が表示される

---

#### Firestore複合インデックスの設計

**インデックス設計方針**:

1. **納品先フィルターあり（一般ユーザー）**:
   - products: `customerId + deliveryLocationId + isActive + orderCount`
   - orders: `customerId + deliveryLocationId + createdAt`

2. **納品先フィルターなし（管理者の全件表示など）**:
   - products: `customerId + isActive + orderCount` ← 既存インデックス（保持）
   - orders: `customerId + createdAt` ← 既存インデックス（保持）

**理由**:
- Firestoreは完全一致するインデックスが必要
- WHERE句の条件が異なる場合、別のインデックスが使用される
- 将来の機能拡張（納品先横断検索、レポート機能など）にも対応可能

---

### 発生した問題と解決方法

#### 問題1: React Router エラー
- **エラー**: `useNavigate() may be used only in the context of a <Router> component`
- **原因**: DeliveryLocationSelectorがuseNavigateを使用していた
- **解決**: useNavigate削除、setDeliveryLocationのみで対応

#### 問題2: Firestore複合インデックスエラー
- **エラー**: `The query requires an index`
- **原因**: deliveryLocationIdフィルター用のインデックスが未作成
- **解決**: Firebase Consoleで2つのインデックスを作成（products, orders）

#### 問題3: Firestoreフィールド名のtypo
- **問題**: みかんが表示されない
- **原因**: `deliveryLocatonId` (typo) になっていた
- **解決**: Firebase Consoleで手動修正

#### 問題4: ブラウザキャッシュ
- **エラー**: 削除したLogoutIconが参照される
- **解決**: スーパーリロード（Ctrl+Shift+R）

#### 問題5: フォントサイズ
- **問題**: 1.5remが大きすぎる
- **解決**: 1.1remに調整

---

### 動作確認結果

#### ✅ 納品先選択画面の表示修正
- **結果**: sakura@example.comで納品先選択画面が正常に表示される

#### ✅ 納品先自動選択機能
- **結果**: LOC0002をisActive=falseにすると、納品先選択画面がスキップされる
- **確認**: 「完璧ですね！」とユーザーフィードバック

#### ✅ Firestore複合インデックス
- **結果**: 商品が正常に表示される
- **確認**: りんご、みかん、キャベツが表示される

#### ✅ 納品先変更ボタン
- **結果**: モバイル/PCで適切にアイコン/テキストが表示される

#### ✅ ログアウトアイコン
- **結果**: LogoutIconが見やすく表示される

---

### 次回への引き継ぎ事項

**完了した作業**:
- ✅ 納品先選択画面の表示修正完了
- ✅ 納品先1件時の自動スキップ機能完成
- ✅ 納品先変更ボタンの実装完了
- ✅ モバイルUIの改善完了
- ✅ Firestore複合インデックスの作成完了
- ✅ README.mdへのインデックス設計方針の記載完了

**次回の作業予定**:
1. **管理者アカウントでの運用テスト**:
   - admin@example.comでログイン
   - 管理者画面の動作確認
   - マスタ管理機能のテスト
   - 受注管理機能のテスト

2. **発注履歴の表示の不具合の修正**:
   - 詳細は次回セッションで確認
   - 現時点で判明している問題があれば調査・修正

**技術的な課題**:
- 管理者画面での納品先フィルター機能（今後実装）
- Security Rulesの本番用更新（今後実装）
- Custom Claimの設定（今後実装）

**Firebaseプロジェクト情報**:
- プロジェクトID: `easy-order-6a6y1eaf`
- プラン: Spark（無料プラン）
- ロケーション: asia-northeast1（東京）
- 複合インデックス: deliveryLocations, products, orders（全て「有効」状態）

---

## 2026年2月19日の開発作業

### 実施した作業

#### 1. **配送日デフォルト値のタイムゾーンズレ修正**

**問題**:
- 発注画面で商品ごとに表示されるデフォルト配送日が、期待より1日前の日付になっていた
- 例: 最短2日後のトマトで、2026/02/19（今日）に発注すると、2026/02/20が表示される（正しくは2026/02/21）

**原因**:
- `getMinDeliveryDate()` 関数が `toISOString()` でUTCに変換していたため、日本時間（UTC+9）では9時間分ずれて前日の日付になっていた

**修正箇所**: `src/components/OrderPage.js:137-144`

```javascript
// Before（UTC変換でズレが発生）
const getMinDeliveryDate = (minDays) => {
  const date = new Date();
  date.setDate(date.getDate() + minDays);
  return date.toISOString().split('T')[0]; // UTC変換でズレる
};

// After（ローカル日付で正確に計算）
const getMinDeliveryDate = (minDays) => {
  const date = new Date();
  date.setDate(date.getDate() + minDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
```

**動作確認**: 修正後、最短2日後のトマトのデフォルト配送日が2026/02/21に正しく表示されることを確認

---

#### 2. **発注後に発注履歴に反映されない問題の修正**

**問題**:
- 発注確定ボタンを押しても、発注履歴タブに新規発注が表示されない

**原因**:
- `src/hooks/useOrders.js:90` に `&& false` という条件が残っていた
- これにより、localStorageに実際の発注データが保存されていても、常にモックデータで上書きされていた

```javascript
// Before（&& false が常にfalseにするため、localStorageデータが無視される）
const sampleOrders = savedOrders.length >= 10 && false ? savedOrders : [
  // ... モックデータ
];

// After（localStorageにデータがあればそれを使用）
const sampleOrders = savedOrders.length > 0 ? savedOrders : [
  // ... モックデータ（初回アクセス時のみ）
];
```

**修正箇所**: `src/hooks/useOrders.js:90`

**動作確認**: 修正後、発注確定後に発注履歴タブに新規発注が追加されることを確認

---

#### 3. **管理者画面 手動管理タブに顧客一覧・商品一覧機能を追加**

**ユーザー要望**:
> マスタ管理画面において、現在登録されているマスタ情報を確認する方法は？
> 「顧客一覧」「商品一覧」の表示機能を追加してほしい

**実装内容**:

**場所**: `src/components/AdminPage.js` - 手動管理タブ

1. **「顧客一覧」ボタンの追加**:
   - 既存の「顧客登録」「商品登録」ボタンの左側に追加
   - セカンダリカラー（紫）で区別しやすいデザイン
   - Visibilityアイコン付き

2. **「商品一覧」ボタンの追加**:
   - 同様にセカンダリカラーで追加

3. **顧客マスタ一覧テーブル**:
   - 列: 得意先コード、得意先名、メールアドレス、営業担当者ID、状態（アクティブ/無効）
   - 状態はColorChipで視覚的に表示
   - 更新ボタンで再読み込み可能

4. **商品マスタ一覧テーブル**:
   - 列: 得意先コード、作業コード、商品名、規格、産地、単価（円）、リードタイム、発注回数、状態
   - 状態はColorChipで視覚的に表示
   - 更新ボタンで再読み込み可能

5. **データ取得ロジック**:
   - Firebase接続時: Firestoreから実データを取得
   - デモモード時: モックデータを表示

**新規追加の状態変数（AdminPage.js:109-112）**:
```javascript
const [masterCustomers, setMasterCustomers] = useState([]);
const [masterProducts, setMasterProducts] = useState([]);
const [masterLoading, setMasterLoading] = useState(false);
```

**新規追加の関数（AdminPage.js:825-871）**:
```javascript
const loadMasterList = async (type) => {
  // Firebase接続時はFirestoreから、デモモード時はモックデータを使用
};
```

---

### 発生した問題と解決方法

#### 問題1: 配送日がタイムゾーンの影響で1日前になる
- **原因**: `toISOString()` がUTC変換するため、JST（+9h）の環境では前日日付になる
- **解決**: `getFullYear()`/`getMonth()`/`getDate()` でローカル時間の日付文字列を生成

#### 問題2: 発注してもlocalStorageに保存されたデータが読み込まれない
- **原因**: `useOrders.js` に `&& false` という不要な条件が残っていた
- **解決**: `savedOrders.length > 0 ? savedOrders : [モックデータ]` に変更

---

### ファイル更新履歴

**更新ファイル**:
1. **`src/components/OrderPage.js`**
   - `getMinDeliveryDate()` のタイムゾーン対応修正（137-144行目）

2. **`src/hooks/useOrders.js`**
   - デモモードでlocalStorageのデータを正しく読み込むよう修正（90行目）

3. **`src/components/AdminPage.js`**
   - 手動管理タブに「顧客一覧」「商品一覧」ボタンを追加
   - 顧客マスタ一覧テーブルを追加
   - 商品マスタ一覧テーブルを追加
   - `masterCustomers`, `masterProducts`, `masterLoading` 状態変数を追加
   - `loadMasterList()` 関数を追加

---

### 完成した機能一覧

**今回実装・修正**:
- ✅ **配送日デフォルト値のタイムゾーン修正** ← バグ修正
- ✅ **発注履歴へのリアルタイム反映修正** ← バグ修正
- ✅ **管理者画面 顧客マスタ一覧表示** ← 新機能
- ✅ **管理者画面 商品マスタ一覧表示** ← 新機能

---

### 次回への引き継ぎ事項

**完了した作業**:
- ✅ 配送日のタイムゾーンズレ修正
- ✅ 発注履歴の反映バグ修正
- ✅ 管理者画面への顧客・商品一覧機能の追加

**今後の実装予定**:
1. **管理者画面への納品先フィルター追加**（前回からの継続課題）
   - 受注データエクスポート画面に納品先フィルターを追加
2. **Security Rulesの本番用更新**（前回からの継続課題）
3. **Custom Claimの設定**（前回からの継続課題）
4. **マスタ一覧からの編集・削除機能**
   - 現状は閲覧のみ。今後、行クリックで編集ダイアログを開く機能の追加を検討

**技術的な課題**:
- デモモードの顧客一覧・商品一覧はモックデータのみ（Firebase接続後は実データ表示）
- 管理者画面でのFirestore連携（マスタ一覧はFirestoreから取得済み、手動登録はまだモック）

---
**記録作成日**: 2025年9月2日
**最終更新**: 2026年2月19日
**次回作業**: 管理者画面への納品先フィルター追加、Security Rulesの本番用更新、Custom Claimの設定