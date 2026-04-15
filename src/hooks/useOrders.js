import { useState, useEffect } from 'react';
import { orderService } from '../firebase/services';

export const useOrders = (customerId, deliveryLocationId = null) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // localStorageから発注データを読み込む
  const loadOrdersFromStorage = () => {
    try {
      const savedOrders = localStorage.getItem(`orders_${customerId}`);
      if (!savedOrders) return [];

      const parsedOrders = JSON.parse(savedOrders);
      // 日付文字列をDateオブジェクトに変換
      return parsedOrders.map(order => ({
        ...order,
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date()
      }));
    } catch (error) {
      console.error('発注データの読み込みエラー:', error);
      return [];
    }
  };

  // localStorageに発注データを保存
  const saveOrdersToStorage = (ordersData) => {
    try {
      localStorage.setItem(`orders_${customerId}`, JSON.stringify(ordersData));
    } catch (error) {
      console.error('発注データの保存エラー:', error);
    }
  };

  // 発注履歴の取得
  const fetchOrders = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Firebaseが利用可能かチェック
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        // Firestoreから発注データを取得
        const { collection, query, where, getDocs, orderBy } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        const ordersRef = collection(db, 'orders');

        // 納品先でフィルタリング（指定されている場合）
        const queryConstraints = [
          where('customerId', '==', customerId)
        ];

        if (deliveryLocationId) {
          queryConstraints.push(where('deliveryLocationId', '==', deliveryLocationId));
        }

        queryConstraints.push(orderBy('createdAt', 'desc'));

        const q = query(ordersRef, ...queryConstraints);

        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Firestoreのタイムスタンプを変換
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            // 日付フィールドの変換（文字列またはTimestamp）
            orderDate: data.orderDate?.toDate ? data.orderDate.toDate().toISOString().split('T')[0] : data.orderDate,
            deliveryDate: data.deliveryDate?.toDate ? data.deliveryDate.toDate().toISOString().split('T')[0] : data.deliveryDate
          };
        });

        setOrders(ordersData);
      } else {
        // デモモード: localStorageから既存の発注データを取得
        const savedOrders = loadOrdersFromStorage();

        // localStorageに保存済みのデータがあればそれを使う。なければモックデータを使用する
        const sampleOrders = savedOrders.length > 0 ? savedOrders : [
        {
          id: 'ORD001',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0001',
          deliveryLocationName: '本店',
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-15',
          deliveryDate: '2024-01-22',
          status: 'confirmed',
          totalAmount: 15600,
          items: [
            { 
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご', 
              specification: '5kg箱', 
              origin: '青森県',
              quantity: 3, 
              unitPrice: 2500,
              subtotal: 7500
            },
            { 
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん', 
              specification: '10kg箱', 
              origin: '愛媛県',
              quantity: 2, 
              unitPrice: 3200,
              subtotal: 6400
            },
            { 
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ', 
              specification: '1玉', 
              origin: '群馬県',
              quantity: 11, 
              unitPrice: 150,
              subtotal: 1650
            }
          ],
          createdAt: new Date('2024-01-15T10:30:00'),
          updatedAt: new Date('2024-01-22T14:20:00')
        },
        {
          id: 'ORD002',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0002',
          deliveryLocationName: '第2倉庫',
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-10',
          deliveryDate: '2024-01-17',
          status: 'change_pending',
          totalAmount: 8400,
          items: [
            { 
              productId: 'P003',
              workCode: 'C789',
              productName: 'バナナ', 
              specification: '13kg箱', 
              origin: 'フィリピン',
              quantity: 3, 
              unitPrice: 1800,
              subtotal: 5400
            },
            { 
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ', 
              specification: '1玉', 
              origin: '群馬県',
              quantity: 20, 
              unitPrice: 150,
              subtotal: 3000
            }
          ],
          createdAt: new Date('2024-01-10T09:15:00'),
          updatedAt: new Date('2024-01-17T11:45:00')
        },
        {
          id: 'ORD003',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0001',
          deliveryLocationName: '本店',
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-08',
          deliveryDate: '2024-01-15',
          status: 'pending',
          totalAmount: 5000,
          items: [
            { 
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご', 
              specification: '5kg箱', 
              origin: '青森県',
              quantity: 2, 
              unitPrice: 2500,
              subtotal: 5000
            }
          ],
          createdAt: new Date('2024-01-08T16:45:00'),
          updatedAt: new Date('2024-01-08T16:45:00')
        },
        {
          id: 'ORD004',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0002',
          deliveryLocationName: '第2倉庫',
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-05',
          deliveryDate: '2024-01-12',
          status: 'confirmed',
          totalAmount: 12000,
          items: [
            { 
              productId: 'P005',
              workCode: 'E345',
              productName: 'トマト', 
              specification: '4kg箱', 
              origin: '熊本県',
              quantity: 5, 
              unitPrice: 1200,
              subtotal: 6000
            },
            { 
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん', 
              specification: '10kg箱', 
              origin: '愛媛県',
              quantity: 1, 
              unitPrice: 3200,
              subtotal: 3200
            },
            { 
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご', 
              specification: '5kg箱', 
              origin: '青森県',
              quantity: 1, 
              unitPrice: 2500,
              subtotal: 2500
            },
            { 
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ', 
              specification: '1玉', 
              origin: '群馬県',
              quantity: 2, 
              unitPrice: 150,
              subtotal: 300
            }
          ],
          createdAt: new Date('2024-01-05T13:20:00'),
          updatedAt: new Date('2024-01-12T16:10:00')
        },
        {
          id: 'ORD005',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0001',
          deliveryLocationName: '本店',
          salesStaffId: 'STAFF001',
          orderDate: '2025-10-08',
          deliveryDate: '2025-10-18',
          status: 'pending',
          totalAmount: 18500,
          items: [
            {
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご',
              specification: '5kg箱',
              origin: '青森県',
              quantity: 5,
              unitPrice: 2500,
              subtotal: 12500
            },
            {
              productId: 'P005',
              workCode: 'E345',
              productName: 'トマト',
              specification: '4kg箱',
              origin: '熊本県',
              quantity: 3,
              unitPrice: 1200,
              subtotal: 3600
            },
            {
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん',
              specification: '10kg箱',
              origin: '愛媛県',
              quantity: 1,
              unitPrice: 3200,
              subtotal: 3200
            },
            {
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ',
              specification: '1玉',
              origin: '群馬県',
              quantity: 8,
              unitPrice: 150,
              subtotal: 1200
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'ORD006',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0002',
          deliveryLocationName: '第2倉庫',
          salesStaffId: 'STAFF001',
          orderDate: '2025-10-07',
          deliveryDate: '2025-10-17',
          status: 'pending',
          totalAmount: 22800,
          items: [
            {
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご',
              specification: '5kg箱',
              origin: '青森県',
              quantity: 4,
              unitPrice: 2500,
              subtotal: 10000
            },
            {
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん',
              specification: '10kg箱',
              origin: '愛媛県',
              quantity: 2,
              unitPrice: 3200,
              subtotal: 6400
            },
            {
              productId: 'P003',
              workCode: 'C789',
              productName: 'バナナ',
              specification: '13kg箱',
              origin: 'フィリピン',
              quantity: 2,
              unitPrice: 1800,
              subtotal: 3600
            },
            {
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ',
              specification: '1玉',
              origin: '群馬県',
              quantity: 12,
              unitPrice: 150,
              subtotal: 1800
            },
            {
              productId: 'P005',
              workCode: 'E345',
              productName: 'トマト',
              specification: '4kg箱',
              origin: '熊本県',
              quantity: 1,
              unitPrice: 1000,
              subtotal: 1000
            }
          ],
          createdAt: new Date('2025-10-07T10:00:00'),
          updatedAt: new Date('2025-10-07T10:00:00')
        },
        {
          id: 'ORD007',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0001',
          deliveryLocationName: '本店',
          salesStaffId: 'STAFF001',
          orderDate: '2025-10-06',
          deliveryDate: '2025-10-16',
          status: 'change_pending',
          totalAmount: 19500,
          items: [
            {
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん',
              specification: '10kg箱',
              origin: '愛媛県',
              quantity: 3,
              unitPrice: 3200,
              subtotal: 9600
            },
            {
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご',
              specification: '5kg箱',
              origin: '青森県',
              quantity: 3,
              unitPrice: 2500,
              subtotal: 7500
            },
            {
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ',
              specification: '1玉',
              origin: '群馬県',
              quantity: 16,
              unitPrice: 150,
              subtotal: 2400
            }
          ],
          createdAt: new Date('2025-10-06T14:30:00'),
          updatedAt: new Date('2025-10-06T14:30:00')
        },
        {
          id: 'ORD008',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0002',
          deliveryLocationName: '第2倉庫',
          salesStaffId: 'STAFF001',
          orderDate: '2025-10-05',
          deliveryDate: '2025-10-15',
          status: 'pending',
          totalAmount: 26700,
          items: [
            {
              productId: 'P005',
              workCode: 'E345',
              productName: 'トマト',
              specification: '4kg箱',
              origin: '熊本県',
              quantity: 6,
              unitPrice: 1200,
              subtotal: 7200
            },
            {
              productId: 'P003',
              workCode: 'C789',
              productName: 'バナナ',
              specification: '13kg箱',
              origin: 'フィリピン',
              quantity: 4,
              unitPrice: 1800,
              subtotal: 7200
            },
            {
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご',
              specification: '5kg箱',
              origin: '青森県',
              quantity: 4,
              unitPrice: 2500,
              subtotal: 10000
            },
            {
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ',
              specification: '1玉',
              origin: '群馬県',
              quantity: 14,
              unitPrice: 150,
              subtotal: 2100
            },
            {
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん',
              specification: '10kg箱',
              origin: '愛媛県',
              quantity: 1,
              unitPrice: 200,
              subtotal: 200
            }
          ],
          createdAt: new Date('2025-10-05T09:15:00'),
          updatedAt: new Date('2025-10-05T09:15:00')
        },
        {
          id: 'ORD009',
          customerId: customerId,
          customerName: '〇〇スーパー',
          deliveryLocationId: 'LOC0001',
          deliveryLocationName: '本店',
          salesStaffId: 'STAFF001',
          orderDate: '2025-10-04',
          deliveryDate: '2025-10-14',
          status: 'confirmed',
          totalAmount: 15400,
          items: [
            {
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご',
              specification: '5kg箱',
              origin: '青森県',
              quantity: 2,
              unitPrice: 2500,
              subtotal: 5000
            },
            {
              productId: 'P003',
              workCode: 'C789',
              productName: 'バナナ',
              specification: '13kg箱',
              origin: 'フィリピン',
              quantity: 3,
              unitPrice: 1800,
              subtotal: 5400
            },
            {
              productId: 'P005',
              workCode: 'E345',
              productName: 'トマト',
              specification: '4kg箱',
              origin: '熊本県',
              quantity: 3,
              unitPrice: 1200,
              subtotal: 3600
            },
            {
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ',
              specification: '1玉',
              origin: '群馬県',
              quantity: 9,
              unitPrice: 150,
              subtotal: 1350
            },
            {
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん',
              specification: '10kg箱',
              origin: '愛媛県',
              quantity: 1,
              unitPrice: 50,
              subtotal: 50
            }
          ],
          createdAt: new Date('2025-10-04T11:20:00'),
          updatedAt: new Date('2025-10-04T11:20:00')
        },
        {
          id: 'ORD010',
          customerId: customerId,
          customerName: '〇〇スーパー',
          salesStaffId: 'STAFF001',
          orderDate: '2025-10-03',
          deliveryDate: '2025-10-13',
          status: 'confirmed',
          totalAmount: 20800,
          items: [
            {
              productId: 'P002',
              workCode: 'B456',
              productName: 'みかん',
              specification: '10kg箱',
              origin: '愛媛県',
              quantity: 4,
              unitPrice: 3200,
              subtotal: 12800
            },
            {
              productId: 'P005',
              workCode: 'E345',
              productName: 'トマト',
              specification: '4kg箱',
              origin: '熊本県',
              quantity: 5,
              unitPrice: 1200,
              subtotal: 6000
            },
            {
              productId: 'P004',
              workCode: 'D012',
              productName: 'キャベツ',
              specification: '1玉',
              origin: '群馬県',
              quantity: 13,
              unitPrice: 150,
              subtotal: 1950
            },
            {
              productId: 'P001',
              workCode: 'A123',
              productName: 'りんご',
              specification: '5kg箱',
              origin: '青森県',
              quantity: 1,
              unitPrice: 50,
              subtotal: 50
            }
          ],
          createdAt: new Date('2025-10-03T16:45:00'),
          updatedAt: new Date('2025-10-03T16:45:00')
        }
      ];

      // 納品先でフィルタリング（指定されている場合）
        let filteredOrders = sampleOrders;
        if (deliveryLocationId) {
          filteredOrders = sampleOrders.filter(
            order => order.deliveryLocationId === deliveryLocationId
          );
        }

        // 発注日の新しい順にソート
        const sortedOrders = filteredOrders.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        // localStorageに保存
        saveOrdersToStorage(sortedOrders);

        setOrders(sortedOrders);
      }
    } catch (err) {
      console.error('発注履歴取得エラー:', err);
      setError('発注履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 新規発注を履歴に追加
  const addOrder = (newOrder) => {
    const orderWithDefaults = {
      ...newOrder,
      id: `ORD${Date.now()}`,
      status: 'pending', // デフォルトは「処理待ち」
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setOrders(prev => {
      const updatedOrders = [orderWithDefaults, ...prev];
      saveOrdersToStorage(updatedOrders);
      return updatedOrders;
    });
  };

  // ステータスを更新
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Firebaseが利用可能かチェック
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        // Firestoreの発注ステータスを更新
        const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          status: newStatus,
          updatedAt: serverTimestamp()
        });
      }

      // UIの即座な更新
      setOrders(prev => {
        const updatedOrders = prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        );
        saveOrdersToStorage(updatedOrders);
        return updatedOrders;
      });
    } catch (err) {
      console.error('ステータス更新エラー:', err);
      fetchOrders();
      throw err;
    }
  };

  // 複数の発注のステータスを一括更新
  const updateMultipleOrdersStatus = async (orderIds, newStatus) => {
    try {
      // Firebaseが利用可能かチェック
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        const { doc, updateDoc, serverTimestamp, writeBatch } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        // バッチ更新で複数の注文を一括更新
        const batch = writeBatch(db);
        orderIds.forEach(orderId => {
          const orderRef = doc(db, 'orders', orderId);
          batch.update(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
      }

      // UIの即座な更新
      setOrders(prev => {
        const updatedOrders = prev.map(order =>
          orderIds.includes(order.id)
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        );
        saveOrdersToStorage(updatedOrders);
        return updatedOrders;
      });
    } catch (err) {
      console.error('一括ステータス更新エラー:', err);
      fetchOrders();
      throw err;
    }
  };

  // 発注内容を更新（数量変更）
  const updateOrderItems = async (orderId, newItems, newTotalAmount) => {
    try {
      // Firebaseが利用可能かチェック
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        // Firestoreの発注データを更新
        const { doc, updateDoc, serverTimestamp } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
          items: newItems,
          totalAmount: newTotalAmount,
          status: 'change_pending', // 変更処理待ちに変更
          updatedAt: serverTimestamp()
        });
      }

      // UIの即座な更新（楽観的更新）
      setOrders(prev => {
        const updatedOrders = prev.map(order =>
          order.id === orderId
            ? {
                ...order,
                items: newItems,
                totalAmount: newTotalAmount,
                status: 'change_pending', // 変更処理待ちに変更
                updatedAt: new Date()
              }
            : order
        );
        saveOrdersToStorage(updatedOrders);
        return updatedOrders;
      });
    } catch (err) {
      console.error('発注内容更新エラー:', err);
      // エラー時は再取得
      fetchOrders();
      throw err;
    }
  };

  // 顧客IDが変更されたら発注履歴を再取得
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    addOrder,
    updateOrderStatus,
    updateMultipleOrdersStatus,
    updateOrderItems
  };
};