import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Divider,
  LinearProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ExpandMore,
  ReportProblem,
  CloudUpload,
  Close as CloseIcon,
  CheckCircle,
  HourglassEmpty
} from '@mui/icons-material';
import { useOrders } from '../hooks/useOrders';

// ── ステータス表示ヘルパー ──────────────────────────────────────────
const REPORT_STATUS = {
  pending:    { label: '受付済み', color: 'info' },
  processing: { label: '対応中',   color: 'warning' },
  resolved:   { label: '解決済み', color: 'success' }
};

// ── 過去報告リストを localStorage から読み込む ──────────────────────
const loadReports = (customerId) => {
  try {
    const raw = localStorage.getItem(`defectReports_${customerId}`);
    if (!raw) return [];
    return JSON.parse(raw).map(r => ({
      ...r,
      reportedAt: r.reportedAt ? new Date(r.reportedAt) : new Date()
    }));
  } catch {
    return [];
  }
};

const saveReports = (customerId, reports) => {
  try {
    localStorage.setItem(`defectReports_${customerId}`, JSON.stringify(reports));
  } catch {
    console.error('不良報告の保存に失敗しました');
  }
};

// ── 画像プレビューカード ────────────────────────────────────────────
const ImagePreviewCard = ({ file, previewUrl, onRemove }) => (
  <Box
    sx={{
      position: 'relative',
      width: 90,
      height: 90,
      borderRadius: 1,
      overflow: 'hidden',
      border: '1px solid',
      borderColor: 'divider',
      flexShrink: 0
    }}
  >
    <img
      src={previewUrl}
      alt={file.name}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
    <IconButton
      size="small"
      onClick={onRemove}
      sx={{
        position: 'absolute',
        top: 2,
        right: 2,
        bgcolor: 'rgba(0,0,0,0.55)',
        color: '#fff',
        p: '2px',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' }
      }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  </Box>
);

// ── メインコンポーネント ────────────────────────────────────────────
const DefectReportPage = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { orders, loading: ordersLoading } = useOrders(user.customerId, user.deliveryLocationId);

  // 報告ダイアログ用 state
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem]   = useState(null);
  const [defectQty, setDefectQty]         = useState('');
  const [description, setDescription]     = useState('');
  const [images, setImages]               = useState([]);   // File[]
  const [previews, setPreviews]           = useState([]);   // ObjectURL[]
  const [submitting, setSubmitting]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError]     = useState('');

  // 過去報告
  const [pastReports, setPastReports]     = useState([]);
  const [successMsg, setSuccessMsg]       = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    setPastReports(loadReports(user.customerId));
  }, [user.customerId]);

  // ObjectURL を解放
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  // 納品済み（確認済み）注文のみ
  const deliveredOrders = orders.filter(o => o.status === 'confirmed');

  // ── 報告ダイアログを開く ─────────────────────────────────────────
  const openDialog = (order, item) => {
    setSelectedOrder(order);
    setSelectedItem(item);
    setDefectQty('');
    setDescription('');
    setImages([]);
    setPreviews([]);
    setSubmitError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSubmitting(false);
    setUploadProgress(0);
  };

  // ── 画像選択 ─────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // 最大5枚
    const newFiles = [...images, ...files].slice(0, 5);
    setImages(newFiles);
    // 既存 ObjectURL を解放してから再生成
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews(newFiles.map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ── 送信処理 ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const qty = parseInt(defectQty, 10);
    if (!qty || qty <= 0) {
      setSubmitError('不良数量を正しく入力してください。');
      return;
    }
    if (qty > selectedItem.quantity) {
      setSubmitError(`不良数量は発注数量（${selectedItem.quantity}）以下で入力してください。`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const { auth: firebaseAuth } = require('../firebase/config');
      const isFirebaseAvailable = firebaseAuth !== null;

      let imageUrls = [];

      if (isFirebaseAvailable && images.length > 0) {
        // Firebase Storage にアップロード
        const { storage } = require('../firebase/config');
        const { ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');

        for (let i = 0; i < images.length; i++) {
          const file = images[i];
          const path = `defectReports/${user.customerId}/${Date.now()}_${file.name}`;
          const storageRef = ref(storage, path);
          await new Promise((resolve, reject) => {
            const task = uploadBytesResumable(storageRef, file);
            task.on(
              'state_changed',
              (snap) => setUploadProgress(Math.round(((i + snap.bytesTransferred / snap.totalBytes) / images.length) * 100)),
              reject,
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                imageUrls.push(url);
                resolve();
              }
            );
          });
        }
      }

      const report = {
        id: `RPT${Date.now()}`,
        orderId: selectedOrder.id,
        orderDate: selectedOrder.orderDate,
        deliveryDate: selectedOrder.deliveryDate,
        productId: selectedItem.productId,
        productName: selectedItem.productName,
        workCode: selectedItem.workCode,
        specification: selectedItem.specification,
        origin: selectedItem.origin,
        orderedQuantity: selectedItem.quantity,
        defectQuantity: qty,
        description: description.trim(),
        imageUrls,
        imageNames: images.map(f => f.name),
        customerId: user.customerId,
        customerName: user.customerName,
        deliveryLocationId: selectedOrder.deliveryLocationId || null,
        deliveryLocationName: selectedOrder.deliveryLocationName || null,
        salesStaffId: selectedOrder.salesStaffId || user.salesStaffId,
        reportedAt: new Date(),
        status: 'pending'
      };

      if (isFirebaseAvailable) {
        // Firestore に保存
        const { db } = require('../firebase/config');
        const { collection, addDoc, serverTimestamp } = require('firebase/firestore');
        await addDoc(collection(db, 'defectReports'), {
          ...report,
          reportedAt: serverTimestamp()
        });
      } else {
        // デモモード: localStorage に保存
        const updated = [report, ...pastReports];
        saveReports(user.customerId, updated);
        setPastReports(updated);
      }

      setSuccessMsg(`「${selectedItem.productName}」の不良報告を送信しました。担当者が確認次第ご連絡いたします。`);
      closeDialog();
    } catch (err) {
      console.error('不良報告送信エラー:', err);
      setSubmitError('送信に失敗しました。しばらく経ってから再度お試しください。');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // ── ローディング ─────────────────────────────────────────────────
  if (ordersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>読み込み中...</Typography>
      </Box>
    );
  }

  // ── 本体 ─────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="h4" gutterBottom>不良報告</Typography>

      {successMsg && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccessMsg('')}
          icon={<CheckCircle />}
        >
          {successMsg}
        </Alert>
      )}

      {/* ── 納品済み発注一覧 ─────────────────────────────────── */}
      <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
        納品済み商品から選択
      </Typography>

      {deliveredOrders.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary" align="center">
              納品済みの発注がありません
            </Typography>
          </CardContent>
        </Card>
      ) : (
        deliveredOrders.map((order) => (
          <Accordion key={order.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box>
                <Typography variant="subtitle1">
                  納品日: {new Date(order.deliveryDate || order.orderDate).toLocaleDateString('ja-JP')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  発注日: {order.createdAt
                    ? order.createdAt.toLocaleDateString('ja-JP')
                    : new Date(order.orderDate).toLocaleDateString('ja-JP')
                  }
                  {order.deliveryLocationName && ` | ${order.deliveryLocationName}`}
                  {` | ¥${order.totalAmount.toLocaleString()}`}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 480 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>作業コード</TableCell>
                      <TableCell>商品名</TableCell>
                      <TableCell>規格</TableCell>
                      <TableCell>産地</TableCell>
                      <TableCell align="right">数量</TableCell>
                      <TableCell align="center">不良報告</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.workCode}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.specification}</TableCell>
                        <TableCell>{item.origin}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<ReportProblem />}
                            onClick={() => openDialog(order, item)}
                          >
                            報告する
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* ── 送信済み報告一覧 ─────────────────────────────────── */}
      {pastReports.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>送信済み報告</Typography>
          <Divider sx={{ mb: 2 }} />
          {pastReports.map((report) => (
            <Card key={report.id} variant="outlined" sx={{ mb: 1.5 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {report.productName}
                    <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                      ({report.specification})
                    </Typography>
                  </Typography>
                  <Chip
                    label={(REPORT_STATUS[report.status] || REPORT_STATUS.pending).label}
                    color={(REPORT_STATUS[report.status] || REPORT_STATUS.pending).color}
                    size="small"
                    icon={report.status === 'resolved' ? <CheckCircle /> : <HourglassEmpty />}
                  />
                </Box>
                <Typography variant="body2">
                  不良数量: <strong>{report.defectQuantity}</strong>
                  　発注数量: {report.orderedQuantity}
                  {report.deliveryLocationName && `　納品先: ${report.deliveryLocationName}`}
                </Typography>
                {report.description && (
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    メモ: {report.description}
                  </Typography>
                )}
                {report.imageNames && report.imageNames.length > 0 && (
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                    添付画像: {report.imageNames.join(', ')}
                  </Typography>
                )}
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                  報告日時: {report.reportedAt.toLocaleString('ja-JP')}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ── 報告入力ダイアログ ───────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportProblem color="error" />
          不良報告
        </DialogTitle>
        <DialogContent dividers>
          {selectedItem && (
            <Box>
              {/* 商品情報 */}
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  対象商品
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {selectedItem.productName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  作業コード: {selectedItem.workCode}　規格: {selectedItem.specification}　産地: {selectedItem.origin}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  発注数量: {selectedItem.quantity}　単価: ¥{selectedItem.unitPrice?.toLocaleString()}
                </Typography>
              </Paper>

              {/* 不良数量 */}
              <TextField
                label="不良数量 *"
                type="number"
                fullWidth
                value={defectQty}
                onChange={(e) => setDefectQty(e.target.value)}
                inputProps={{ min: 1, max: selectedItem.quantity }}
                helperText={`1〜${selectedItem.quantity} の範囲で入力してください`}
                sx={{ mb: 2 }}
                autoFocus
              />

              {/* メモ */}
              <TextField
                label="不良内容・メモ（任意）"
                multiline
                rows={3}
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例：変色、異臭、破損など具体的な状況をご記入ください"
                sx={{ mb: 2 }}
              />

              {/* 画像アップロード */}
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  画像添付（任意・最大5枚）
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= 5}
                  size="small"
                >
                  画像を選択
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                {previews.length > 0 && (
                  <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                    {previews.map((url, idx) => (
                      <ImagePreviewCard
                        key={idx}
                        file={images[idx]}
                        previewUrl={url}
                        onRemove={() => removeImage(idx)}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              {/* アップロード進捗 */}
              {submitting && uploadProgress > 0 && (
                <Box mt={2}>
                  <Typography variant="caption">画像をアップロード中... {uploadProgress}%</Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 0.5 }} />
                </Box>
              )}

              {submitError && (
                <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexDirection: isMobile ? 'column-reverse' : 'row' }}>
          <Button
            onClick={closeDialog}
            disabled={submitting}
            fullWidth={isMobile}
            variant="outlined"
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={submitting || !defectQty}
            fullWidth={isMobile}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ReportProblem />}
          >
            {submitting ? '送信中...' : '報告を送信'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DefectReportPage;
