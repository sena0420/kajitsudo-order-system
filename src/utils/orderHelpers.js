import React from 'react';
import { CheckCircle, HourglassEmpty, Edit as EditIcon } from '@mui/icons-material';

export const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'change_pending': return 'warning';
    case 'pending': return 'info';
    default: return 'default';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'confirmed': return '確認済';
    case 'change_pending': return '変更処理待ち';
    case 'pending': return '処理待ち';
    default: return '不明';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'confirmed': return <CheckCircle />;
    case 'change_pending': return <EditIcon />;
    case 'pending': return <HourglassEmpty />;
    default: return null;
  }
};

export const getOrderDeliveryDate = (order) => {
  if (order.deliveryDate) return order.deliveryDate;
  if (order.items && order.items.length > 0) {
    return order.items.reduce((earliest, item) => {
      if (!item.deliveryDate) return earliest;
      return !earliest || item.deliveryDate < earliest ? item.deliveryDate : earliest;
    }, null) || new Date().toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};
