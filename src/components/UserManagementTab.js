import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Autocomplete
} from '@mui/material';
import { Refresh, Edit, Sync } from '@mui/icons-material';

const UserManagementTab = () => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [claimsDialogOpen, setClaimsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [claimsForm, setClaimsForm] = useState({
    admin: false,
    customerId: ''
  });
  const [customers, setCustomers] = useState([]);

  // 初回ロード
  useEffect(() => {
    loadUsers();
    loadCustomers();
  }, []);

  // ユーザー一覧を取得
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        const { functions } = require('../firebase/config');
        const { httpsCallable } = require('firebase/functions');

        const listUsersFunc = httpsCallable(functions, 'listUsers');
        const result = await listUsersFunc({ maxResults: 1000 });

        if (result.data.success) {
          setUsers(result.data.users);
        }
      } else {
        // デモモード: モックデータ
        setUsers([
          {
            uid: 'user1',
            email: 'admin@example.com',
            displayName: '管理者',
            disabled: false,
            customClaims: { admin: true },
            metadata: { creationTime: '2025-01-01', lastSignInTime: '2026-04-03' }
          },
          {
            uid: 'user2',
            email: 'sample@example.com',
            displayName: 'サンプル顧客',
            disabled: false,
            customClaims: { admin: false, customerId: '000001' },
            metadata: { creationTime: '2025-01-15', lastSignInTime: '2026-04-02' }
          },
          {
            uid: 'user3',
            email: 'test@example.com',
            displayName: 'テスト商店',
            disabled: false,
            customClaims: { customerId: '000002' },
            metadata: { creationTime: '2025-02-01', lastSignInTime: '2026-04-01' }
          }
        ]);
      }
    } catch (error) {
      console.error('ユーザー一覧取得エラー:', error);
      alert('ユーザー一覧の取得に失敗しました: ' + error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  // 顧客マスタ一覧を取得
  const loadCustomers = async () => {
    try {
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        const { collection, getDocs } = require('firebase/firestore');
        const { db } = require('../firebase/config');

        const customersSnapshot = await getDocs(collection(db, 'customers'));
        const customersData = customersSnapshot.docs.map(doc => ({
          customerId: doc.id,
          customerName: doc.data().name || doc.data().customerName
        }));
        setCustomers(customersData);
      } else {
        // デモモード
        setCustomers([
          { customerId: '000001', customerName: 'サンプル顧客' },
          { customerId: '000002', customerName: 'テスト商店' },
          { customerId: '000003', customerName: 'デモスーパー' }
        ]);
      }
    } catch (error) {
      console.error('顧客マスタ取得エラー:', error);
    }
  };

  // Custom Claims設定ダイアログを開く
  const handleOpenClaimsDialog = (user) => {
    setSelectedUser(user);
    setClaimsForm({
      admin: user.customClaims?.admin || false,
      customerId: user.customClaims?.customerId || ''
    });
    setClaimsDialogOpen(true);
  };

  // Custom Claimsを設定
  const handleSetClaims = async () => {
    if (!selectedUser) return;

    try {
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        const { functions } = require('../firebase/config');
        const { httpsCallable } = require('firebase/functions');

        const setUserClaimsFunc = httpsCallable(functions, 'setUserClaims');
        const result = await setUserClaimsFunc({
          uid: selectedUser.uid,
          customClaims: {
            admin: claimsForm.admin,
            customerId: claimsForm.admin ? null : (claimsForm.customerId || null)
          }
        });

        if (result.data.success) {
          alert(result.data.message);
          setClaimsDialogOpen(false);
          loadUsers(); // リロード
        }
      } else {
        // デモモード
        alert('デモモードではCustom Claimsを設定できません。Firebase接続後に利用可能です。');
        setClaimsDialogOpen(false);
      }
    } catch (error) {
      console.error('Custom Claims設定エラー:', error);
      alert('Custom Claimsの設定に失敗しました: ' + error.message);
    }
  };

  // Custom Claims一括同期
  const handleSyncClaims = async () => {
    if (!window.confirm('全ユーザーのCustom Claimsを顧客マスタと同期しますか？\n※ユーザーのメールアドレスと顧客マスタのメールアドレスが一致する場合、自動的にcustomerIdが設定されます。')) {
      return;
    }

    setUsersLoading(true);
    try {
      const { auth } = require('../firebase/config');
      const isFirebaseAvailable = auth !== null;

      if (isFirebaseAvailable) {
        const { functions } = require('../firebase/config');
        const { httpsCallable } = require('firebase/functions');

        const syncCustomerClaimsFunc = httpsCallable(functions, 'syncCustomerClaims');
        const result = await syncCustomerClaimsFunc();

        if (result.data.success) {
          alert(`${result.data.message}\n成功: ${result.data.results.success}件\nエラー: ${result.data.results.errors.length}件`);
          loadUsers(); // リロード
        }
      } else {
        alert('デモモードでは一括同期できません。Firebase接続後に利用可能です。');
      }
    } catch (error) {
      console.error('一括同期エラー:', error);
      alert('一括同期に失敗しました: ' + error.message);
    } finally {
      setUsersLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ヘッダー */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          ユーザー管理（Custom Claims設定）
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Sync />}
            onClick={handleSyncClaims}
            disabled={usersLoading}
          >
            顧客マスタと一括同期
          </Button>
          <Button
            variant="outlined"
            startIcon={usersLoading ? <CircularProgress size={16} /> : <Refresh />}
            onClick={loadUsers}
            disabled={usersLoading}
          >
            更新
          </Button>
        </Box>
      </Box>

      {/* 説明 */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          <strong>Custom Claimsとは：</strong> Firebase AuthenticationでユーザーにカスタムデータUniversally Unique Identifier（UUID）を付与する機能です。
        </Typography>
        <Typography variant="body2">
          • <strong>admin=true</strong>: 管理者権限を付与（全データアクセス可能）<br />
          • <strong>customerId</strong>: 得意先IDを設定（自分のデータのみアクセス可能）<br />
          • 設定後、ユーザーは再ログインが必要です
        </Typography>
      </Alert>

      {/* ユーザー一覧テーブル */}
      {usersLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>メールアドレス</TableCell>
                <TableCell>表示名</TableCell>
                <TableCell align="center">管理者</TableCell>
                <TableCell>得意先ID</TableCell>
                <TableCell>作成日</TableCell>
                <TableCell>最終ログイン</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      ユーザーが登録されていません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid} hover>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.displayName || '-'}</TableCell>
                    <TableCell align="center">
                      {user.customClaims?.admin ? (
                        <Chip label="管理者" size="small" color="error" />
                      ) : (
                        <Chip label="一般" size="small" color="default" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.customClaims?.customerId || (
                        <Typography variant="body2" color="text.secondary">未設定</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('ja-JP') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('ja-JP') : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleOpenClaimsDialog(user)}
                      >
                        編集
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Custom Claims設定ダイアログ */}
      <Dialog
        open={claimsDialogOpen}
        onClose={() => setClaimsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Custom Claims設定
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ユーザー: <strong>{selectedUser?.email}</strong>
            </Typography>
          </Alert>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={claimsForm.admin}
                  onChange={(e) => setClaimsForm({ ...claimsForm, admin: e.target.checked })}
                />
              }
              label="管理者権限を付与"
            />
          </Box>

          {!claimsForm.admin && (
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => `${option.customerId} - ${option.customerName}`}
                value={customers.find(c => c.customerId === claimsForm.customerId) || null}
                onChange={(event, newValue) => {
                  setClaimsForm({ ...claimsForm, customerId: newValue ? newValue.customerId : '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="得意先ID"
                    placeholder="得意先を選択"
                    helperText="一般ユーザーの場合、得意先IDを設定してください"
                  />
                )}
              />
            </Box>
          )}

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Custom Claims設定後、ユーザーは再ログインが必要です。
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimsDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleSetClaims}
            variant="contained"
            color="primary"
          >
            設定
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementTab;
