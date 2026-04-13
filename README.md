# スーパーバイヤー向け発注システム

スーパーのバイヤーが効率的に商品を発注できるWebアプリケーションです。従来のLINEやショートメールでの発注を、シンプルで使いやすいWebインターフェースに置き換えます。

## 主要機能

### 🛒 簡単発注（バイヤー向け）
- 数量入力のみで発注完了
- よく発注する商品を上位表示
- 最短納期+7日をデフォルト納期として設定
- カート機能で複数商品をまとめて発注

### 📱 モバイル対応
- スマートフォンで快適に使用可能
- レスポンシブデザイン
- タッチフレンドリーなUI
- 最適化されたボタンサイズとレイアウト

### 🔐 顧客別管理
- 顧客ごとの商品マスタ
- 作業コード、商品名、規格、産地、単価を管理
- セキュアな認証システム
- デモモード搭載（Firebase設定不要で動作確認可能）

### 📍 複数納品先対応（NEW！）
- 1つの得意先で複数の納品先を管理
- ログイン後に納品先を選択
- 納品先ごとに商品・発注をフィルタリング
- 発注時に納品先情報を自動記録
- **納品先ごとの納品不可日設定**（NEW！）
  - 管理者が納品先ごとに納品できない日付を設定
  - 設定した日付は発注画面で選択不可（グレーアウト）
  - 納品不可日を選択した場合は警告メッセージを表示
  - 発注確定時にバリデーション実施

### 📊 発注履歴（NEW！強化版）
- 過去の発注履歴を簡単確認
- 詳細な商品情報表示
- **発注ステータス管理**（発注済み、処理中、配送中、配送完了）
- **発注時の自動履歴追加** - 発注ボタンを押すと即座に履歴に反映
- **納期による自動ステータス更新** - 納期が来ると自動的に「配送完了」に
- **ステータスフィルター機能**（全て/発注済み/処理中/配送中/配送完了）
- アコーディオン形式で見やすい表示
- Firestoreによるデータ永続化・リアルタイム同期

### 📧 通知機能
- 営業担当者への自動通知
- メール・LINE通知対応
- 緊急通知（高額・大量発注時）
- 通知キュー管理

### 🔧 管理者機能（NEW！）

管理者画面は**マスタ管理**と**受注管理**の2つのタブに分かれています。

#### マスタデータ管理（マスタ管理タブ）
- **一括更新タブ**
  - CSV形式で商品・顧客データを一括アップロード
  - BOM付きUTF-8対応（Excelで文字化けなし）
  - テンプレートダウンロード機能
  - リアルタイムプレビュー表示
  - 自動コードフォーマット（得意先コード6桁、作業コード5桁）
  - パスワード自動生成（AUTO_GEN対応）

- **手動管理タブ**
  - 個別の顧客・商品登録
  - 得意先名オートコンプリート
  - コード重複チェック
  - 未使用コードの自動提案
  - **顧客マスタ一覧表示（NEW！）** - 得意先コード・名前・メール・担当者・状態を一覧表示
  - **商品マスタ一覧表示（NEW！）** - 作業コード・商品名・規格・産地・単価・リードタイム・発注回数・状態を一覧表示

- **実行履歴タブ**
  - バッチ処理履歴の詳細表示
  - エラー詳細ダイアログ（行番号、フィールド、エラー内容、入力値）
  - **エラー行CSVダウンロード**（元のファイルと同じ形式）
  - データ種別・期間フィルタリング
  - ページネーション（10件/ページ）
  - 処理日時の明示と警告メッセージ表示

- **納品先管理タブ**（NEW！）
  - 納品先ごとの納品不可日設定
  - 日付の追加・削除機能
  - 登録済み納品不可日の一覧表示（曜日付き）
  - 曜日ごとのカラーコーディング（日曜日は赤、土曜日は青）
  - デモモード/本番モード両対応

#### 受注管理（受注管理タブ）
- **発注データエクスポートタブ（NEW！）**
  - **販売管理システム連携機能**
  - CSV/Excel形式でのエクスポート（ラジオボタンで切り替え）
  - 期間・得意先・ステータスでフィルタリング
  - **出力列の自由選択**（12種類の列から選択可能）
  - デフォルト列: 作業コード、配送日、数量、直送コード
  - **エクスポート時に自動でステータス更新**（発注済み → 処理中）
  - リアルタイムでエクスポート対象件数を表示
  - **PDF帳票出力機能（NEW！）**
    - 見やすい日本語帳票レイアウト
    - 得意先情報・発注明細・合計金額を含む
    - モバイルでも見やすいフォントサイズ
    - 印刷・共有に最適

