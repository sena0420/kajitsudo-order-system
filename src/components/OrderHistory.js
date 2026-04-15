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
  Button,
  IconButton,
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

const OrderHistory = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { orders, loading, error, updateOrderItems } = useOrders(user.customerId, user.deliveryLocationId);
  const { products } = useProducts(user.customerId, user.deliveryLocationId);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(false);

  // 発注の配送日を取得（deliveryDateがない場合はitemsから最も早い日付を取得）
  const getOrderDeliveryDate = (order) => {
    if (order.deliveryDate) {
      return order.deliveryDate;
    }
    if (order.items && order.items.length > 0) {
      return order.items.reduce((earliest, item) => {
        if (!item.deliveryDate) return earliest;
        return !earliest || item.deliveryDate < earliest ? item.deliveryDate : earliest;
      }, null) || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'change_pending':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return '確認済';
      case 'change_pending':
        return '変更処理待ち';
      case 'pending':
        return '処理待ち';
      default:
        return '不明';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle />;
      case 'change_pending':
        return <EditIcon />;
      case 'pending':
        return <HourglassEmpty />;
      default:
        return null;
    }
  };

  // リードタイムチェック：納期までの日数がリードタイム以上あるか
  const canEditOrder = (order) => {
    if (order.status === 'confirmed') {
      return false; // 確認済みは変更不可
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDate = new Date(getOrderDeliveryDate(order));
    deliveryDate.setHours(0, 0, 0, 0);

    // 納期までの日数を計算
    const daysUntilDelivery = Math.floor((deliveryDate - today) / (1000 * 60 * 60 * 24));

    // 各商品のリードタイム（最短納期日数）を確認
    const maxLeadTime = Math.max(...order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return product ? product.minDeliveryDays : 0;
    }), 0);

    return daysUntilDelivery >= maxLeadTime;
  };

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setEditedItems(order.items.map(item => ({ ...item })));
  };

  const handleQuantityChange = (index, delta) => {
    setEditedItems(prev => {
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
      const newTotalAmount = editedItems.reduce((sum, item) => sum + item.subtotal, 0);
      await updateOrderItems(editingOrder.id, editedItems, newTotalAmount);
      setEditingOrder(null);
      setEditedItems([]);
      setConfirmDialog(false);
    } catch (error) {
      alert('発注内容の更新に失敗しました。もう一度お試しください。');
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditedItems([]);
    setConfirmDialog(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          発注履歴を読み込み中...
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
        発注履歴
      </Typography>

      {orders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary" align="center">
              発注履歴がありません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => {
          const canEdit = canEditOrder(order);
          const isEditing = editingOrder?.id === order.id;
          const displayItems = isEditing ? editedItems : order.items;

          return (
            <Accordion key={order.id} sx={{ mb: 1 }}>
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
                      発注日: {order.createdAt ?
                        order.createdAt.toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) :
                        new Date(order.orderDate).toLocaleDateString('ja-JP')
                      }
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      納期: {new Date(getOrderDeliveryDate(order)).toLocaleDateString('ja-JP')} |
                      合計: ¥{(isEditing
                        ? editedItems.reduce((sum, item) => sum + item.subtotal, 0)
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
                                    disabled={item.quantity <= 0}
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
                            <TableCell align="right">
                              ¥{item.subtotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={6} sx={{ fontWeight: 'bold' }}>
                            合計
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ¥{(isEditing
                              ? editedItems.reduce((sum, item) => sum + item.subtotal, 0)
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
                        <Button
                          variant="outlined"
                          onClick={handleCancelEdit}
                        >
                          キャンセル
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setConfirmDialog(true)}
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
                          onClick={() => handleEditClick(order)}
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
            </Accordion>
          );
        })
      )}

      {/* 変更確認ダイアログ */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>数量変更の確認</DialogTitle>
        <DialogContent>
          <Typography>
            発注内容を変更してもよろしいですか？
          </Typography>
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
    </Box>
  );
};

export default OrderHistory;
