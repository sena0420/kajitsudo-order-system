import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox
} from '@mui/material';
import { FileDownload, PictureAsPdf } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const OrderManagementPage = ({ user }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [allOrders, setAllOrders] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // エクスポート関連のstate
  const [exportFilter, setExportFilter] = useState({
    startDate: '',
    endDate: '',
    customerId: '',
    selectedStatuses: ['pending', 'change_pending']
  });
  const [exportFormat, setExportFormat] = useState('csv');
  const [selectedColumns, setSelectedColumns] = useState(['workCode', 'deliveryDate', 'quantity', 'directShipCode']);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);

  // 帳票出力関連のstate
  const [reportFilter, setReportFilter] = useState({
    startDate: '',
    endDate: '',
    customerId: '',
    selectedStatuses: ['pending', 'change_pending']
  });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Firestoreから全ての注文と顧客データを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { auth } = require('../firebase/config');
        const isFirebaseAvailable = auth !== null;

        if (isFirebaseAvailable) {
          const { collection, getDocs, orderBy, query } = require('firebase/firestore');
          const { db } = require('../firebase/config');

          // 全ての注文を取得
          const ordersRef = collection(db, 'orders');
          const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
          const ordersSnapshot = await getDocs(ordersQuery);
          const ordersData = ordersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              orderDate: data.orderDate?.toDate ? data.orderDate.toDate().toISOString().split('T')[0] : data.orderDate,
              deliveryDate: data.deliveryDate?.toDate ? data.deliveryDate.toDate().toISOString().split('T')[0] : data.deliveryDate
            };
          });

          // 全ての顧客を取得
          const customersRef = collection(db, 'customers');
          const customersSnapshot = await getDocs(customersRef);
          const customersData = customersSnapshot.docs.map(doc => ({
            customerId: doc.id,
            customerName: doc.data().name
          }));

          setAllOrders(ordersData);
          setAllCustomers(customersData);
        } else {
          // デモモード: モックデータ
          setAllCustomers([
            { customerId: '000001', customerName: 'サンプル顧客' },
            { customerId: '000002', customerName: 'テスト商店' },
            { customerId: '000003', customerName: 'デモスーパー' }
          ]);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // モック顧客データ（後方互換性のため）
  const mockCustomers = allCustomers;

  // 利用可能な列
  const availableColumns = [
    { key: 'orderDate', label: '発注日' },
    { key: 'customerId', label: '得意先コード' },
    { key: 'customerName', label: '得意先名' },
    { key: 'workCode', label: '作業コード' },
    { key: 'productName', label: '商品名' },
    { key: 'specification', label: '規格' },
    { key: 'origin', label: '産地' },
    { key: 'quantity', label: '数量' },
    { key: 'unitPrice', label: '単価' },
    { key: 'deliveryDate', label: '配送日' },
    { key: 'status', label: 'ステータス' },
    { key: 'directShipCode', label: '直送コード' }
  ];

  const handleColumnToggle = (columnKey) => {
    setSelectedColumns(prev => {
      if (prev.includes(columnKey)) {
        return prev.filter(key => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  // フィルター適用
  const getFilteredOrders = () => {
    return allOrders.filter(order => {
      // 開始日フィルター
      if (exportFilter.startDate) {
        const orderDate = order.createdAt || new Date(order.orderDate);
        if (orderDate < new Date(exportFilter.startDate)) {
          return false;
        }
      }
      // 終了日フィルター
      if (exportFilter.endDate) {
        const orderDate = order.createdAt || new Date(order.orderDate);
        const endDate = new Date(exportFilter.endDate);
        endDate.setHours(23, 59, 59, 999); // 終了日の23:59:59まで含める
        if (orderDate > endDate) {
          return false;
        }
      }
      // 得意先フィルター
      if (exportFilter.customerId && order.customerId !== exportFilter.customerId) {
        return false;
      }
      // ステータスフィルター（選択されたステータスのみ含める）
      if (!exportFilter.selectedStatuses.includes(order.status)) {
        return false;
      }
      return true;
    });
  };

  // CSVエクスポート
  const handleExportCSV = async () => {
    const orders = getFilteredOrders();

    // エクスポート対象の発注IDを取得（処理待ち・変更処理待ちのみ）
    const exportedOrderIds = orders
      .filter(order => order.status === 'pending' || order.status === 'change_pending')
      .map(order => order.id);

    // 発注データを行単位に展開
    const rows = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        const row = {};
        selectedColumns.forEach(col => {
          if (col === 'orderDate') row[col] = order.orderDate;
          else if (col === 'customerId') row[col] = order.customerId;
          else if (col === 'customerName') row[col] = order.customerName;
          else if (col === 'status') row[col] = order.status === 'confirmed' ? '確認済' : order.status === 'change_pending' ? '変更処理待ち' : '処理待ち';
          else if (col === 'directShipCode') row[col] = ''; // 直送コードは空欄
          else row[col] = item[col] || '';
        });
        rows.push(row);
      });
    });

    // CSVヘッダー
    const headers = selectedColumns.map(key => {
      const column = availableColumns.find(c => c.key === key);
      return column ? column.label : key;
    });

    // CSV本文
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      const values = selectedColumns.map(key => {
        const value = row[key] || '';
        if (String(value).includes(',') || String(value).includes('\n') || String(value).includes('"')) {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });

    // BOM付きUTF-8でダウンロード
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.href = url;
    link.download = `orders_export_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // エクスポート後、ステータスを「確認済」に更新
    if (exportedOrderIds.length > 0) {
      await updateOrdersStatusInStorage(exportedOrderIds, 'confirmed');
    }
  };

  // Excelエクスポート
  const handleExportExcel = async () => {
    const orders = getFilteredOrders();

    // エクスポート対象の発注IDを取得（処理待ち・変更処理待ちのみ）
    const exportedOrderIds = orders
      .filter(order => order.status === 'pending' || order.status === 'change_pending')
      .map(order => order.id);

    // 発注データを行単位に展開
    const rows = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        const row = {};
        selectedColumns.forEach(col => {
          const column = availableColumns.find(c => c.key === col);
          const label = column ? column.label : col;

          if (col === 'orderDate') row[label] = order.orderDate;
          else if (col === 'customerId') row[label] = order.customerId;
          else if (col === 'customerName') row[label] = order.customerName;
          else if (col === 'status') row[label] = order.status === 'confirmed' ? '確認済' : order.status === 'change_pending' ? '変更処理待ち' : '処理待ち';
          else if (col === 'directShipCode') row[label] = ''; // 直送コードは空欄
          else row[label] = item[col] || '';
        });
        rows.push(row);
      });
    });

    // Excelワークブック作成
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '受注データ');

    // ダウンロード
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(workbook, `orders_export_${timestamp}.xlsx`);

    // エクスポート後、ステータスを「確認済」に更新
    if (exportedOrderIds.length > 0) {
      await updateOrdersStatusInStorage(exportedOrderIds, 'confirmed');
    }
  };

  // 発注ステータスを更新（Firestoreに保存）
  const updateOrdersStatusInStorage = async (orderIds, newStatus) => {
    try {
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        const { doc, updateDoc, serverTimestamp, writeBatch } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        // バッチ更新で複数の注文を一括更新
        const batch = writeBatch(db);
        orderIds.forEach(orderId => {
          const orderRef = doc(db, 'orders', orderId);
          batch.update(orderRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();

        // UIの即座な更新
        setAllOrders(prev => prev.map(order =>
          orderIds.includes(order.id)
            ? { ...order, status: newStatus, updatedAt: new Date() }
            : order
        ));
      } else {
        // デモモード: localStorageを更新
        mockCustomers.forEach(customer => {
          const savedOrders = localStorage.getItem(`orders_${customer.customerId}`);
          if (savedOrders) {
            try {
              const orders = JSON.parse(savedOrders);
              const updatedOrders = orders.map(order => {
                if (orderIds.includes(order.id)) {
                  return { ...order, status: newStatus, updatedAt: new Date().toISOString() };
                }
                return order;
              });
              localStorage.setItem(`orders_${customer.customerId}`, JSON.stringify(updatedOrders));
            } catch (error) {
              console.error('ステータス更新エラー:', error);
            }
          }
        });
      }
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータス更新に失敗しました。');
    }
  };

  // 帳票出力用のフィルター
  const getReportFilteredOrders = () => {
    return allOrders.filter(order => {
      if (reportFilter.startDate) {
        const orderDate = order.createdAt || new Date(order.orderDate);
        if (orderDate < new Date(reportFilter.startDate)) {
          return false;
        }
      }
      if (reportFilter.endDate) {
        const orderDate = order.createdAt || new Date(order.orderDate);
        const endDate = new Date(reportFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) {
          return false;
        }
      }
      if (reportFilter.customerId && order.customerId !== reportFilter.customerId) {
        return false;
      }
      // ステータスフィルター（選択されたステータスのみ含める）
      if (!reportFilter.selectedStatuses.includes(order.status)) {
        return false;
      }
      return true;
    });
  };

  // PDF帳票出力
  const handleExportPDF = async () => {
    const orders = getReportFilteredOrders();

    if (orders.length === 0) {
      alert('出力対象のデータがありません');
      return;
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'confirmed': return '確認済';
        case 'change_pending': return '変更処理待ち';
        case 'pending': return '処理待ち';
        default: return '不明';
      }
    };

    // 日付をyyyy/mm/dd形式にフォーマットする関数
    const formatDate = (date) => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    };

    // 全てのデータ行を配列に変換
    const allRows = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        allRows.push({
          deliveryDate: formatDate(order.deliveryDate),
          customerName: order.customerName || order.customerId,
          workCode: item.workCode,
          productName: item.productName,
          specification: item.specification || '',
          origin: item.origin || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          orderDate: formatDate(order.createdAt || order.orderDate),
          status: getStatusText(order.status),
          isConfirmed: order.status === 'confirmed'
        });
      });
    });

    // 1ページあたりの行数（ヘッダーとフッターの高さを考慮）
    const rowsPerPage = 13;
    const totalPages = Math.ceil(allRows.length / rowsPerPage);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // 各ページを生成
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      if (pageNum > 0) {
        pdf.addPage();
      }

      const startIdx = pageNum * rowsPerPage;
      const endIdx = Math.min(startIdx + rowsPerPage, allRows.length);
      const pageRows = allRows.slice(startIdx, endIdx);

      // ページ用のHTMLを生成
      const printDiv = document.createElement('div');
      printDiv.style.position = 'absolute';
      printDiv.style.left = '-9999px';
      printDiv.style.width = '1200px';
      printDiv.style.backgroundColor = 'white';
      printDiv.style.padding = '20px';

      let tableHTML = `
        <div style="font-family: 'MS Gothic', 'Meiryo', sans-serif; padding: 20px; padding-bottom: 60px;">
          <h2 style="text-align: center; margin-bottom: 10px;">受注データ帳票</h2>
          <p style="font-size: 12px; margin-bottom: 20px;">出力日時: ${new Date().toLocaleString('ja-JP')}</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; table-layout: fixed;">
            <colgroup>
              <col style="width: 70px;">
              <col style="width: 80px;">
              <col style="width: 140px;">
              <col style="width: 180px;">
              <col style="width: 80px;">
              <col style="width: 50px;">
              <col style="width: 45px;">
              <col style="width: 80px;">
              <col style="width: 80px;">
              <col style="width: 80px;">
              <col style="width: 85px;">
            </colgroup>
            <thead>
              <tr style="background-color: #2196f3; color: white;">
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">作業CD</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">納品日</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">得意先</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">商品名</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">規格</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">産地</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">数量</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">単価</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">小計</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">発注日</th>
                <th style="border: 1px solid #ddd; padding: 8px; font-size: 13px;">ステータス</th>
              </tr>
            </thead>
            <tbody>
      `;

      pageRows.forEach(row => {
        const rowStyle = row.isConfirmed ? 'background-color: #d3d3d3;' : 'background-color: white;';
        tableHTML += `
          <tr style="${rowStyle}">
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.workCode}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.deliveryDate}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.customerName}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.productName}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.specification}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.origin}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-size: 20px; font-weight: bold;">${row.quantity}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-size: 13px;">¥${row.unitPrice.toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-size: 13px;">¥${row.subtotal.toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.orderDate}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-size: 13px;">${row.status}</td>
          </tr>
        `;
      });

      tableHTML += `
            </tbody>
          </table>
          <div style="text-align: center; margin-top: 50px; margin-bottom: 20px; font-size: 17px; font-weight: bold;">
            ${pageNum + 1} / ${totalPages}
          </div>
        </div>
      `;

      printDiv.innerHTML = tableHTML;
      document.body.appendChild(printDiv);

      try {
        // HTMLをキャンバスに変換
        const canvas = await html2canvas(printDiv, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // 画像をPDFページに追加
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      } catch (error) {
        console.error('ページ生成エラー:', error);
      } finally {
        document.body.removeChild(printDiv);
      }
    }

    // PDFをダウンロード
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    pdf.save(`受注帳票_${timestamp}.pdf`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        受注データ管理
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="受注データエクスポート" />
          <Tab label="帳票出力" />
        </Tabs>

        {/* 受注データエクスポートタブ */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              受注データエクスポート
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              受注データをCSVまたはExcel形式でエクスポートできます
            </Typography>

            {/* フィルター設定 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  エクスポート条件
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="開始日"
                      type="date"
                      value={exportFilter.startDate}
                      onChange={(e) => setExportFilter({ ...exportFilter, startDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="終了日"
                      type="date"
                      value={exportFilter.endDate}
                      onChange={(e) => setExportFilter({ ...exportFilter, endDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      size="small"
                      options={mockCustomers}
                      getOptionLabel={(option) => `${option.customerId} - ${option.customerName}`}
                      value={mockCustomers.find(c => c.customerId === exportFilter.customerId) || null}
                      onChange={(event, newValue) => {
                        setExportFilter({ ...exportFilter, customerId: newValue ? newValue.customerId : '' });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="得意先" placeholder="全て" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl component="fieldset" size="small">
                      <Typography variant="subtitle2" gutterBottom>ステータス</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exportFilter.selectedStatuses.includes('pending')}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...exportFilter.selectedStatuses, 'pending']
                                  : exportFilter.selectedStatuses.filter(s => s !== 'pending');
                                setExportFilter({ ...exportFilter, selectedStatuses: newStatuses });
                              }}
                              size="small"
                            />
                          }
                          label="処理待ち"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exportFilter.selectedStatuses.includes('change_pending')}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...exportFilter.selectedStatuses, 'change_pending']
                                  : exportFilter.selectedStatuses.filter(s => s !== 'change_pending');
                                setExportFilter({ ...exportFilter, selectedStatuses: newStatuses });
                              }}
                              size="small"
                            />
                          }
                          label="変更処理待ち"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exportFilter.selectedStatuses.includes('confirmed')}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...exportFilter.selectedStatuses, 'confirmed']
                                  : exportFilter.selectedStatuses.filter(s => s !== 'confirmed');
                                setExportFilter({ ...exportFilter, selectedStatuses: newStatuses });
                              }}
                              size="small"
                            />
                          }
                          label="確認済"
                        />
                      </Box>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    エクスポート対象: {getFilteredOrders().reduce((total, order) => total + order.items.length, 0)} 件
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* 出力列設定 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    出力列の設定
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setColumnDialogOpen(true)}
                  >
                    列を選択
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedColumns.map(key => {
                    const column = availableColumns.find(c => c.key === key);
                    return (
                      <Chip
                        key={key}
                        label={column ? column.label : key}
                        onDelete={() => handleColumnToggle(key)}
                        color="primary"
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
                {selectedColumns.length === 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    出力する列を選択してください
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* 出力形式とエクスポート */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  出力形式
                </Typography>
                <RadioGroup
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  sx={{ mb: 2 }}
                >
                  <FormControlLabel
                    value="csv"
                    control={<Radio />}
                    label="CSV形式"
                  />
                  <FormControlLabel
                    value="excel"
                    control={<Radio />}
                    label="Excel形式"
                  />
                </RadioGroup>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<FileDownload />}
                    onClick={exportFormat === 'csv' ? handleExportCSV : handleExportExcel}
                    disabled={selectedColumns.length === 0 || getFilteredOrders().length === 0}
                    size="large"
                  >
                    {exportFormat === 'csv' ? 'CSVでダウンロード' : 'Excelでダウンロード'}
                  </Button>
                </Box>

                {getFilteredOrders().length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    エクスポート対象のデータがありません
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* 帳票出力タブ */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              帳票出力（PDF）
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              受注データをPDF形式の帳票として出力できます
            </Typography>

            {/* フィルター設定 */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  出力条件
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="開始日"
                      type="date"
                      value={reportFilter.startDate}
                      onChange={(e) => setReportFilter({ ...reportFilter, startDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="終了日"
                      type="date"
                      value={reportFilter.endDate}
                      onChange={(e) => setReportFilter({ ...reportFilter, endDate: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      size="small"
                      options={mockCustomers}
                      getOptionLabel={(option) => `${option.customerId} - ${option.customerName}`}
                      value={mockCustomers.find(c => c.customerId === reportFilter.customerId) || null}
                      onChange={(event, newValue) => {
                        setReportFilter({ ...reportFilter, customerId: newValue ? newValue.customerId : '' });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="得意先" placeholder="全て" />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl component="fieldset" size="small">
                      <Typography variant="subtitle2" gutterBottom>ステータス</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={reportFilter.selectedStatuses.includes('pending')}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...reportFilter.selectedStatuses, 'pending']
                                  : reportFilter.selectedStatuses.filter(s => s !== 'pending');
                                setReportFilter({ ...reportFilter, selectedStatuses: newStatuses });
                              }}
                              size="small"
                            />
                          }
                          label="処理待ち"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={reportFilter.selectedStatuses.includes('change_pending')}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...reportFilter.selectedStatuses, 'change_pending']
                                  : reportFilter.selectedStatuses.filter(s => s !== 'change_pending');
                                setReportFilter({ ...reportFilter, selectedStatuses: newStatuses });
                              }}
                              size="small"
                            />
                          }
                          label="変更処理待ち"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={reportFilter.selectedStatuses.includes('confirmed')}
                              onChange={(e) => {
                                const newStatuses = e.target.checked
                                  ? [...reportFilter.selectedStatuses, 'confirmed']
                                  : reportFilter.selectedStatuses.filter(s => s !== 'confirmed');
                                setReportFilter({ ...reportFilter, selectedStatuses: newStatuses });
                              }}
                              size="small"
                            />
                          }
                          label="確認済"
                        />
                      </Box>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    出力対象: {getReportFilteredOrders().length} 件の受注（商品明細 {getReportFilteredOrders().reduce((total, order) => total + order.items.length, 0)} 行）
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* PDF出力ボタン */}
            <Card>
              <CardContent>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<PictureAsPdf />}
                  onClick={handleExportPDF}
                  disabled={getReportFilteredOrders().length === 0}
                  size="large"
                >
                  PDF帳票をダウンロード
                </Button>

                {getReportFilteredOrders().length === 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    出力対象のデータがありません
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>

      {/* 列選択ダイアログ */}
      <Dialog
        open={columnDialogOpen}
        onClose={() => setColumnDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>出力列の選択</DialogTitle>
        <DialogContent>
          <List>
            {availableColumns.map((column) => (
              <ListItem key={column.key} disablePadding>
                <ListItemButton
                  dense
                  onClick={() => handleColumnToggle(column.key)}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => handleColumnToggle(column.key)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={column.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedColumns(availableColumns.map(c => c.key))}>
            すべて選択
          </Button>
          <Button onClick={() => setSelectedColumns([])}>
            すべて解除
          </Button>
          <Button onClick={() => setColumnDialogOpen(false)} variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManagementPage;
