const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Gmail SMTP設定（実際の運用では環境変数から取得）
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
});

// 新規発注時の通知処理
exports.sendOrderNotification = functions.firestore
  .document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const orderData = snap.data();
    const orderId = context.params.orderId;

    try {
      // 営業担当者情報を取得
      const salesStaffDoc = await admin
        .firestore()
        .collection('salesStaff')
        .doc(orderData.salesStaffId)
        .get();

      if (!salesStaffDoc.exists) {
        console.error('営業担当者が見つかりません:', orderData.salesStaffId);
        return;
      }

      const salesStaff = salesStaffDoc.data();

      // メール通知
      if (salesStaff.notificationSettings?.email) {
        await sendEmailNotification(salesStaff, orderData, orderId);
      }

      // LINE通知（将来実装）
      if (salesStaff.notificationSettings?.line) {
        await sendLineNotification(salesStaff, orderData, orderId);
      }

      console.log('通知送信完了:', orderId);
    } catch (error) {
      console.error('通知送信エラー:', error);
    }
  });

// メール通知送信
async function sendEmailNotification(salesStaff, orderData, orderId) {
  const mailOptions = {
    from: functions.config().gmail.email,
    to: salesStaff.email,
    subject: `【発注通知】${orderData.customerName}からの新規発注`,
    html: generateEmailTemplate(orderData, orderId)
  };

  await transporter.sendMail(mailOptions);
  console.log('メール送信完了:', salesStaff.email);
}

// LINE通知送信（実装予定）
// eslint-disable-next-line no-unused-vars
async function sendLineNotification(salesStaff, orderData, orderId) {
  // TODO: LINE Messaging API を使用した通知実装予定
}