#### CSV機能の特徴
- **BOM付きUTF-8**でダウンロード → Excelで文字化けなし
- **アップロード時にBOM自動除去** → 安全な処理
- **Upsert方式**（Update or Insert）→ 重複を自動判定
- **エラー行のみ抽出**してダウンロード可能 → 修正が簡単

## 技術構成

### フロントエンド
- **React 18** - UIライブラリ
- **Material-UI 5** - UIコンポーネント
- **React Router** - ルーティング
- **xlsx** - Excel出力ライブラリ
- **jsPDF** - PDF帳票出力（NEW！）

### バックエンド
- **Firebase Authentication** - メール/パスワード認証（本番環境で稼働中）
- **Cloud Firestore** - リアルタイムデータベース（本番環境で稼働中）
- **Cloud Functions** - サーバーサイド処理
- **Firestore Security Rules** - データアクセス制御
- **Composite Indexes** - 高速クエリ最適化

### 通知
- **Nodemailer** - メール送信
- **LINE Bot API** - LINE通知（実装予定）

## プロジェクト構成

```
├── public/
│   └── index.html               # メインHTMLファイル
├── src/
│   ├── components/              # Reactコンポーネント
│   │   ├── LoginPage.js         # ログイン画面
│   │   ├── DeliveryLocationSelector.js  # 納品先選択画面（NEW！）
│   │   ├── OrderPage.js         # 発注画面（バイヤー）
│   │   ├── OrderHistory.js      # 発注履歴画面
│   │   └── AdminPage.js         # 管理者画面（NEW！）
│   ├── contexts/
│   │   └── AuthContext.js       # 認証コンテキスト
│   ├── hooks/
│   │   ├── useProducts.js       # 商品管理フック
│   │   └── useOrders.js         # 発注管理フック
│   ├── firebase/
│   │   ├── config.js            # Firebase設定（デモモード対応）
│   │   ├── services.js          # Firebase操作
│   │   └── schema.md            # DB設計書
│   ├── utils/
│   │   ├── notifications.js     # 通知機能
│   │   ├── passwordGenerator.js # パスワード自動生成（NEW！）
│   │   └── codeFormatter.js     # コードフォーマット（NEW！）
│   ├── App.js                   # メインアプリ
│   └── index.js                 # エントリーポイント
├── functions/                   # Cloud Functions
│   ├── index.js                 # 通知処理
│   └── package.json             # Dependencies
├── firebase.json                # Firebase設定
├── firestore.rules              # Firestoreセキュリティルール（NEW！）
├── firestore.indexes.json       # Firestore複合インデックス定義（NEW！）
├── .env                         # 環境変数（本番用、gitignore対象）
├── .env.example                 # 環境変数テンプレート
├── package.json                 # プロジェクト設定
├── TESTING.md                   # テスト手順書
├── CONVERSATION_LOG.md          # 開発履歴（NEW！）
└── CLAUDE.md                    # Claude Code向けガイド（NEW！）
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

#### プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. Sparkプラン（無料）で開始可能

#### Authentication設定
1. Authentication > Sign-in method を開く
2. 「メール/パスワード」プロバイダを有効化
3. （オプション）管理者ユーザーを作成

#### Firestore Database設定
1. Firestore Database を作成
2. **Standard Edition** を選択
3. ロケーションは **asia-northeast1（東京）** を推奨
4. セキュリティルールをデプロイ（下記参照）
5. 複合インデックスを作成（下記参照）

#### 環境変数設定
1. Firebase Console > プロジェクト設定 から設定値を取得
2. `.env`ファイルを作成し、Firebase設定を追加

```bash
cp .env.example .env
# .envファイルを編集してFirebase設定を追加
```

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### セキュリティルール設定（重要！）
本番用Security Rulesをデプロイします：

```bash
firebase deploy --only firestore:rules
```

または Firebase Console から手動で設定:
1. Firebase Console > Firestore Database > ルール
2. `firestore.rules`の内容をコピー＆ペースト
3. 「公開」ボタンをクリック

**注意**: 本番用ルールは開発中のルールよりも厳密です。Custom Claimsの設定が必要です。

#### 複合インデックス作成
以下のクエリ実行時にエラーメッセージが表示されるので、リンクをクリックして自動作成：
- **products**: `customerId`, `isActive`, `orderCount`
- **orders**: `customerId`, `createdAt`

または`firestore.indexes.json`をデプロイ：
```bash
firebase deploy --only firestore:indexes
```

### 3. Firestore初期設定

データベース構造は `src/firebase/schema.md` を参照してください。

#### 必要なコレクション：
- `customers` - 顧客マスタ（emailフィールドが必須）
- `deliveryLocations` - 納品先マスタ（NEW！customerId, isActiveでインデックス必要）
- `products` - 商品マスタ（customerId, deliveryLocationId, isActive, orderCountでインデックス必要）
- `orders` - 発注データ（customerId, deliveryLocationId, createdAtでインデックス必要）
- `salesStaff` - 営業担当者マスタ
- `notifications` - 通知データ

#### 初期データ例（customers）
```json
{
  "name": "さくらスーパー",
  "email": "sakura@example.com",
  "salesStaffId": "SS001",
  "isActive": true
}
```

### 4. Cloud Functions設定

```bash
cd functions
npm install
```

Gmail通知設定：
```bash
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
```

### 5. 開発サーバー起動

```bash
npm start
```

### 6. デプロイ

```bash
# Webアプリのビルド
npm run build

