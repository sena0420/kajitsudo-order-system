import React, { useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  CheckCircle,
  HourglassEmpty,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';
import { getStatusColor, getStatusText, getStatusIcon, getOrderDeliveryDate } from '../utils/orderHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// H-1: 編集状態を OrderRow サブコンポーネントに移動
//      → 複数注文の同時編集で状態が混在するバグを解消
// ─────────────────────────────────────────────────────────────────────────────
const OrderRow = ({ order, canEdit, updateOrderItems }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 状態を各 OrderRow が独立して持つ
  const [editingItems, setEditingItems] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isEditing = editingItems !== null;
  const displayItems = isEditing ? editingItems : order.items;

  const handleEditClick = () => {
    setEditingItems(order.items.map(item => ({ ...item })));
  };

  // H-4: 数量が 0 になったアイテムを自動削除
  const handleQuantityChange = (index, delta) => {
    setEditingItems(prev => {
      const newItems = [...prev];
      const newQuantity = Math.max(0, newItems[index].quantity + delta);
      if (newQuantity === 0) {
        return newItems.filter((_, i) => i !== index);
      }
      newItems[index] = {
        ...newItems[index],
        quantity: newQuantity,
        subtotal: newQuantity * newItems[index].unitPrice
      };
      return newItems;
    });
  };

  const handleSaveChanges = async () => {
    try {
      const newTotalAmount = editingItems.reduce((sum, item) => sum + item.subtotal, 0);
      await updateOrderItems(order.id, editingItems, newTotalAmount);
      setEditingItems(null);
      setConfirmDialog(false);
    } catch (error) {
      setErrorMsg('発注内容の更新に失敗しました。もう一度お試しください。');
    }
  };

  const handleCancelEdit = () => {
    setEditingItems(null);
    setConfirmDialog(false);
  };

  return (
    <Accordion sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" width="100%">
          <Box display="flex" alignItems="center" mr={2}>
            {getStatusIcon(order.status)}
            <Chip
              label={getStatusText(order.status)}
              color={getStatusColor(order.status)}
              size="small"
              sx={{ ml: 1 }}
            />
          </Box>
          <Box flexGrow={1}>
            <Typography variant="subtitle1">
              発注日: {order.createdAt
                ? order.createdAt.toLocaleDateString('ja-JP', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  })
                : new Date(order.orderDate).toLocaleDateString('ja-JP')
              }
            </Typography>
            <Typography variant="body2" color="textSecondary">
              納期: {new Date(getOrderDeliveryDate(order)).toLocaleDateString('ja-JP')} |
              合計: ¥{(isEditing
                ? editingItems.reduce((sum, item) => sum + item.subtotal, 0)
                : order.totalAmount
              ).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Box width="100%">
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow>
                  <TableCell>作業コード</TableCell>
                  <TableCell>商品名</TableCell>
                  <TableCell>規格</TableCell>
                  <TableCell>産地</TableCell>
                  <TableCell align="right">数量</TableCell>
                  <TableCell align="right">単価</TableCell>
                  <TableCell align="right">小計</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.workCode}</TableCell>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.specification}</TableCell>
                    <TableCell>{item.origin}</TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(index, -1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1, minWidth: 30, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleQuantityChange(index, 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell align="right">¥{item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell align="right">¥{item.subtotal.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={6} sx={{ fontWeight: 'bold' }}>合計</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ¥{(isEditing
                      ? editingItems.reduce((sum, item) => sum + item.subtotal, 0)
                      : order.totalAmount
                    ).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
            {isEditing ? (
              <>
                <Button variant="outlined" onClick={handleCancelEdit}>
                  キャンセル
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setConfirmDialog(true)}
                  disabled={editingItems.length === 0}
                >
                  変更を保存
                </Button>
              </>
            ) : (
              canEdit && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleEditClick}
                >
                  数量変更
                </Button>
              )
            )}
            {!canEdit && order.status !== 'confirmed' && (
              <Alert severity="warning" sx={{ flex: 1 }}>
                納期が近いため、数量変更できません
              </Alert>
            )}
            {order.status === 'confirmed' && (
              <Alert severity="info" sx={{ flex: 1 }}>
                この発注は確認済みです
              </Alert>
            )}
          </Box>
        </Box>
      </AccordionDetails>

      {/* 変更確認ダイアログ */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>数量変更の確認</DialogTitle>
        <DialogContent>
          <Typography>発注内容を変更してもよろしいですか？</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            変更後、ステータスは「変更処理待ち」になります。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialog(false)} fullWidth={isMobile} variant="outlined">
            キャンセル
          </Button>
          <Button onClick={handleSaveChanges} variant="contained" color="primary" fullWidth={isMobile}>
            確定
          </Button>
        </DialogActions>
      </Dialog>

      {/* M-4: エラー通知（alert() の代替） */}
      <Snackbar open={!!errorMsg} autoHideDuration={6000} onClose={() => setErrorMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setErrorMsg('')} sx={{ width: '100%' }}>{errorMsg}</Alert>
      </Snackbar>
    </Accordion>
  );
};

const ORDERS_PER_PAGE = 10;

// ─────────────────────────────────────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────────────────────────────────────
const OrderHistory = ({ user }) => {
  const { orders, loading, error, updateOrderItems } = useOrders(user.customerId, user.deliveryLocationId);
  // H-3: products は非同期ロード。空の場合は canEditOrder が false を返す
  const { products } = useProducts(user.customerId, user.deliveryLocationId);
  // M-5: ページネーション
  const [page, setPage] = useState(1);

  // リードタイムチェック：納期までの日数がリードタイム以上あるか
  const canEditOrder = (order) => {
    if (order.status === 'confirmed') return false;
    // H-3: products がロード完了するまで編集不可
    if (!products || products.length === 0) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(getOrderDeliveryDate(order));
    deliveryDate.setHours(0, 0, 0, 0);
    const daysUntilDelivery = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));

    const maxLeadTime = Math.max(...order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return product ? product.minDeliveryDays : 0;
    }), 0);

    return daysUntilDelivery >= maxLeadTime;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>発注履歴を読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // M-5: ページネーション計算
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const pagedOrders = orders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>発注履歴</Typography>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary" align="center">発注履歴がありません</Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            全 {orders.length} 件（{page} / {totalPages} ページ）
          </Typography>
          {pagedOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              canEdit={canEditOrder(order)}
              updateOrderItems={updateOrderItems}
            />
          ))}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => { setPage(value); window.scrollTo(0, 0); }}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default OrderHistory;
