/**
 * 既存ordersに deliveryLocationId を追加する移行スクリプト
 *
 * 実行方法:
 * 1. Firebase Admin SDKをインストール: npm install firebase-admin
 * 2. このスクリプトを実行: node scripts/migrateOrdersDeliveryLocation.js
 *
 * 処理内容:
 * - 商品名から納品先を判定（りんご・キャベツ→LOC0001、みかん→LOC0002）
 * - deliveryLocationId, deliveryLocationName フィールドを追加
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin初期化
const serviceAccount = require('../serviceAccountKey.json'); // サービスアカウントキーが必要

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// 商品名から納品先を判定
const getDeliveryLocationByProduct = (productName) => {
  // りんご、キャベツ → LOC0001（本店）
  if (productName.includes('りんご') || productName.includes('キャベツ')) {
    return {
      id: 'LOC0001',
      name: '本店'
    };
  }

  // みかん → LOC0002（第2倉庫）
  if (productName.includes('みかん')) {
    return {
      id: 'LOC0002',
      name: '第2倉庫'
    };
  }

  // その他 → デフォルトLOC0001
  return {
    id: 'LOC0001',
    name: '本店'
  };
};

// 発注の納品先を判定（複数商品がある場合は最初の商品で判断）
const getDeliveryLocationForOrder = (order) => {
  if (!order.items || order.items.length === 0) {
    return {
      id: 'LOC0001',
      name: '本店'
    };
  }

  // 最初の商品から納品先を判定
  const firstProduct = order.items[0];
  return getDeliveryLocationByProduct(firstProduct.productName || '');
};

async function migrateOrders() {
  try {
    console.log('🔄 発注データの移行を開始します...\n');

    // deliveryLocationIdフィールドがないordersを取得
    const ordersSnapshot = await db.collection('orders').get();

    let updateCount = 0;
    let skipCount = 0;
    const batch = db.batch();

    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();

      // すでにdeliveryLocationIdがある場合はスキップ
      if (order.deliveryLocationId) {
        skipCount++;
        console.log(`⏭️  スキップ: ${doc.id} (すでにdeliveryLocationId設定済み)`);
        continue;
      }

      // 納品先を判定
      const deliveryLocation = getDeliveryLocationForOrder(order);

      // 更新処理をバッチに追加
      batch.update(doc.ref, {
        deliveryLocationId: deliveryLocation.id,
        deliveryLocationName: deliveryLocation.name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      updateCount++;

      // 商品情報を表示
      const productNames = order.items?.map(item => item.productName).join(', ') || '不明';
      console.log(`✅ 更新予定: ${doc.id}`);
      console.log(`   商品: ${productNames}`);
      console.log(`   納品先: ${deliveryLocation.name} (${deliveryLocation.id})\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 処理サマリー:`);
    console.log(`   更新対象: ${updateCount} 件`);
    console.log(`   スキップ: ${skipCount} 件`);
    console.log(`   合計: ${ordersSnapshot.size} 件`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (updateCount === 0) {
      console.log('✨ 更新対象のデータがありません。移行は不要です。');
      return;
    }

    // 確認プロンプト
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    await new Promise((resolve) => {
      rl.question(`\n⚠️  ${updateCount}件のデータを更新しますか？ (yes/no): `, async (answer) => {
        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          console.log('\n🚀 バッチ更新を実行中...');
          await batch.commit();
          console.log('✅ 移行が完了しました！\n');
          updateCount = updateCount; // 表示用に保持
        } else {
          console.log('\n❌ 移行をキャンセルしました。');
          updateCount = 0;
        }
        rl.close();
        resolve();
      });
    });

    if (updateCount > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 完了！発注履歴画面をリロードして確認してください。');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }

  process.exit(0);
}

// スクリプト実行
migrateOrders();
