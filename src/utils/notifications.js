import { notificationService } from '../firebase/services';

// 発注通知の送信
export const sendOrderNotification = async (orderData) => {
  try {
    // 営業担当者へ通知
    await notificationService.notifyOrder(orderData.salesStaffId, {
      orderId: orderData.id || 'TEMP_ORDER_' + Date.now(),
      customerName: orderData.customerName,
      customerId: orderData.customerId,
      totalAmount: orderData.totalAmount,
      itemCount: orderData.items.length,
      orderDate: orderData.orderDate,
      deliveryDate: orderData.deliveryDate
    });

    // 通知成功ログ
    console.log('発注通知送信完了:', {
      customerId: orderData.customerId,
      salesStaffId: orderData.salesStaffId
    });

    return true;
  } catch (error) {
    console.error('発注通知送信エラー:', error);
    throw error;
  }
};

// 緊急通知の送信（大量発注など）
export const sendUrgentNotification = async (orderData) => {
  try {
    const isUrgent = orderData.totalAmount > 50000 || orderData.items.length > 10;
    
    if (isUrgent) {
      await notificationService.notifyOrder(orderData.salesStaffId, {
        ...orderData,
        urgent: true,
        reason: orderData.totalAmount > 50000 ? '高額発注' : '大量発注'
      });
      
      console.log('緊急通知送信:', orderData.customerId);
    }
    
    return isUrgent;
  } catch (error) {
    console.error('緊急通知送信エラー:', error);
    throw error;
  }
};

// 通知テンプレート生成
export const generateNotificationMessage = (orderData) => {
  const itemSummary = orderData.items.length > 3 
    ? `${orderData.items.slice(0, 3).map(item => item.productName).join('、')}他${orderData.items.length - 3}品`
    : orderData.items.map(item => item.productName).join('、');

  return {
    title: `【発注通知】${orderData.customerName}`,
    message: `${itemSummary}の発注がありました。合計：¥${orderData.totalAmount.toLocaleString()}`,
    shortMessage: `${orderData.customerName}から¥${orderData.totalAmount.toLocaleString()}の発注`
  };
};

// LINE通知用のメッセージフォーマット
export const formatLineMessage = (orderData) => {
  const { title, message } = generateNotificationMessage(orderData);
  
  return `${title}

${message}

【詳細】
発注日: ${orderData.orderDate}
納期: ${orderData.deliveryDate}
商品数: ${orderData.items.length}品目

システムで詳細を確認してください。`;
};

// メール通知の件名とプレビュー
export const generateEmailSubject = (orderData) => {
  const urgentMark = orderData.totalAmount > 50000 ? '【緊急】' : '';
  return `${urgentMark}【発注通知】${orderData.customerName} - ¥${orderData.totalAmount.toLocaleString()}`;
};

// 通知設定の検証
export const validateNotificationSettings = (salesStaff) => {
  const settings = salesStaff.notificationSettings;
  
  if (!settings) {
    console.warn('通知設定が未設定:', salesStaff.id);
    return false;
  }

  const hasEmailSetting = settings.email && salesStaff.email;
  const hasLineSetting = settings.line && salesStaff.lineUserId;
  const hasSmsSetting = settings.sms && salesStaff.phone;

  return hasEmailSetting || hasLineSetting || hasSmsSetting;
};