// 初期データ投入スクリプト
// Firebase Admin SDKを使用してデータを投入します

const admin = require('firebase-admin');

// サービスアカウントキーのパスを設定
// Firebase Console > プロジェクト設定 > サービスアカウント > 新しい秘密鍵の生成
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 営業担当者マスタ
const salesStaffData = [
  {
    id: 'STAFF001',
    name: '田中太郎',
    email: 'tanaka@company.com',
    phone: '090-1234-5678',
    department: '営業部',
    isActive: true,
    notificationSettings: {
      email: true,
      sms: false,
      line: false
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'STAFF002',
    name: '佐藤花子',
    email: 'sato@company.com',
    phone: '090-2345-6789',
    department: '営業部',
    isActive: true,
    notificationSettings: {
      email: true,
      sms: false,
      line: false
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// 顧客マスタ
const customersData = [
  {
    id: 'CUST001',
    name: 'さくらスーパー',
    email: 'sakura@example.com',
    salesStaffId: 'STAFF001',
    minDeliveryDays: 2,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'CUST002',
    name: 'ひまわりマート',
    email: 'himawari@example.com',
    salesStaffId: 'STAFF002',
    minDeliveryDays: 3,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// 商品マスタ（CUST001用）
const productsDataCust001 = [
  {
    customerId: 'CUST001',
    workCode: '10001',
    name: 'りんご',
    specification: '5kg箱',
    origin: '青森県',
    unitPrice: 2500,
    minDeliveryDays: 2,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    customerId: 'CUST001',
    workCode: '10002',
    name: 'みかん',
    specification: '10kg箱',
    origin: '愛媛県',
    unitPrice: 3200,
    minDeliveryDays: 2,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    customerId: 'CUST001',
    workCode: '10003',
    name: 'バナナ',
    specification: '13kg箱',
    origin: 'フィリピン',
    unitPrice: 1800,
    minDeliveryDays: 3,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    customerId: 'CUST001',
    workCode: '20001',
    name: 'キャベツ',
    specification: '1玉',
    origin: '群馬県',
    unitPrice: 150,
    minDeliveryDays: 1,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    customerId: 'CUST001',
    workCode: '20002',
    name: 'レタス',
    specification: '1玉',
    origin: '長野県',
    unitPrice: 180,
    minDeliveryDays: 1,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    customerId: 'CUST001',
    workCode: '20003',
    name: 'トマト',
    specification: '4kg箱',
    origin: '熊本県',
    unitPrice: 1200,
    minDeliveryDays: 2,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// 商品マスタ（CUST002用）
const productsDataCust002 = [
  {
    customerId: 'CUST002',
    workCode: '10001',
    name: 'りんご',
    specification: '5kg箱',
    origin: '青森県',
    unitPrice: 2600,
    minDeliveryDays: 3,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    customerId: 'CUST002',
    workCode: '20001',
    name: 'キャベツ',
    specification: '1玉',
    origin: '群馬県',
    unitPrice: 160,
    minDeliveryDays: 2,
    orderCount: 0,
    lastOrderDate: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function seedData() {
  try {
    console.log('データ投入を開始します...\n');

    // 営業担当者マスタ
    console.log('営業担当者マスタを投入中...');
    for (const staff of salesStaffData) {
      await db.collection('salesStaff').doc(staff.id).set(staff);
      console.log(`  ✓ ${staff.name} (${staff.id})`);
    }

    // 顧客マスタ
    console.log('\n顧客マスタを投入中...');
    for (const customer of customersData) {
      await db.collection('customers').doc(customer.id).set(customer);
      console.log(`  ✓ ${customer.name} (${customer.id})`);
    }

    // 商品マスタ（CUST001）
    console.log('\n商品マスタ（CUST001）を投入中...');
    for (const product of productsDataCust001) {
      await db.collection('products').add(product);
      console.log(`  ✓ ${product.name} - ${product.specification} (${product.workCode})`);
    }

    // 商品マスタ（CUST002）
    console.log('\n商品マスタ（CUST002）を投入中...');
    for (const product of productsDataCust002) {
      await db.collection('products').add(product);
      console.log(`  ✓ ${product.name} - ${product.specification} (${product.workCode})`);
    }

    console.log('\n✅ データ投入が完了しました！');
    process.exit(0);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

seedData();
