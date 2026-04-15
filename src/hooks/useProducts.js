import { useState, useEffect } from 'react';
import { productService } from '../firebase/services';

export const useProducts = (customerId, deliveryLocationId = null) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 商品データの取得
  const fetchProducts = async () => {
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
        console.log('🔍 商品取得開始:', { customerId, deliveryLocationId });

        // Firestoreから商品データを取得
        const { collection, query, where, getDocs, orderBy } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        const productsRef = collection(db, 'products');

        // 納品先でフィルタリング（指定されている場合）
        const queryConstraints = [
          where('customerId', '==', customerId),
          where('isActive', '==', true)
        ];

        if (deliveryLocationId) {
          queryConstraints.push(where('deliveryLocationId', '==', deliveryLocationId));
        }

        queryConstraints.push(orderBy('orderCount', 'desc'));

        const q = query(productsRef, ...queryConstraints);

        console.log('🔍 Firestoreクエリ実行中...');
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('✅ 商品データ取得成功:', productsData.length + '件');
        setProducts(productsData);
      } else {
        // デモモード：仮データを使用
        const sampleProducts = [
        {
          id: 'P001',
          customerId: customerId,
          deliveryLocationId: 'LOC0001',
          workCode: 'A123',
          name: 'りんご',
          specification: '5kg箱',
          origin: '青森県',
          unitPrice: 2500,
          orderCount: 15,
          minDeliveryDays: 2,
          isActive: true,
          weeklyStartDay: 1 // 月曜日開始 (0=日曜, 1=月曜, 2=火曜...)
        },
        {
          id: 'P002',
          customerId: customerId,
          deliveryLocationId: 'LOC0001',
          workCode: 'B456',
          name: 'みかん',
          specification: '10kg箱',
          origin: '愛媛県',
          unitPrice: 3200,
          orderCount: 8,
          minDeliveryDays: 3,
          isActive: true,
          weeklyStartDay: 2 // 火曜日開始
        },
        {
          id: 'P003',
          customerId: customerId,
          deliveryLocationId: 'LOC0002',
          workCode: 'C789',
          name: 'バナナ',
          specification: '13kg箱',
          origin: 'フィリピン',
          unitPrice: 1800,
          orderCount: 12,
          minDeliveryDays: 1,
          isActive: true,
          weeklyStartDay: 3 // 水曜日開始
        },
        {
          id: 'P004',
          customerId: customerId,
          deliveryLocationId: 'LOC0001',
          workCode: 'D012',
          name: 'キャベツ',
          specification: '1玉',
          origin: '群馬県',
          unitPrice: 150,
          orderCount: 5,
          minDeliveryDays: 1,
          isActive: true,
          weeklyStartDay: 1 // 月曜日開始
        },
        {
          id: 'P005',
          customerId: customerId,
          deliveryLocationId: 'LOC0002',
          workCode: 'E345',
          name: 'トマト',
          specification: '4kg箱',
          origin: '熊本県',
          unitPrice: 1200,
          orderCount: 18,
          minDeliveryDays: 2,
          isActive: true,
          weeklyStartDay: 0 // 日曜日開始
        }
        ];

        // 発注回数の多い順にソート
        let filteredProducts = sampleProducts.filter(product => product.isActive);

        // 納品先でフィルタリング（指定されている場合）
        if (deliveryLocationId) {
          filteredProducts = filteredProducts.filter(
            product => product.deliveryLocationId === deliveryLocationId
          );
        }

        const sortedProducts = filteredProducts.sort((a, b) => b.orderCount - a.orderCount);

        setProducts(sortedProducts);
      }
    } catch (err) {
      console.error('商品取得エラー:', err);
      setError('商品の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 商品の発注回数を更新
  const incrementOrderCount = async (productId) => {
    try {
      // Firebaseが利用可能かチェック
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        // Firestoreの商品の発注回数を更新
        const { doc, updateDoc, increment } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        const productRef = doc(db, 'products', productId);
        await updateDoc(productRef, {
          orderCount: increment(1)
        });
      }

      // UIの即座な更新（楽観的更新）
      setProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, orderCount: product.orderCount + 1 }
            : product
        ).sort((a, b) => b.orderCount - a.orderCount)
      );
    } catch (err) {
      console.error('発注回数更新エラー:', err);
      // エラー時は再取得
      fetchProducts();
    }
  };

  // 顧客IDまたは納品先IDが変更されたら商品を再取得
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProducts();
  }, [customerId, deliveryLocationId]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    incrementOrderCount
  };
};