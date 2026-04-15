import React from 'react';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, Store } from '@mui/icons-material';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../contexts/AuthContext';

// 顧客ごとの商品一覧セクション
const CustomerProductSection = ({ customer }) => {
  const { products, loading, error } = useProducts(customer.id);

  return (
    <Accordion defaultExpanded sx={{ mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box display="flex" alignItems="center" gap={1}>
          <Store color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {customer.name}
          </Typography>
          {!loading && (
            <Chip
              label={`${products.length}商品`}
              size="small"
              color="primary"
              variant="outlined"
            />
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
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>
        )}
        {!loading && !error && products.length === 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
            登録商品がありません
          </Typography>
        )}
        {!loading && products.length > 0 && (
          <Grid container spacing={2}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card variant="outlined">
                  <CardContent sx={{ pb: '12px !important' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {product.name}
                      </Typography>
                      {product.orderCount >= 10 && (
                        <Chip label="よく発注" color="primary" size="small" />
                      )}
                    </Box>
                    <Typography variant="caption" color="textSecondary" display="block">
                      作業コード: {product.workCode}
                    </Typography>
                    <Typography variant="body2">
                      規格: {product.specification}
                    </Typography>
                    <Typography variant="body2">
                      産地: {product.origin}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold' }}>
                        ¥{product.unitPrice.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        発注回数: {product.orderCount}回
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

const AdminOrderPage = () => {
  const { allCustomers } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        商品一覧（全顧客）
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {allCustomers.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary" align="center">
              顧客データがありません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        allCustomers.map((customer) => (
          <CustomerProductSection key={customer.id} customer={customer} />
        ))
      )}
    </Box>
  );
};

export default AdminOrderPage;
