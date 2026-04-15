import { db, auth } from './config';
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase が利用可能かチェック
const isFirebaseAvailable = db !== null;

// 認証サービス
export const authService = {
  // 顧客ログイン
  async loginCustomer(customerId, password) {
    try {
      // 顧客IDでメールアドレスを取得
      const customerRef = doc(db, 'customers', customerId);
      const customerSnap = await getDoc(customerRef);
      
      if (!customerSnap.exists()) {
        throw new Error('顧客が見つかりません');
      }
      
      const customerData = customerSnap.data();
      const userCredential = await signInWithEmailAndPassword(auth, customerData.email, password);
      
      return {
        uid: userCredential.user.uid,
        customerId,
        customerName: customerData.name,
        email: customerData.email,
        salesStaffId: customerData.salesStaffId
      };
    } catch (error) {
      throw error;
    }
  },

  // ログアウト
  async logout() {
    await signOut(auth);
  }
};

// 商品マスタサービス
export const productService = {
  // 顧客の商品一覧取得（発注回数順）
  async getCustomerProducts(customerId) {
    if (!isFirebaseAvailable) {
      console.log('🔧 デモモード: 商品データ取得をスキップ');
      return [];
    }

    try {
      const q = query(
        collection(db, 'products'),
        where('customerId', '==', customerId),
        orderBy('orderCount', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('商品取得エラー:', error);
      throw error;
    }
  },

  // 商品の発注回数を増加
  async incrementOrderCount(productId) {
    if (!isFirebaseAvailable) {
      console.log('🔧 デモモード: 発注回数更新をスキップ');
      return;
    }

    try {
      const { updateDoc, increment } = await import('firebase/firestore');

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        orderCount: increment(1),
        lastOrderDate: serverTimestamp()
      });
    } catch (error) {
      console.error('発注回数更新エラー:', error);
    }
  }
};

// 発注サービス
export const orderService = {
  // 新規発注
  async createOrder(orderData) {
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 商品の発注回数を更新
      for (const item of orderData.items) {
        await productService.incrementOrderCount(item.productId);
      }

      return orderRef.id;
    } catch (error) {
      console.error('発注作成エラー:', error);
      throw error;
    }
  },

  // 顧客の発注履歴取得
  async getCustomerOrders(customerId, limitCount = 50) {
    try {
      const q = query(
        collection(db, 'orders'),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('発注履歴取得エラー:', error);
      throw error;
    }
  }
};

// 営業担当者サービス
export const salesStaffService = {
  // 営業担当者情報取得
  async getSalesStaff(salesStaffId) {
    try {
      const salesStaffRef = doc(db, 'salesStaff', salesStaffId);
      const salesStaffSnap = await getDoc(salesStaffRef);
      
      if (salesStaffSnap.exists()) {
        return {
          id: salesStaffSnap.id,
          ...salesStaffSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('営業担当者情報取得エラー:', error);
      throw error;
    }
  }
};

// 通知サービス
export const notificationService = {
  // 営業担当者へ発注通知
  async notifyOrder(salesStaffId, orderData) {
    if (!isFirebaseAvailable) {
      console.log('🔧 デモモード: 営業担当者に通知されました（モック）');
      return;
    }

    try {
      // Cloud Functionsで実装予定
      // メール通知やLINE通知など
      await addDoc(collection(db, 'notifications'), {
        type: 'order',
        recipientType: 'salesStaff',
        recipientId: salesStaffId,
        orderData: orderData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      console.log('通知が送信されました');
    } catch (error) {
      console.error('通知送信エラー:', error);
      throw error;
    }
  }
};