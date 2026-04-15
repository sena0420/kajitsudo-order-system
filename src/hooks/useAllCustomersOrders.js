import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase/config';
import {
  collection, query, where, orderBy, getDocs,
  doc, updateDoc, serverTimestamp
} from 'firebase/firestore';

const FIRESTORE_IN_LIMIT = 10; // Firestore の 'in' クエリ上限

/**
 * H-6: 全顧客の注文を一括取得するフック（管理者専用）
 * N+1 Firestore リスナー問題を解消するため、顧客数に関わらず
 * バッチクエリで全注文を取得し、customerIdでグループ化する。
 */
const useAllCustomersOrders = (customers) => {
  const [ordersByCustomer, setOrdersByCustomer] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const customerIds = customers.map(c => c.id);

  const fetchAllOrders = useCallback(async () => {
    if (customers.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        // customerIds を 10件ずつに分割して並列クエリ
        const chunks = [];
        for (let i = 0; i < customerIds.length; i += FIRESTORE_IN_LIMIT) {
          chunks.push(customerIds.slice(i, i + FIRESTORE_IN_LIMIT));
        }

        const chunkResults = await Promise.all(
          chunks.map(chunk =>
            getDocs(query(
              collection(db, 'orders'),
              where('customerId', 'in', chunk),
              orderBy('createdAt', 'desc')
            ))
          )
        );

        const allOrders = chunkResults.flatMap(snap =>
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              orderDate: data.orderDate?.toDate
                ? data.orderDate.toDate().toISOString().split('T')[0]
                : data.orderDate,
              deliveryDate: data.deliveryDate?.toDate
                ? data.deliveryDate.toDate().toISOString().split('T')[0]
                : data.deliveryDate
            };
          })
        );

        // customerId でグループ化
        const grouped = allOrders.reduce((acc, order) => {
          if (!acc[order.customerId]) acc[order.customerId] = [];
          acc[order.customerId].push(order);
          return acc;
        }, {});

        setOrdersByCustomer(grouped);
      } else {
        // デモモード: localStorage から各顧客の注文を読み込む
        const grouped = {};
        for (const customerId of customerIds) {
          try {
            const raw = localStorage.getItem(`orders_${customerId}`);
            const orders = raw ? JSON.parse(raw).map(o => ({
              ...o,
              createdAt: o.createdAt ? new Date(o.createdAt) : new Date(),
              updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date()
            })) : [];
            grouped[customerId] = orders;
          } catch {
            grouped[customerId] = [];
          }
        }
        setOrdersByCustomer(grouped);
      }
    } catch (err) {
      console.error('全顧客注文取得エラー:', err);
      setError('注文データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [customerIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  // 単一注文のアイテム更新（管理者操作）
  const updateOrderItems = useCallback(async (orderId, newItems, newTotalAmount) => {
    const isFirebaseAvailable = auth !== null;

    if (isFirebaseAvailable) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        items: newItems,
        totalAmount: newTotalAmount,
        status: 'change_pending',
        updatedAt: serverTimestamp()
      });
    }

    // ローカル状態を更新
    setOrdersByCustomer(prev => {
      const updated = { ...prev };
      for (const customerId of Object.keys(updated)) {
        updated[customerId] = updated[customerId].map(order =>
          order.id === orderId
            ? { ...order, items: newItems, totalAmount: newTotalAmount, status: 'change_pending', updatedAt: new Date() }
            : order
        );
      }
      return updated;
    });
  }, []);

  return { ordersByCustomer, loading, error, updateOrderItems };
};

export default useAllCustomersOrders;
