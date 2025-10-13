import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';

// Firebase が利用可能かチェック
const isFirebaseAvailable = auth !== null;

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryLocations, setDeliveryLocations] = useState([]);

  useEffect(() => {
    if (isFirebaseAvailable) {
      // Firebase認証を使用
      const { onAuthStateChanged } = require('firebase/auth');
      const { collection, query, where, getDocs } = require('firebase/firestore');
      const { db } = require('../firebase/config');

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // IDトークンから Custom Claims を取得
            const idTokenResult = await firebaseUser.getIdTokenResult();
            // 一時的に特定のメールアドレスを管理者として扱う
            const adminEmails = [
              'admin@example.com',
              'sakura@example.com'  // テスト用に追加（実際の運用時は削除）
            ];
            const isAdmin = idTokenResult.claims.admin === true || adminEmails.includes(firebaseUser.email);

            // Firestoreから顧客情報を取得（emailで検索）
            const customersRef = collection(db, 'customers');
            const q = query(customersRef, where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              // 顧客情報が見つかった場合
              const customerDoc = querySnapshot.docs[0];
              const customerData = customerDoc.data();

              // 納品先一覧を取得
              const locationsRef = collection(db, 'deliveryLocations');
              const locationsQuery = query(
                locationsRef,
                where('customerId', '==', customerDoc.id),
                where('isActive', '==', true)
              );
              const locationsSnapshot = await getDocs(locationsQuery);
              const locationsData = locationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setDeliveryLocations(locationsData);

              // 納品先が1件のみの場合は自動的に選択
              let autoSelectedLocationId = null;
              let autoSelectedLocationName = null;
              if (locationsData.length === 1) {
                autoSelectedLocationId = locationsData[0].id;
                autoSelectedLocationName = locationsData[0].name;
                console.log('🎯 納品先が1件のため自動選択:', autoSelectedLocationName);
              }

              setUser({
                uid: firebaseUser.uid,
                customerId: customerDoc.id,
                customerName: customerData.name,
                email: firebaseUser.email,
                salesStaffId: customerData.salesStaffId,
                isAdmin: isAdmin,
                deliveryLocationId: autoSelectedLocationId, // 1件の場合は自動選択
                deliveryLocationName: autoSelectedLocationName
              });
            } else if (isAdmin) {
              // 管理者の場合は顧客情報がなくてもOK
              setUser({
                uid: firebaseUser.uid,
                customerId: null,
                customerName: '管理者',
                email: firebaseUser.email,
                salesStaffId: null,
                isAdmin: true
              });
            } else {
              // 顧客情報が見つからない場合はエラー
              console.error('顧客情報が見つかりません:', firebaseUser.email);
              setError('顧客情報が見つかりません。管理者にお問い合わせください。');
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('認証状態の確認エラー:', err);
          setError('認証状態の確認に失敗しました');
          setUser(null);
        } finally {
          setLoading(false);
        }
      });

      return unsubscribe;
    } else {
      // デモモード - Firebase なし
      console.log('🔧 デモモード: Firebase認証を使用せずモックデータで動作');
      // デモ用の納品先データ
      setDeliveryLocations([
        {
          id: 'LOC0001',
          name: '本店',
          customerId: 'CUST001',
          isActive: true,
          unavailableDates: ['2025-10-15', '2025-10-20', '2025-10-25'] // デモ用納品不可日
        },
        {
          id: 'LOC0002',
          name: '第2倉庫',
          customerId: 'CUST001',
          isActive: true,
          unavailableDates: ['2025-10-18', '2025-10-22'] // デモ用納品不可日
        }
      ]);
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);

      if (isFirebaseAvailable) {
        // Firebase認証を使用
        const { signInWithEmailAndPassword } = require('firebase/auth');
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChangedでユーザー情報が設定される
      } else {
        // デモモード - Firebase なし
        if (email && password) {
          // 管理者権限の判定（デモモード）
          const isAdmin = email === 'admin@example.com';
          const customerId = email.split('@')[0].toUpperCase();

          // デモ用の納品先データ
          let autoSelectedLocationId = null;
          let autoSelectedLocationName = null;
          if (!isAdmin) {
            const demoLocations = [
              {
                id: 'LOC0001',
                name: '本店',
                customerId: customerId,
                isActive: true,
                unavailableDates: ['2025-10-15', '2025-10-20', '2025-10-25']
              },
              {
                id: 'LOC0002',
                name: '第2倉庫',
                customerId: customerId,
                isActive: true,
                unavailableDates: ['2025-10-18', '2025-10-22']
              }
            ];
            setDeliveryLocations(demoLocations);

            // 納品先が1件のみの場合は自動的に選択
            if (demoLocations.length === 1) {
              autoSelectedLocationId = demoLocations[0].id;
              autoSelectedLocationName = demoLocations[0].name;
              console.log('🎯 デモモード: 納品先が1件のため自動選択:', autoSelectedLocationName);
            }
          }

          const userData = {
            uid: 'mock-uid',
            customerId: isAdmin ? null : customerId,
            customerName: isAdmin ? '管理者' : (customerId === 'CUST001' ? '〇〇スーパー' : customerId + 'ストア'),
            email: email,
            salesStaffId: isAdmin ? null : 'STAFF001',
            isAdmin: isAdmin,
            deliveryLocationId: autoSelectedLocationId,
            deliveryLocationName: autoSelectedLocationName
          };
          setUser(userData);
          return userData;
        } else {
          throw new Error('メールアドレスとパスワードを入力してください');
        }
      }
    } catch (err) {
      setError(err.message || 'ログインに失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError('');
      if (isFirebaseAvailable && auth) {
        const { signOut } = require('firebase/auth');
        await signOut(auth);
      }
      setUser(null);
    } catch (err) {
      setError('ログアウトに失敗しました');
      throw err;
    }
  };

  const setDeliveryLocation = (locationId, locationName) => {
    if (user) {
      setUser({
        ...user,
        deliveryLocationId: locationId,
        deliveryLocationName: locationName
      });
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    setError,
    deliveryLocations,
    setDeliveryLocation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};