// M-1: HTML エスケープ（XSS対策）
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// メールテンプレート生成
function generateEmailTemplate(orderData, orderId) {
  const itemsHtml = orderData.items.map(item => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(item.workCode)}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(item.productName)}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(item.specification)}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(item.origin)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${escapeHtml(item.quantity)}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">¥${item.unitPrice.toLocaleString()}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">¥${item.subtotal.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #2196f3;">新規発注通知</h2>

      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3>発注概要</h3>
        <p><strong>発注ID:</strong> ${escapeHtml(orderId)}</p>
        <p><strong>顧客名:</strong> ${escapeHtml(orderData.customerName)}</p>
        <p><strong>発注日:</strong> ${escapeHtml(orderData.orderDate)}</p>
        <p><strong>希望納期:</strong> ${escapeHtml(orderData.deliveryDate)}</p>
        <p><strong>合計金額:</strong> ¥${orderData.totalAmount.toLocaleString()}</p>
      </div>

      <h3>発注商品</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #2196f3; color: white;">
            <th style="border: 1px solid #ddd; padding: 8px;">作業コード</th>
            <th style="border: 1px solid #ddd; padding: 8px;">商品名</th>
            <th style="border: 1px solid #ddd; padding: 8px;">規格</th>
            <th style="border: 1px solid #ddd; padding: 8px;">産地</th>
            <th style="border: 1px solid #ddd; padding: 8px;">数量</th>
            <th style="border: 1px solid #ddd; padding: 8px;">単価</th>
            <th style="border: 1px solid #ddd; padding: 8px;">小計</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td colspan="6" style="border: 1px solid #ddd; padding: 8px; text-align: right;">合計</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">¥${orderData.totalAmount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <p><strong>注意事項:</strong></p>
        <p>この発注に対して適切な対応をお願いします。在庫確認と配送手配を進めてください。</p>
      </div>

      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        このメールは発注システムから自動送信されています。<br>
        お問い合わせは担当部署までご連絡ください。
      </p>
    </div>
  `;
}

// 通知ステータス更新関数
exports.updateNotificationStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です');
  }
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  const { notificationId, status } = data;

  try {
    await admin
      .firestore()
      .collection('notifications')
      .doc(notificationId)
      .update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return { success: true };
  } catch (error) {
    console.error('通知ステータス更新エラー:', error);
    throw new functions.https.HttpsError('internal', '通知ステータスの更新に失敗しました');
  }
});

// M-2: 許可フィールド定義（ホワイトリスト方式）
const ALLOWED_FIELDS = {
  customers: ['customerId', 'name', 'email', 'salesStaffId', 'minDeliveryDays', 'isActive', 'password'],
  products: ['customerId', 'workCode', 'name', 'specification', 'origin', 'unitPrice', 'minDeliveryDays', 'isActive', 'weeklyStartDay', 'orderCount']
};
const MAX_BATCH_SIZE = 1000;

// レコードから許可フィールドのみ抽出
function filterAllowedFields(dataType, record) {
  const allowed = ALLOWED_FIELDS[dataType];
  if (!allowed) return {};
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => allowed.includes(key))
  );
}

// RPA向け一括データ更新API
exports.batchUpdateMasterData = functions.https.onCall(async (data, context) => {
  // 管理者権限チェック
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  const { dataType, records, options } = data;

  // M-2: データタイプ検証
  if (!ALLOWED_FIELDS[dataType]) {
    throw new functions.https.HttpsError('invalid-argument', `未対応のデータタイプ: ${dataType}`);
  }

  // M-2: 件数上限チェック
  if (!Array.isArray(records) || records.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'レコードが空です');
  }
  if (records.length > MAX_BATCH_SIZE) {
    throw new functions.https.HttpsError('invalid-argument', `一度に処理できるレコードは${MAX_BATCH_SIZE}件までです（指定: ${records.length}件）`);
  }

  const batch = admin.firestore().batch();
  const results = {
    success: 0,
    errors: [],
    total: records.length
  };

  try {
    for (let i = 0; i < records.length; i++) {
      // M-2: 許可フィールドのみを取り出す（余分なフィールドを除去）
      const record = filterAllowedFields(dataType, records[i]);

      try {
        if (dataType === 'customers') {
          await processBatchCustomer(batch, record, options);
        } else if (dataType === 'products') {
          await processBatchProduct(batch, record, options);
        } else {
          throw new Error(`未対応のデータタイプ: ${dataType}`);
        }
        results.success++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          record: records[i],
          error: error.message
        });
      }
    }

    if (results.success > 0) {
      await batch.commit();
    }

    // 処理ログを記録
    await admin.firestore().collection('batchLogs').add({
      dataType,
      results,
      processedBy: context.auth.uid,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return results;
  } catch (error) {
    console.error('一括更新エラー:', error);
    throw new functions.https.HttpsError('internal', 'データの一括更新に失敗しました');
  }
});

// 顧客データの処理
async function processBatchCustomer(batch, record, options) {
  const customerRef = admin.firestore().collection('customers').doc(record.customerId);
  
  if (options.mode === 'upsert') {
    const existingDoc = await customerRef.get();
    if (existingDoc.exists) {
      batch.update(customerRef, {
        ...record,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      batch.set(customerRef, {
        ...record,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } else if (options.mode === 'overwrite') {
    batch.set(customerRef, {
      ...record,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

// 商品データの処理
async function processBatchProduct(batch, record, options) {
  const productRef = admin.firestore().collection('products').doc();
  
  // 顧客の存在確認
  const customerDoc = await admin.firestore()
    .collection('customers')
    .doc(record.customerId)
    .get();
    
  if (!customerDoc.exists) {
    throw new Error(`顧客ID ${record.customerId} が存在しません`);
  }

  if (options.mode === 'upsert') {
    // workCode + customerIdで既存データを検索
    const existingQuery = await admin.firestore()
      .collection('products')
      .where('customerId', '==', record.customerId)
      .where('workCode', '==', record.workCode)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      // 更新
      const existingRef = existingQuery.docs[0].ref;
      batch.update(existingRef, {
        ...record,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // 新規作成
      batch.set(productRef, {
        ...record,
        orderCount: record.orderCount || 0,
        isActive: record.isActive !== undefined ? record.isActive : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}

// バッチ処理ログ取得API
exports.getBatchLogs = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  const { limit = 50 } = data;

  try {
    const logsQuery = await admin.firestore()
      .collection('batchLogs')
      .orderBy('processedAt', 'desc')
      .limit(limit)
      .get();

    const logs = logsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      processedAt: doc.data().processedAt?.toDate()
    }));

    return { logs };
  } catch (error) {
    console.error('ログ取得エラー:', error);
    throw new functions.https.HttpsError('internal', 'ログの取得に失敗しました');
  }
});

// ============================================
// Custom Claims 管理機能
// ============================================

// 全ユーザー一覧取得（Custom Claims付き）
exports.listUsers = functions.https.onCall(async (data, context) => {
  // 管理者権限チェック
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  const { maxResults = 1000 } = data;

  try {
    const listUsersResult = await admin.auth().listUsers(maxResults);

    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      disabled: userRecord.disabled,
      customClaims: userRecord.customClaims || {},
      metadata: {
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime
      }
    }));

    return { users, success: true };
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    throw new functions.https.HttpsError('internal', 'ユーザー一覧の取得に失敗しました');
  }
});

// Custom Claims設定
exports.setUserClaims = functions.https.onCall(async (data, context) => {
  // 管理者権限チェック
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  const { uid, customClaims } = data;

  // 入力バリデーション
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'ユーザーIDが必要です');
  }

  if (!customClaims || typeof customClaims !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Custom Claimsが不正です');
  }

  try {
    // Custom Claimsを設定
    await admin.auth().setCustomUserClaims(uid, customClaims);

    // ログを記録
    await admin.firestore().collection('customClaimsLogs').add({
      uid,
      customClaims,
      updatedBy: context.auth.uid,
      updatedByEmail: context.auth.token.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Custom Claims設定完了: ${uid}`, customClaims);

    return {
      success: true,
      message: 'Custom Claimsを設定しました。ユーザーは再ログインが必要です。'
    };
  } catch (error) {
    console.error('Custom Claims設定エラー:', error);
    throw new functions.https.HttpsError('internal', 'Custom Claimsの設定に失敗しました: ' + error.message);
  }
});

