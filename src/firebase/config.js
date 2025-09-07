// モックモード用の設定
const DEMO_MODE = !process.env.REACT_APP_FIREBASE_API_KEY;

let auth = null;
let db = null;
let app = null;

if (!DEMO_MODE) {
  // Firebase設定（実際の値は環境変数から読み込み）
  const { initializeApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  };

  // Firebase初期化
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  console.log('🔧 デモモードで動作中 - Firebase設定なしでモックデータを使用');
}

// Firebase サービスのエクスポート
export { auth, db };
export default app;