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

### deliveryLocations (納品先マスタ)
```
{
  id: "LOC0001", // Document ID（4桁）
  customerId: "CUST001", // 得意先ID
  name: "本店", // 納品先名
  address: "東京都渋谷区〇〇1-2-3", // 住所（オプション）
  zipCode: "150-0001", // 郵便番号（オプション）
  phone: "03-1234-5678", // 電話番号（オプション）
  contactPerson: "山田花子", // 担当者名（オプション）
  notes: "", // 備考（オプション）
  displayOrder: 1, // 表示順序（オプション）
  unavailableDates: ["2025-01-15", "2025-01-20", "2025-02-11"], // 納品不可日の配列（YYYY-MM-DD形式、オプション）
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
  deliveryLocationId: "LOC0001", // 納品先ID（追加、4桁）
  workCode: "A123", // 作業コード
  name: "りんご",
  specification: "5kg箱",
  origin: "青森県",
  unitPrice: 2500,
  orderCount: 15, // 発注回数（よく発注する商品の判定用）
  minDeliveryDays: 2, // 最短納期日数（商品ごとに設定可能）
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
  deliveryLocationId: "LOC0001", // 納品先ID（追加、4桁）
  deliveryLocationName: "本店", // 納品先名（スナップショット、追加）
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

### deliveryLocations
- customerId, isActive
- customerId, displayOrder

### products
- customerId, deliveryLocationId, orderCount (desc)
- customerId, deliveryLocationId, isActive
- deliveryLocationId, isActive, orderCount (desc)

### orders
- customerId, createdAt (desc)
- customerId, deliveryLocationId, createdAt (desc)
- deliveryLocationId, createdAt (desc)
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