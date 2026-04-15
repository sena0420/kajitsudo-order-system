import React, { useState } from 'react';
import {
  Typography,
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
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  Store,
  CheckCircle,
  HourglassEmpty,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../contexts/AuthContext';

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'change_pending': return 'warning';
    case 'pending': return 'info';
    default: return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'confirmed': return '確認済';
    case 'change_pending': return '変更処理待ち';
    case 'pending': return '処理待ち';
    default: return '不明';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'confirmed': return <CheckCircle fontSize="small" />;
    case 'change_pending': return <EditIcon fontSize="small" />;
    case 'pending': return <HourglassEmpty fontSize="small" />;
    default: return null;
  }
};

const getOrderDeliveryDate = (order) => {
  if (order.deliveryDate) return order.deliveryDate;
  if (order.items && order.items.length > 0) {
    return order.items.reduce((earliest, item) => {
      if (!item.deliveryDate) return earliest;
      return !earliest || item.deliveryDate < earliest ? item.deliveryDate : earliest;
    }, null) || new Date().toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

// 1件の発注をアコーディオン表示
const OrderRow = ({ order, updateOrderItems }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [editingItems, setEditingItems] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const isEditing = editingItems !== null;
  const displayItems = isEditing ? editingItems : order.items;

  const handleEditClick = () => {
    setEditingItems(order.items.map(item => ({ ...item })));
  };

  const handleQuantityChange = (index, delta) => {
    setEditingItems(prev => {
      const newItems = [...prev];
      const newQuantity = Math.max(0, newItems[index].quantity + delta);
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
      const newTotal = editingItems.reduce((sum, item) => sum + item.subtotal, 0);
      await updateOrderItems(order.id, editingItems, newTotal);
      setEditingItems(null);
      setConfirmDialog(false);
    } catch {
      alert('発注内容の更新に失敗しました。');
    }
  };

  return (
    <Accordion sx={{ mb: 0.5 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" width="100%" gap={1}>
          {getStatusIcon(order.status)}
          <Chip
            label={getStatusText(order.status)}
            color={getStatusColor(order.status)}
            size="small"
          />
          <Box flexGrow={1}>
            <Typography variant="body2">
              発注日: {order.createdAt
                ? order.createdAt.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : new Date(order.orderDate).toLocaleDateString('ja-JP')
              }
            </Typography>
            <Typography variant="caption" color="textSecondary">
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
          {order.deliveryLocationName && (
            <Typography variant="caption" color="textSecondary" display="block" mb={1}>
              納品先: {order.deliveryLocationName}
            </Typography>
          )}
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
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
                          <IconButton size="small" onClick={() => handleQuantityChange(index, -1)} disabled={item.quantity <= 0}>
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography sx={{ mx: 1, minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => handleQuantityChange(index, 1)}>
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : item.quantity}
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

          {order.status !== 'confirmed' && (
            <Box mt={1} display="flex" justifyContent="flex-end" gap={1}>
              {isEditing ? (
                <>
                  <Button variant="outlined" size="small" onClick={() => { setEditingItems(null); setConfirmDialog(false); }}>
                    キャンセル
                  </Button>
                  <Button variant="contained" size="small" color="primary" onClick={() => setConfirmDialog(true)}>
                    変更を保存
                  </Button>
                </>
              ) : (
                <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={handleEditClick}>
                  数量変更
                </Button>
              )}
            </Box>
          )}
        </Box>
      </AccordionDetails>

      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>数量変更の確認</DialogTitle>
        <DialogContent>
          <Typography>発注内容を変更してもよろしいですか？</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            変更後、ステータスは「変更処理待ち」になります。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDialog(false)} fullWidth={isMobile} variant="outlined">キャンセル</Button>
          <Button onClick={handleSaveChanges} variant="contained" color="primary" fullWidth={isMobile}>確定</Button>
        </DialogActions>
      </Dialog>
    </Accordion>
  );
};

// 顧客ごとの発注履歴セクション
const CustomerOrderSection = ({ customer }) => {
  const { orders, loading, error, updateOrderItems } = useOrders(customer.id);

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'change_pending').length;

  return (
    <Accordion defaultExpanded sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Store color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {customer.name}
          </Typography>
          {!loading && (
            <>
              <Chip label={`${orders.length}件`} size="small" color="primary" variant="outlined" />
              {pendingCount > 0 && (
                <Chip label={`未処理 ${pendingCount}件`} size="small" color="warning" />
              )}
            </>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {loading && (
          <Box display="flex" alignItems="center" gap={1} py={2}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="textSecondary">読み込み中...</Typography>
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && orders.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
            発注履歴がありません
          </Typography>
        )}
        {!loading && orders.length > 0 && orders.map((order) => (
          <OrderRow key={order.id} order={order} updateOrderItems={updateOrderItems} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

const AdminOrderHistory = () => {
  const { allCustomers } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        発注履歴（全顧客）
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {allCustomers.length === 0 ? (
        <Typography color="textSecondary" align="center">顧客データがありません</Typography>
      ) : (
        allCustomers.map((customer) => (
          <CustomerOrderSection key={customer.id} customer={customer} />
        ))
      )}
    </Box>
  );
};

export default AdminOrderHistory;