# Firebaseにデプロイ
firebase deploy
```

## 使用方法

### バイヤー向け機能

#### 顧客ログイン
1. メールアドレスとパスワードでログイン（Firebase認証）
2. 納品先選択画面で納品先を選択（複数納品先がある場合）
3. 選択した納品先の発注可能商品一覧が表示（発注回数順）
4. デモモード時は任意のメールアドレスで自動ログイン可能

#### 商品発注
1. 商品カードの +/- ボタンで数量調整
2. 右下の「発注」ボタンで確認画面へ
3. 納期を確認・調整（デフォルト: 最短納期+7日）
4. 「発注確定」で注文完了
5. 営業担当者に自動通知

#### 履歴確認
1. 「履歴」タブで過去の発注を確認
2. アコーディオンを開いて詳細表示
3. ステータス（発注済み/処理中/配送中/配送完了）を確認
4. 発注直後は自動的に履歴に追加される
5. 納期が来ると自動的に「配送完了」に更新

### 管理者向け機能

#### マスタデータの一括登録・更新
1. 管理者画面にアクセス
2. 「一括更新」タブを選択
3. 「テンプレート」ボタンでサンプルCSVをダウンロード
4. ExcelでCSVファイルを編集
   - 商品マスタ: `customerId,customerName,workCode,productName,specification,origin,quantity,boxPrice,leadTime`
   - 顧客マスタ: `customerId,customerName,email,salesStaffId,password,isActive`
   - パスワード欄に`AUTO_GEN`と入力すると自動生成
5. 「アップロード」ボタンでCSVを選択
6. プレビューで内容を確認
7. 「アップロード実行」で登録

#### エラー修正フロー
1. アップロード後、エラーが発生した場合は「実行履歴」タブで確認
2. エラー詳細を開き、👁アイコンをクリック
3. エラー内容を確認後、「エラー行をダウンロード」ボタンをクリック
4. ダウンロードしたCSVをExcelで開く（BOM付きUTF-8なので文字化けなし）
5. エラー箇所を修正（例: 単価が"ABC" → 数値"1200"に修正）
6. 上書き保存
7. 「一括更新」タブで修正済みCSVを再アップロード
8. エラー行のみが更新される（Upsert処理）

#### 個別登録
1. 「手動管理」タブを選択
2. 「顧客登録」または「商品登録」を選択
3. フォームに必要情報を入力
   - コードは自動フォーマット（得意先コード6桁、作業コード5桁）
   - パスワード自動生成ボタンで安全なパスワードを生成
4. 「保存」ボタンで登録
5. 重複チェックが自動実行され、重複時は確認ダイアログ表示

### 受注管理機能

#### 発注データのエクスポート（NEW！）
1. 「発注データエクスポート」タブを選択
2. エクスポート条件を設定
   - 期間指定（開始日〜終了日）
   - 得意先指定（全て または 特定の得意先）
   - ステータス指定（全て/処理中/配送中/配送完了）
3. **CSV/Excel エクスポート**（販売管理システム連携用）
   - 「列を選択」ボタンで出力する列を選択
   - デフォルト: 作業コード、配送日、数量、直送コード
   - 利用可能な列: 発注日、得意先コード、得意先名、作業コード、商品名、規格、産地、数量、単価、配送日、ステータス、直送コード
   - ラジオボタンでCSV形式またはExcel形式を選択
   - 「ダウンロード」ボタンでエクスポート
   - エクスポートされた「発注済み」の発注は自動的に「処理中」に変更
   - 販売管理システムにインポート
4. **PDF帳票出力**（帳票・印刷用）
   - 「PDF出力」ボタンをクリック
   - 得意先情報、発注明細、合計金額を含む日本語帳票を生成
   - 見やすいレイアウトで印刷・共有に最適
   - モバイル端末でも確認可能

## 🚀 Firebase本番環境連携（NEW！）

アプリケーションはFirebase本番環境と完全連携しており、以下の機能が動作しています：

### 認証機能
- **Firebase Authentication** によるメール/パスワード認証
- セキュアなユーザー管理
- 顧客情報とFirebaseユーザーの自動連携（emailベース）

### データ管理
- **Cloud Firestore** でのリアルタイムデータ同期
- 商品マスタ、発注データ、顧客データの永続化
- 複合インデックスによる高速クエリ
- セキュリティルールによるアクセス制御

### デモモードと本番モードの自動切り替え
- **デモモード**: 環境変数`REACT_APP_FIREBASE_API_KEY`が未設定の場合に自動的に有効化
- **本番モード**: `.env`ファイルにFirebase設定を追加すると自動的に切り替わる
- どちらのモードでも全機能が動作
- コンソールに「🔧 デモモードで動作中」と表示（デモモード時）

### デモモード → 本番環境への移行
1. `.env`ファイルにFirebase設定を追加
2. Firestoreのセキュリティルールと複合インデックスを設定
3. アプリを再起動
4. 自動的に本番モードに切り替わる

## カスタマイズ

### 商品データ追加
- **デモモード**: `src/hooks/useProducts.js` の `sampleProducts` 配列にデータを追加
- **本番環境**: 管理者画面からCSVアップロードで一括登録

### 通知設定変更
`functions/index.js` でメール・LINE通知の設定をカスタマイズ

### UI テーマ変更
`src/App.js` の `theme` オブジェクトでカラーやスタイリングを調整

### コードフォーマットルール
`src/utils/codeFormatter.js` で以下をカスタマイズ可能：
- 得意先コードの桁数（デフォルト: 6桁）
- 作業コードの桁数（デフォルト: 5桁）
- バリデーションルール

### パスワード生成ルール
`src/utils/passwordGenerator.js` でパスワード生成ロジックをカスタマイズ可能：
- デフォルト: 7桁の英数字

## セキュリティ

### 認証・認可
- **Firebase Authentication** による安全な認証（本番環境で稼働中）
- メール/パスワード方式の安全な認証フロー
- パスワード自動生成機能（7桁の安全なパスワード）
- **Custom Claims** による管理者権限の分離
- 顧客IDの自動付与（ユーザー登録時）

### データアクセス制御（NEW！強化版）
- **Firestore Security Rules** によるデータアクセス制御（本番用ルール適用済み）
- **マルチテナント対応**: 顧客は自分のデータのみアクセス可能
- **ゼロトラストアプローチ**: デフォルト全拒否、明示的許可のみ通す
- **フィールドレベル制御**: 一般ユーザーが更新できるフィールドを厳密に制限
- **Custom Claims** による権限管理:
  - 管理者: `admin=true` で全データアクセス可能
  - 一般ユーザー: `customerId` で自分の得意先データのみアクセス

詳細は [SECURITY_RULES.md](SECURITY_RULES.md) を参照してください。

### Custom Claimsの設定方法

```bash
# Firebase Functions Shellで実行
firebase functions:shell

