# スーパーバイヤー向け発注システム

スーパーのバイヤーが効率的に商品を発注できるWebアプリケーションです。従来のLINEやショートメールでの発注を、シンプルで使いやすいWebインターフェースに置き換えます。

## 主要機能

### 🛒 簡単発注
- 数量入力のみで発注完了
- よく発注する商品を上位表示
- 最短納期+7日をデフォルト納期として設定

### 📱 モバイル対応
- スマートフォンで快適に使用可能
- レスポンシブデザイン
- タッチフレンドリーなUI

### 🔐 顧客別管理
- 顧客ごとの商品マスタ
- 作業コード、商品名、規格、産地、単価を管理
- セキュアな認証システム

### 📊 発注履歴
- 過去の発注履歴を簡単確認
- 詳細な商品情報表示
- 発注ステータス管理

### 📧 通知機能
- 営業担当者への自動通知
- メール・LINE通知対応
- 緊急通知（高額・大量発注）

## 技術構成

### フロントエンド
- **React 18** - UIライブラリ
- **Material-UI 5** - UIコンポーネント
- **React Router** - ルーティング

### バックエンド
- **Firebase Authentication** - 認証
- **Cloud Firestore** - データベース
- **Cloud Functions** - サーバーサイド処理

### 通知
- **Nodemailer** - メール送信
- **LINE Bot API** - LINE通知（実装予定）

## プロジェクト構成

```
├── public/
│   └── index.html          # メインHTMLファイル
├── src/
│   ├── components/         # Reactコンポーネント
│   │   ├── LoginPage.js    # ログイン画面
│   │   ├── OrderPage.js    # 発注画面
│   │   └── OrderHistory.js # 発注履歴画面
│   ├── contexts/          
│   │   └── AuthContext.js  # 認証コンテキスト
│   ├── hooks/             
│   │   ├── useProducts.js  # 商品管理フック
│   │   └── useOrders.js    # 発注管理フック
│   ├── firebase/          
│   │   ├── config.js       # Firebase設定
│   │   ├── services.js     # Firebase操作
│   │   └── schema.md       # DB設計書
│   ├── utils/
│   │   └── notifications.js # 通知機能
│   ├── App.js              # メインアプリ
│   └── index.js            # エントリーポイント
├── functions/              # Cloud Functions
│   ├── index.js            # 通知処理
│   └── package.json        # Dependencies
├── firebase.json           # Firebase設定
├── .env.example            # 環境変数テンプレート
└── package.json            # プロジェクト設定
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. Authentication, Firestore, Functionsを有効化
3. `.env`ファイルを作成し、Firebase設定を追加

```bash
cp .env.example .env
```

### 3. Firestore初期設定

データベース構造は `src/firebase/schema.md` を参照してください。

#### 必要なコレクション：
- `customers` - 顧客マスタ
- `products` - 商品マスタ
- `orders` - 発注データ
- `salesStaff` - 営業担当者マスタ
- `notifications` - 通知データ

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

### 顧客ログイン
1. 顧客IDとパスワードでログイン
2. 発注可能商品一覧が表示

### 商品発注
1. 商品カードの +/- ボタンで数量調整
2. 右下の「発注」ボタンで確認画面へ
3. 「発注確定」で注文完了

### 履歴確認
1. 「履歴」タブで過去の発注を確認
2. アコーディオンを開いて詳細表示

## カスタマイズ

### 商品データ追加
`src/hooks/useProducts.js` の `sampleProducts` 配列にデータを追加

### 通知設定変更
`functions/index.js` でメール・LINE通知の設定をカスタマイズ

### UI テーマ変更
`src/App.js` の `theme` オブジェクトでカラーやスタイリングを調整

## セキュリティ

- Firebase Authentication による安全な認証
- Firestore Security Rules による データアクセス制御
- 顧客別データ分離
- HTTPS通信

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

技術的なお問い合わせやバグ報告は、プロジェクトの Issues セクションでお願いします。