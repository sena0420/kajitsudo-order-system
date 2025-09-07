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

  useEffect(() => {
    if (isFirebaseAvailable) {
      // Firebase認証を使用
      const { onAuthStateChanged } = require('firebase/auth');
      
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Firestoreから顧客情報を取得
            const customerId = firebaseUser.displayName || 'CUST001';
            setUser({
              uid: firebaseUser.uid,
              customerId: customerId,
              customerName: '〇〇スーパー',
              email: firebaseUser.email,
              salesStaffId: 'STAFF001'
            });
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
      setLoading(false);
    }
  }, []);

  const login = async (customerId, password) => {
    try {
      setError('');
      setLoading(true);
      
      // 本来はauthService.loginCustomerを使用
      // 現在は仮実装
      if (customerId && password) {
        const userData = {
          uid: 'mock-uid',
          customerId,
          customerName: customerId === 'CUST001' ? '〇〇スーパー' : customerId + 'ストア',
          email: `${customerId}@example.com`,
          salesStaffId: 'STAFF001'
        };
        setUser(userData);
        return userData;
      } else {
        throw new Error('顧客IDとパスワードを入力してください');
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

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};