# 管理者権限を付与
> admin.auth().setCustomUserClaims('ユーザーUID', { admin: true })

# 一般ユーザーに得意先IDを付与
> admin.auth().setCustomUserClaims('ユーザーUID', { customerId: '000001' })
```

### 通信・インフラ
- HTTPS通信による暗号化
- Firebase Hostingによる安全なデプロイ
- 環境変数による機密情報の保護（`.env`はgitignore対象）
- Security Rulesによるサーバー側検証（クライアント側の処理は信用しない）

## トラブルシューティング

### Windows環境で`npm start`が動作しない
```bash
# 解決方法
npx react-scripts start
```

### CSV文字化け問題
- **ダウンロード**: すべてBOM付きUTF-8で出力されるため、Excelで正常に開けます
- **アップロード**: BOMの有無を自動判定するため、どちらでも処理可能

### ポート3000が使用中
```bash
npm start -- --port 3001
```

### Firebase初期化エラー
- `.env`ファイルが未設定の場合、自動的にデモモードで動作します
- コンソールに「🔧 デモモードで動作中」と表示されていれば正常です

### Firestore複合インデックスエラー
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```
**解決方法**:
1. エラーメッセージ内のリンクをクリック
2. Firebase Consoleでインデックスを自動作成
3. ステータスが「作成中」→「有効」になるまで待つ（数分）
4. ページをリロード

