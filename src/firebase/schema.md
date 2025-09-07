# Firestore データベース構造

## コレクション構造

### customers (顧客マスタ)
```
{
  id: "CUST001", // Document ID
  name: "〇〇スーパー",
  email: "customer@example.com",
  salesStaffId: "STAFF001",
  minDeliveryDays: 2, // 最短納期
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### products (商品マスタ)
```
{
  id: "auto-generated", // Document ID
  customerId: "CUST001", // 顧客ID
  workCode: "A123", // 作業コード
  name: "りんご",
  specification: "5kg箱",
  origin: "青森県",
  unitPrice: 2500,
  orderCount: 15, // 発注回数（よく発注する商品の判定用）
  lastOrderDate: Timestamp,
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### orders (発注データ)
```
{
  id: "auto-generated", // Document ID
  customerId: "CUST001",
  customerName: "〇〇スーパー",
  salesStaffId: "STAFF001",
  orderDate: "2024-01-15",
  deliveryDate: "2024-01-22",
  status: "processing", // processing, shipped, delivered, cancelled
  totalAmount: 15600,
  items: [
    {
      productId: "PROD001",
      workCode: "A123",
      productName: "りんご",
      specification: "5kg箱",
      origin: "青森県",
      quantity: 3,
      unitPrice: 2500,
      subtotal: 7500
    }
  ],
  notes: "", // 特記事項
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### salesStaff (営業担当者マスタ)
```
{
  id: "STAFF001", // Document ID
  name: "田中太郎",
  email: "tanaka@company.com",
  phone: "090-1234-5678",
  department: "営業部",
  isActive: true,
  notificationSettings: {
    email: true,
    sms: false,
    line: true
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### notifications (通知データ)
```
{
  id: "auto-generated", // Document ID
  type: "order", // order, delivery, etc.
  recipientType: "salesStaff", // salesStaff, customer
  recipientId: "STAFF001",
  title: "新規発注通知",
  message: "〇〇スーパーから新規発注がありました",
  orderData: {
    orderId: "ORDER001",
    customerName: "〇〇スーパー",
    totalAmount: 15600
  },
  status: "pending", // pending, sent, failed
  sentAt: Timestamp,
  createdAt: Timestamp
}
```

## インデックス設計

### products
- customerId, orderCount (desc)
- customerId, isActive

### orders  
- customerId, createdAt (desc)
- salesStaffId, createdAt (desc)
- status, createdAt (desc)

### notifications
- recipientId, status, createdAt (desc)
- type, status, createdAt (desc)

## セキュリティルール（予定）

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 顧客は自分のデータのみアクセス可能
    match /customers/{customerId} {
      allow read, write: if request.auth != null && 
        resource.data.email == request.auth.token.email;
    }
    
    // 商品は該当顧客のみアクセス可能
    match /products/{productId} {
      allow read, write: if request.auth != null && 
        isCustomerAuthorized(resource.data.customerId);
    }
    
    // 発注は該当顧客のみ作成・参照可能
    match /orders/{orderId} {
      allow read, create: if request.auth != null && 
        isCustomerAuthorized(resource.data.customerId);
      allow update: if false; // 発注後の変更は不可
    }
    
    function isCustomerAuthorized(customerId) {
      return exists(/databases/$(database)/documents/customers/$(customerId)) &&
        get(/databases/$(database)/documents/customers/$(customerId)).data.email == request.auth.token.email;
    }
  }
}
```