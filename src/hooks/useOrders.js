import { useState, useEffect } from 'react';
import { orderService } from '../firebase/services';

export const useOrders = (customerId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 発注履歴の取得
  const fetchOrders = async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError('');
      
      // 実際のFirestore実装では以下を使用
      // const ordersData = await orderService.getCustomerOrders(customerId);
      
      // 現在は仮データを使用
      const sampleOrders = [
        {
          id: 'ORD001',
          customerId: customerId,
          customerName: '〇〇スーパー',
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-15',
          deliveryDate: '2024-01-22',
          status: 'delivered',
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
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-10',
          deliveryDate: '2024-01-17',
          status: 'shipped',
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
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-08',
          deliveryDate: '2024-01-15',
          status: 'processing',
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
          salesStaffId: 'STAFF001',
          orderDate: '2024-01-05',
          deliveryDate: '2024-01-12',
          status: 'delivered',
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
        }
      ];

      // 発注日の新しい順にソート
      const sortedOrders = sampleOrders.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setOrders(sortedOrders);
    } catch (err) {
      console.error('発注履歴取得エラー:', err);
      setError('発注履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 新規発注を履歴に追加（楽観的更新用）
  const addOrder = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  // 顧客IDが変更されたら発注履歴を再取得
  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    addOrder
  };
};