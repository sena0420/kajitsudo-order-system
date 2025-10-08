import React from 'react';
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
  Alert
} from '@mui/material';
import { ExpandMore, CheckCircle, Schedule, LocalShipping, Receipt } from '@mui/icons-material';
import { useOrders } from '../hooks/useOrders';

const OrderHistory = ({ user }) => {
  const { orders, loading, error } = useOrders(user.customerId);

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'ordered':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return '配送完了';
      case 'shipped':
        return '配送中';
      case 'processing':
        return '処理中';
      case 'ordered':
        return '発注済み';
      default:
        return '不明';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle />;
      case 'shipped':
        return <LocalShipping />;
      case 'processing':
        return <Schedule />;
      case 'ordered':
        return <Receipt />;
      default:
        return null;
    }
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
        orders.map((order) => (
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
                    納期: {new Date(order.deliveryDate).toLocaleDateString('ja-JP')} | 
                    合計: ¥{order.totalAmount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper}>
                <Table size="small">
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
                    {order.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.workCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.specification}</TableCell>
                        <TableCell>{item.origin}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
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
                        ¥{order.totalAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default OrderHistory;