**必要なインデックス**:
- `deliveryLocations`: customerId (昇順), isActive (昇順)
- `products` (納品先フィルターあり): customerId (昇順), deliveryLocationId (昇順), isActive (昇順), orderCount (降順)
- `products` (納品先フィルターなし): customerId (昇順), isActive (昇順), orderCount (降順) ← **既存インデックス（削除しない）**
- `orders` (納品先フィルターあり): customerId (昇順), deliveryLocationId (昇順), createdAt (降順)
- `orders` (納品先フィルターなし): customerId (昇順), createdAt (降順) ← **既存インデックス（削除しない）**

**📝 複数納品先対応に伴うインデックス設計の注意点**:

納品先機能の追加により、productsとordersコレクションの複合インデックスが増えましたが、**以前のインデックスも削除せずに残してください**。

**理由**:
- Firestoreの複合インデックスは**クエリ条件に完全一致**する必要がある
- 納品先フィルターの有無で異なるインデックスが使用される：
  - **納品先フィルターあり**: `customerId + deliveryLocationId + ...` を使用（一般ユーザー）
  - **納品先フィルターなし**: `customerId + ...` を使用（管理者の全件表示など）
- 将来の機能拡張（納品先横断検索、レポート機能など）にも対応可能

### Firestore Security Rules エラー
```
Missing or insufficient permissions
```
**解決方法**:
1. `firestore.rules`ファイルの内容をFirebase Consoleにコピー
2. または `firebase deploy --only firestore:rules` を実行
3. ルールが正しくデプロイされたことを確認

### 環境変数が読み込まれない
**解決方法**:
1. `.env`ファイルがプロジェクトルートにあることを確認
2. 開発サーバーを完全に停止（Ctrl+Cを2回押す）
3. `npm start` または `npx react-scripts start` で再起動
4. 環境変数は起動時のみ読み込まれます

## 開発履歴

詳細な開発履歴は以下を参照してください：
- **[CONVERSATION_LOG.md](./CONVERSATION_LOG.md)** - 2025年9月〜10月11日
- **[CONVERSATION_LOG2.md](./CONVERSATION_LOG2.md)** - 2025年10月13日〜（現在）

- **2025年9月2日**: 基本機能実装（ログイン、発注、履歴、通知）
- **2025年10月6日**: 管理者機能実装（マスタ管理、CSV一括更新、エラー修正フロー、BOM対応）
- **2025年10月7日**: 発注データエクスポート機能、発注履歴の自動ステータス更新機能を実装
- **2025年10月8日**: Firebase本番環境接続、PDF帳票出力機能、管理者画面分割（マスタ管理/受注管理）、ステータスフィルター強化
- **2025年10月9日**: 複数納品先対応機能を実装（納品先選択画面、納品先別フィルタリング、Security Rules更新）
- **2026年2月19日**: バグ修正2件（配送日タイムゾーンズレ、発注履歴未反映）、管理者画面に顧客・商品マスタ一覧表示機能を追加
- **2026年4月3日**: マスタ一覧の状態変更機能、受注管理への納品先フィルター追加、**Security Rules本番用更新**（マルチテナント対応、フィールドレベル制御、Custom Claims対応）
- **2025年10月13日**: 納品先ごとの納品不可日設定機能を実装（管理画面に納品先管理タブ追加、発注画面でのバリデーション強化）

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

技術的なお問い合わせやバグ報告は、プロジェクトの Issues セクションでお願いします。