// 特定ユーザーのCustom Claims取得
exports.getUserClaims = functions.https.onCall(async (data, context) => {
  // 管理者権限チェック
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'ユーザーIDが必要です');
  }

  try {
    const userRecord = await admin.auth().getUser(uid);

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      customClaims: userRecord.customClaims || {},
      success: true
    };
  } catch (error) {
    console.error('Custom Claims取得エラー:', error);
    throw new functions.https.HttpsError('internal', 'Custom Claimsの取得に失敗しました');
  }
});

// Custom Claims一括設定（顧客マスタと連携）
exports.syncCustomerClaims = functions.https.onCall(async (data, context) => {
  // 管理者権限チェック
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です');
  }

  try {
    // 全ユーザー取得
    const listUsersResult = await admin.auth().listUsers(1000);

    // 全顧客マスタ取得
    const customersSnapshot = await admin.firestore().collection('customers').get();
    const customers = {};
    customersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) {
        customers[data.email] = doc.id; // email -> customerId のマップ
      }
    });

    const results = {
      success: 0,
      errors: [],
      total: listUsersResult.users.length
    };

    // 各ユーザーのCustom Claimsを設定
    for (const userRecord of listUsersResult.users) {
      try {
        const email = userRecord.email;
        const customerId = customers[email];

        if (customerId) {
          // 顧客マスタにメールが存在する場合、customerIdを設定
          // M-3: 既存の admin 権限を上書きしないよう currentClaims を尊重する
          const currentClaims = userRecord.customClaims || {};
          await admin.auth().setCustomUserClaims(userRecord.uid, {
            admin: currentClaims.admin || false,
            customerId: customerId
          });
          results.success++;
          console.log(`Custom Claims設定完了: ${email} -> ${customerId}`);
        } else {
          // 顧客マスタに存在しない場合はスキップ（管理者の可能性）
          console.log(`スキップ: ${email} (顧客マスタに存在しません)`);
        }
      } catch (error) {
        results.errors.push({
          email: userRecord.email,
          error: error.message
        });
      }
    }

    // ログを記録
    await admin.firestore().collection('customClaimsLogs').add({
      type: 'bulk_sync',
      results,
      syncedBy: context.auth.uid,
      syncedByEmail: context.auth.token.email,
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      results,
      message: `${results.success}件のCustom Claimsを設定しました`
    };
  } catch (error) {
    console.error('一括同期エラー:', error);
    throw new functions.https.HttpsError('internal', '一括同期に失敗しました: ' + error.message);
  }
});