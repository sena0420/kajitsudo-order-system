import { useState, useEffect } from 'react';
import { productService } from '../firebase/services';

export const useProducts = (customerId) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 商品データの取得
  const fetchProducts = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError('');
      
      // 実際のFirestore実装では以下を使用
      // const productsData = await productService.getCustomerProducts(customerId);
      
      // 現在は仮データを使用
      const sampleProducts = [
        {
          id: 'P001',
          customerId: customerId,
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
      const sortedProducts = sampleProducts
        .filter(product => product.isActive)
        .sort((a, b) => b.orderCount - a.orderCount);
      
      setProducts(sortedProducts);
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
      // 実際のFirestore実装では以下を使用
      // await productService.incrementOrderCount(productId);
      
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

  // 顧客IDが変更されたら商品を再取得
  useEffect(() => {
    fetchProducts();
  }, [customerId]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    incrementOrderCount
  };
};