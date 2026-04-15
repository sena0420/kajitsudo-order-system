import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Remove, ShoppingCart, SwipeRounded } from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { useOrders } from '../hooks/useOrders';
import { sendOrderNotification, sendUrgentNotification } from '../utils/notifications';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const OrderPage = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { deliveryLocations } = useAuth();
  const { products, loading, error, incrementOrderCount } = useProducts(user.customerId, user.deliveryLocationId);
  const { addOrder } = useOrders(user.customerId, user.deliveryLocationId);

  // 現在の納品先の納品不可日を取得
  const currentLocation = deliveryLocations.find(loc => loc.id === user.deliveryLocationId);
  const unavailableDates = currentLocation?.unavailableDates || [];
  const [cart, setCart] = useState({});
  const [weeklyCart, setWeeklyCart] = useState({}); // 週間発注用カート
  const [deliveryDates, setDeliveryDates] = useState({}); // 商品ごとの配送日設定
  const [orderConfirm, setOrderConfirm] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState(''); // M-4: alert() の代替

  // L-2: 成功メッセージを5秒後に自動消去
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0: 通常発注, 1: 週間発注

  // M-4: 週間数量一括設定ダイアログ
  const [qtyDialog, setQtyDialog] = useState({ open: false, mode: 'all', productId: null, weekDays: [], inputValue: '' });

  const updateQuantity = (productId, change) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const newQuantity = Math.max(0, current + change);
      if (newQuantity === 0) {
        const { [productId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: newQuantity };
    });
  };

  const setDirectQuantity = (productId, quantity) => {
    setCart(prev => {
      if (quantity === 0) {
        const { [productId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: quantity };
    });
  };

  // 週間発注用の数量更新
  const updateWeeklyQuantity = (productId, dayIndex, quantity) => {
    setWeeklyCart(prev => {
      const productWeekly = prev[productId] || {};
      const newProductWeekly = { ...productWeekly, [dayIndex]: quantity || 0 };
      
      // 全ての日が0の場合は削除
      const hasNonZero = Object.values(newProductWeekly).some(qty => qty > 0);
      if (!hasNonZero) {
        const { [productId]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [productId]: newProductWeekly };
    });
  };

  // 次週のその商品の開始曜日を取得
  const getNextWeekStart = (weeklyStartDay) => {
    const today = new Date();
    const todayDay = today.getDay();
    const daysUntilStart = ((weeklyStartDay - todayDay + 7) % 7) || 7; // 今日が開始曜日の場合は来週
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysUntilStart);
    return startDate;
  };

  // 7日分の日付配列を生成
  const generateWeekDays = (startDate) => {
    const days = [];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date: date,
        dayName: dayNames[date.getDay()],
        dateString: `${date.getMonth() + 1}/${date.getDate()}`,
        fullString: `${date.getMonth() + 1}/${date.getDate()}(${dayNames[date.getDay()]})`
      });
    }
    return days;
  };

  const getTotalAmount = () => {
    // 通常発注の金額
    const normalTotal = Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.unitPrice * quantity : 0);
    }, 0);

    // 週間発注の金額
    const weeklyTotal = Object.entries(weeklyCart).reduce((total, [productId, weeklyQuantities]) => {
      const product = products.find(p => p.id === productId);
      const productTotal = Object.values(weeklyQuantities).reduce((sum, quantity) => sum + quantity, 0);
      return total + (product ? product.unitPrice * productTotal : 0);
    }, 0);

    return normalTotal + weeklyTotal;
  };

  // 最短配送日を取得（ローカル日付ベースで計算し、タイムゾーンズレを防ぐ）
  const getMinDeliveryDate = (minDays) => {
    const date = new Date();
    date.setDate(date.getDate() + minDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 商品の配送日を取得（設定されていなければデフォルト）
  const getProductDeliveryDate = (productId, minDays) => {
    return deliveryDates[productId] || getMinDeliveryDate(minDays);
  };

  // 配送日を設定
  const setProductDeliveryDate = (productId, date) => {
    setDeliveryDates(prev => ({ ...prev, [productId]: date }));
  };

  // 日付が納品不可日かどうかをチェック
  const isUnavailableDate = (date) => {
    return unavailableDates.includes(date);
  };

  // 日付が最短リードタイムを満たし、かつ納品不可日でないかチェック
  const isDateValid = (date, minDays) => {
    const selectedDate = new Date(date);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + minDays);
    const meetsMinDelivery = selectedDate >= minDate;
    const notUnavailable = !isUnavailableDate(date);
    return meetsMinDelivery && notUnavailable;
  };

  const handleOrder = () => {
    setOrderConfirm(true);
  };

  // M-4: 週間数量一括設定ダイアログの適用
  const applyQtyDialog = () => {
    const { mode, productId, weekDays: wd, inputValue } = qtyDialog;
    const numQty = parseInt(inputValue, 10);
    if (!inputValue || !/^[0-9]+$/.test(inputValue) || numQty <= 0) return;
    for (let i = 0; i < 7; i++) {
      const dayDate = wd[i].date.toISOString().split('T')[0];
      const dayOfWeek = wd[i].date.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const product = products.find(p => p.id === productId);
      if (!product) continue;
      if (mode === 'all' && isDateValid(dayDate, product.minDeliveryDays)) {
        updateWeeklyQuantity(productId, i, numQty);
      } else if (mode === 'weekday' && isWeekday && isDateValid(dayDate, product.minDeliveryDays)) {
        updateWeeklyQuantity(productId, i, numQty);
      }
    }
    setQtyDialog(prev => ({ ...prev, open: false }));
  };

  const confirmOrder = async () => {
    try {
      setOrderLoading(true);

      // 通常発注と週間発注の両方のアイテムを統合
      const normalItems = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        const deliveryDate = getProductDeliveryDate(productId, product.minDeliveryDays);

        // 納品不可日のバリデーション
        if (isUnavailableDate(deliveryDate)) {
          throw new Error(`${product.name}の配送日が納品不可日です。別の日付を選択してください。`);
        }

        return {
          productId,
          workCode: product.workCode,
          productName: product.name,
          specification: product.specification,
          origin: product.origin,
          quantity,
          unitPrice: product.unitPrice,
          subtotal: product.unitPrice * quantity,
          orderType: 'normal',
          deliveryDate: deliveryDate
        };
      });

      const weeklyItems = Object.entries(weeklyCart).flatMap(([productId, weeklyQuantities]) => {
        const product = products.find(p => p.id === productId);
        const startDate = getNextWeekStart(product.weeklyStartDay);

        return Object.entries(weeklyQuantities)
          .filter(([dayIndex, quantity]) => quantity > 0)
          .map(([dayIndex, quantity]) => {
            const deliveryDate = new Date(startDate);
            deliveryDate.setDate(startDate.getDate() + parseInt(dayIndex));

            // ローカル日付のまま文字列化（UTC変換によるズレを防ぐ）
            const y = deliveryDate.getFullYear();
            const m = String(deliveryDate.getMonth() + 1).padStart(2, '0');
            const d = String(deliveryDate.getDate()).padStart(2, '0');
            const deliveryDateStr = `${y}-${m}-${d}`;

            // 週間発注の納品不可日バリデーション（C-5: 書き込み前に全バリデーション）
            if (isUnavailableDate(deliveryDateStr)) {
              throw new Error(`${product.name}（週間発注）の${y}/${m}/${d}は納品不可日です。別の日付を選択してください。`);
            }

            return {
              productId,
              workCode: product.workCode,
              productName: product.name,
              specification: product.specification,
              origin: product.origin,
              quantity,
              unitPrice: product.unitPrice,
              subtotal: product.unitPrice * quantity,
              orderType: 'weekly',
              deliveryDate: deliveryDateStr,
              dayIndex: parseInt(dayIndex)
            };
          });
      });

      const allItems = [...normalItems, ...weeklyItems];

      // 納期ごとに商品をグループ化
      const itemsByDeliveryDate = allItems.reduce((groups, item) => {
        const date = item.deliveryDate;
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(item);
        return groups;
      }, {});

      // Firebaseが利用可能かチェック
      const isFirebaseAvailable = auth !== null;

      // 納期ごとに別々の注文を作成
      const orderDate = new Date().toISOString().split('T')[0];

      for (const [deliveryDate, items] of Object.entries(itemsByDeliveryDate)) {
        const orderData = {
          customerId: user.customerId,
          customerName: user.customerName,
          deliveryLocationId: user.deliveryLocationId,
          deliveryLocationName: user.deliveryLocationName,
          salesStaffId: user.salesStaffId,
          orderDate: orderDate,
          deliveryDate: deliveryDate,
          totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
          items: items,
          notes: '',
          hasNormalItems: items.some(item => item.orderType === 'normal'),
          hasWeeklyItems: items.some(item => item.orderType === 'weekly')
        };

        if (isFirebaseAvailable) {
          // Firestoreに発注データを保存
          const ordersRef = collection(db, 'orders');
          await addDoc(ordersRef, {
            ...orderData,
            status: 'pending', // 処理待ち
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } else {
          // デモモード: localStorageに保存
          addOrder(orderData);
        }

        // 営業担当者へ通知送信（各注文ごと）
        try {
          await sendOrderNotification(orderData);

          // 緊急通知の送信（高額・大量発注）
          const isUrgent = await sendUrgentNotification(orderData);

          // isUrgent は将来的なログ集計用に保持
        } catch (notificationError) {
          console.error('通知送信エラー:', notificationError);
        }
      }

      // 商品の発注回数を更新（通常発注 + 週間発注）
      const updatedProducts = new Set([...Object.keys(cart), ...Object.keys(weeklyCart)]);
      updatedProducts.forEach(productId => {
        incrementOrderCount(productId);
      });

      const orderCount = Object.keys(itemsByDeliveryDate).length;
      setSuccess(`発注が完了しました！${orderCount}件の注文が作成され、営業担当者に通知されました。`);
      setCart({});
      setWeeklyCart({});
      setDeliveryDates({});
      setOrderConfirm(false);

    } catch (err) {
      console.error('発注エラー:', err);
      setSuccess('');
      setErrorMsg('発注に失敗しました。もう一度お試しください。');
    } finally {
      setOrderLoading(false);
    }
  };

  // カートアイテム数の計算（通常発注 + 週間発注）
  const cartItems = Object.keys(cart).length + Object.keys(weeklyCart).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          商品を読み込み中...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        商品発注
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* タブ切替 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(event, newValue) => setTabValue(newValue)}
          variant="fullWidth"
        >
          <Tab label="通常発注" />
          <Tab label="週間発注" />
        </Tabs>
      </Box>

      {/* 通常発注タブ */}
      {tabValue === 0 && (
        <Grid container spacing={2}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h2">
                    {product.name}
                  </Typography>
                  {product.orderCount >= 10 && (
                    <Chip label="よく発注" color="primary" size="small" />
                  )}
                </Box>
                
                <Typography color="textSecondary" gutterBottom>
                  作業コード: {product.workCode}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  規格: {product.specification}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  産地: {product.origin}
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  ¥{product.unitPrice.toLocaleString()}
                </Typography>

                {/* 配送日選択 */}
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    配送日選択（最短: {product.minDeliveryDays}日後）
                  </Typography>
                  <TextField
                    size="small"
                    type="date"
                    fullWidth
                    value={getProductDeliveryDate(product.id, product.minDeliveryDays)}
                    onChange={(e) => setProductDeliveryDate(product.id, e.target.value)}
                    inputProps={{
                      min: getMinDeliveryDate(product.minDeliveryDays)
                    }}
                    sx={{ mt: 0.5 }}
                  />
                  {/* 納品不可日の警告 */}
                  {isUnavailableDate(getProductDeliveryDate(product.id, product.minDeliveryDays)) && (
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                      ⚠️ この日付は納品不可日です。別の日付を選択してください。
                    </Typography>
                  )}
                  {/* 納品不可日のリスト表示 */}
                  {unavailableDates.length > 0 && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      納品不可日: {unavailableDates.slice(0, 3).map(d => {
                        const date = new Date(d + 'T00:00:00');
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }).join(', ')}
                      {unavailableDates.length > 3 && ` 他${unavailableDates.length - 3}件`}
                    </Typography>
                  )}
                </Box>

                <Box mt={2}>
                  {/* 直接入力フィールド */}
                  <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                    <TextField
                      size="small"
                      type="text"
                      value={cart[product.id] || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // 数字のみ許可（空文字、数字のみ）
                        if (inputValue === '' || /^[0-9]+$/.test(inputValue)) {
                          const numValue = inputValue === '' ? 0 : parseInt(inputValue);
                          if (numValue >= 0 && numValue <= 999) {
                            setDirectQuantity(product.id, numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // フィールドを離れた時に空の場合は0を表示
                        if (e.target.value === '' && !cart[product.id]) {
                          // 何もしない（0は表示しない）
                        }
                      }}
                      placeholder="0"
                      inputProps={{ 
                        style: { textAlign: 'center' },
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                      sx={{ 
                        width: '80px',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.23)',
                          },
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {product.specification.includes('箱') ? '箱' : '個'}
                    </Typography>
                  </Box>

                  {/* 段階的調整ボタン */}
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={!cart[product.id]}
                      sx={{ minWidth: '24px', height: '24px' }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ mx: 0.5 }}>1</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(product.id, 1)}
                      sx={{ minWidth: '24px', height: '24px' }}
                    >
                      <Add fontSize="small" />
                    </IconButton>

                    <Box sx={{ width: '8px' }} />

                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(product.id, -10)}
                      disabled={!cart[product.id] || cart[product.id] < 10}
                      color="primary"
                      sx={{ minWidth: '24px', height: '24px' }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ mx: 0.5 }}>10</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => updateQuantity(product.id, 10)}
                      color="primary"
                      sx={{ minWidth: '24px', height: '24px' }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* クイック選択ボタン */}
                  <Box display="flex" justifyContent="center" gap={0.5}>
                    {[10, 20, 50, 100].map((qty) => (
                      <Button
                        key={qty}
                        size="small"
                        variant="outlined"
                        onClick={() => setDirectQuantity(product.id, qty)}
                        sx={{ 
                          minWidth: '35px',
                          height: '28px',
                          fontSize: '0.7rem',
                          padding: '2px 4px'
                        }}
                      >
                        {qty}
                      </Button>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          ))}
        </Grid>
      )}

      {/* 週間発注タブ */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            週間発注（商品ごとに次週の配送日を自動設定）
          </Typography>
          
          {products.map((product) => {
            const startDate = getNextWeekStart(product.weeklyStartDay);
            const weekDays = generateWeekDays(startDate);
            const productWeekly = weeklyCart[product.id] || {};
            
            return (
              <Card key={product.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {product.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        作業コード: {product.workCode} | {product.specification} | {product.origin}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ¥{product.unitPrice.toLocaleString()} / {product.specification.includes('箱') ? '箱' : '個'}
                      </Typography>
                    </Box>
                    {product.orderCount >= 10 && (
                      <Chip label="よく発注" color="primary" size="small" />
                    )}
                  </Box>

                  {/* 週間カレンダー入力 */}
                  {isMobile && (
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      <SwipeRounded sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                      <Typography variant="caption" color="textSecondary">
                        左右にスクロールして日付を確認できます
                      </Typography>
                    </Box>
                  )}
                  <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {weekDays.map((day, index) => (
                            <TableCell key={index} align="center" sx={{ minWidth: '80px' }}>
                              <Box>
                                <Typography variant="caption" display="block">
                                  {day.dayName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {day.dateString}
                                </Typography>
                              </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {weekDays.map((day, index) => {
                            const isLocked = !isDateValid(day.date.toISOString().split('T')[0], product.minDeliveryDays);
                            
                            return (
                              <TableCell key={index} align="center" sx={{ p: 1 }}>
                                <TextField
                                  size="small"
                                  type="text"
                                  value={productWeekly[index] || ''}
                                  onChange={(e) => {
                                    if (isLocked) return; // ロックされている場合は入力を無視
                                    
                                    const inputValue = e.target.value;
                                    if (inputValue === '' || /^[0-9]+$/.test(inputValue)) {
                                      const numValue = inputValue === '' ? 0 : parseInt(inputValue);
                                      if (numValue >= 0 && numValue <= 999) {
                                        updateWeeklyQuantity(product.id, index, numValue);
                                      }
                                    }
                                  }}
                                  placeholder={isLocked ? "×" : "0"}
                                  disabled={isLocked}
                                  inputProps={{ 
                                    style: { textAlign: 'center' },
                                    inputMode: 'numeric',
                                    pattern: '[0-9]*'
                                  }}
                                  sx={{ 
                                    width: '60px',
                                    '& .MuiOutlinedInput-root': {
                                      '& fieldset': {
                                        borderColor: isLocked ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.23)',
                                      },
                                      backgroundColor: isLocked ? '#f5f5f5' : 'transparent',
                                    },
                                    '& .MuiInputBase-input.Mui-disabled': {
                                      WebkitTextFillColor: '#999',
                                    },
                                  }}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* 便利機能ボタン */}
                  <Box display="flex" justifyContent="center" gap={1} mt={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setQtyDialog({ open: true, mode: 'all', productId: product.id, weekDays, inputValue: '' })}
                    >
                      全日同じ
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setQtyDialog({ open: true, mode: 'weekday', productId: product.id, weekDays, inputValue: '' })}
                    >
                      平日のみ
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => {
                        // クリア
                        for (let i = 0; i < 7; i++) {
                          updateWeeklyQuantity(product.id, i, 0);
                        }
                      }}
                    >
                      クリア
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {cartItems > 0 && (
        <Box
          position="fixed"
          bottom={{ xs: 16, sm: 16 }}
          left={{ xs: 16, sm: 'auto' }}
          right={{ xs: 16, sm: 16 }}
          zIndex={1000}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<ShoppingCart />}
            onClick={handleOrder}
            sx={{ 
              borderRadius: 28, 
              px: 3,
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            発注 ({cartItems}件) ¥{getTotalAmount().toLocaleString()}
          </Button>
        </Box>
      )}

      <Dialog
        open={orderConfirm}
        onClose={() => setOrderConfirm(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>発注確認</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>以下の内容で発注しますか？</Typography>

          {/* 通常発注 */}
          {Object.keys(cart).length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                通常発注
              </Typography>
              {Object.entries(cart).map(([productId, quantity]) => {
                const product = products.find(p => p.id === productId);
                return (
                  <Box key={productId} py={1} borderBottom={1} borderColor="divider">
                    <Typography variant="body2" fontWeight="bold">{product.name} ({product.specification})</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {quantity}個 × ¥{product.unitPrice.toLocaleString()} = ¥{(quantity * product.unitPrice).toLocaleString()}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* H-2: 週次発注を確認ダイアログに表示 */}
          {Object.keys(weeklyCart).length > 0 && (
            <Box mb={1}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                週間発注
              </Typography>
              {Object.entries(weeklyCart).map(([productId, weeklyQuantities]) => {
                const product = products.find(p => p.id === productId);
                const startDate = getNextWeekStart(product.weeklyStartDay);
                const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                return Object.entries(weeklyQuantities)
                  .filter(([, qty]) => qty > 0)
                  .map(([dayIndex, qty]) => {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + parseInt(dayIndex));
                    const label = `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`;
                    return (
                      <Box key={`${productId}-${dayIndex}`} py={1} borderBottom={1} borderColor="divider">
                        <Typography variant="body2" fontWeight="bold">
                          {product.name} ({product.specification}) — {label}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {qty}個 × ¥{product.unitPrice.toLocaleString()} = ¥{(qty * product.unitPrice).toLocaleString()}
                        </Typography>
                      </Box>
                    );
                  });
              })}
            </Box>
          )}

          <Box pt={2}>
            <Typography variant="h6">
              合計: ¥{getTotalAmount().toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOrderConfirm(false)}
            disabled={orderLoading}
            fullWidth={isMobile}
            variant="outlined"
          >
            キャンセル
          </Button>
          <Button
            onClick={confirmOrder}
            variant="contained"
            disabled={orderLoading}
            fullWidth={isMobile}
            startIcon={orderLoading && <CircularProgress size={16} />}
          >
            {orderLoading ? '発注中...' : '発注確定'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* M-4: 週間数量一括設定ダイアログ（prompt() の代替） */}
      <Dialog
        open={qtyDialog.open}
        onClose={() => setQtyDialog(prev => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {qtyDialog.mode === 'all' ? '全日の数量を設定' : '平日（月〜金）の数量を設定'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="数量"
            type="number"
            inputProps={{ min: 1 }}
            value={qtyDialog.inputValue}
            onChange={e => setQtyDialog(prev => ({ ...prev, inputValue: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyQtyDialog()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setQtyDialog(prev => ({ ...prev, open: false }))} variant="outlined">
            キャンセル
          </Button>
          <Button
            onClick={applyQtyDialog}
            variant="contained"
            disabled={!qtyDialog.inputValue || parseInt(qtyDialog.inputValue, 10) <= 0}
          >
            適用
          </Button>
        </DialogActions>
      </Dialog>

      {/* M-4: エラー通知（alert() の代替） */}
      <Snackbar
        open={!!errorMsg}
        autoHideDuration={6000}
        onClose={() => setErrorMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ width: '100%' }}>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderPage;