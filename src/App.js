import React, { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import HistoryIcon from '@mui/icons-material/History';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
// Router components will be used in future versions
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import OrderPage from './components/OrderPage';
import OrderHistory from './components/OrderHistory';
import AdminPage from './components/AdminPage';
import AdminOrderPage from './components/AdminOrderPage';
import AdminOrderHistory from './components/AdminOrderHistory';
import OrderManagementPage from './components/OrderManagementPage';
import DefectReportPage from './components/DefectReportPage';
import DeliveryLocationSelector from './components/DeliveryLocationSelector';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Helvetica Neue',
      'sans-serif'
    ].join(','),
    h4: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    // カードのモバイル対応
    MuiCard: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            margin: '8px 4px',
            borderRadius: '8px',
          },
        },
      },
    },
    // ボタンのモバイル対応
    MuiButton: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            minHeight: '48px', // タッチしやすいサイズ
          },
        },
      },
    },
    // テーブルのモバイル対応
    MuiTableContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            fontSize: '0.8rem',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '6px 4px',
            fontSize: '0.75rem',
          },
        },
      },
    },
  },
});

const AppContent = () => {
  const { user, logout, loading, deliveryLocations, setDeliveryLocation } = useAuth();
  const [currentPage, setCurrentPage] = useState('order');

  // 納品先を変更する
  const handleChangeDeliveryLocation = () => {
    setDeliveryLocation(null, null);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // 納品先未選択の場合は選択画面を表示（管理者を除く）
  if (!user.isAdmin && !user.deliveryLocationId) {
    return <DeliveryLocationSelector />;
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            発注システム - {user.customerName}
            {user.deliveryLocationName && ` / ${user.deliveryLocationName}`}
          </Typography>
          {/* ── 発注 ── */}
          <Button
            color="inherit"
            onClick={() => setCurrentPage('order')}
            sx={{
              mr: { xs: 0.5, sm: 1 },
              minWidth: { xs: '44px', sm: 'auto' },
              px: { xs: 0.5, sm: 1.5 },
              backgroundColor: currentPage === 'order' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            <ShoppingCartIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>発注</Box>
          </Button>

          {/* ── 履歴 ── */}
          <Button
            color="inherit"
            onClick={() => setCurrentPage('history')}
            sx={{
              mr: { xs: 0.5, sm: 1 },
              minWidth: { xs: '44px', sm: 'auto' },
              px: { xs: 0.5, sm: 1.5 },
              backgroundColor: currentPage === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            <HistoryIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>履歴</Box>
          </Button>

          {/* ── 不良報告（顧客のみ） ── */}
          {!user.isAdmin && (
            <Button
              color="inherit"
              onClick={() => setCurrentPage('defect')}
              sx={{
                mr: { xs: 0.5, sm: 1 },
                minWidth: { xs: '44px', sm: 'auto' },
                px: { xs: 0.5, sm: 1.5 },
                backgroundColor: currentPage === 'defect' ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              <ReportProblemIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>不良報告</Box>
            </Button>
          )}

          {/* ── 納品先変更（顧客・複数納品先のみ） ── */}
          {!user.isAdmin && deliveryLocations.length > 1 && (
            <Button
              color="inherit"
              onClick={handleChangeDeliveryLocation}
              sx={{
                mr: { xs: 0.5, sm: 1 },
                minWidth: { xs: '44px', sm: 'auto' },
                px: { xs: 0.5, sm: 1.5 },
                backgroundColor: 'transparent'
              }}
            >
              <ArrowBackIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>納品先変更</Box>
            </Button>
          )}

          {/* ── 管理者専用メニュー ── */}
          {user.isAdmin && (
            <>
              <Button
                color="inherit"
                onClick={() => setCurrentPage('master')}
                sx={{
                  mr: { xs: 0.5, sm: 1 },
                  minWidth: { xs: '44px', sm: 'auto' },
                  px: { xs: 0.5, sm: 1.5 },
                  backgroundColor: currentPage === 'master' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                <SettingsIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>マスタ管理</Box>
              </Button>
              <Button
                color="inherit"
                onClick={() => setCurrentPage('orders')}
                sx={{
                  mr: { xs: 0.5, sm: 1 },
                  minWidth: { xs: '44px', sm: 'auto' },
                  px: { xs: 0.5, sm: 1.5 },
                  backgroundColor: currentPage === 'orders' ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                <AssignmentIcon sx={{ display: { xs: 'block', sm: 'none' } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>受注管理</Box>
              </Button>
            </>
          )}
          <Button
            color="inherit"
            onClick={logout}
            sx={{
              minWidth: { xs: '48px', sm: 'auto' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '6px', sm: '6px 8px' },
              whiteSpace: 'nowrap'
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              ログアウト
            </Box>
            <LogoutIcon sx={{ display: { xs: 'block', sm: 'none' }, fontSize: '1.5rem' }} />
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth="md" 
        sx={{ 
          mt: { xs: 2, sm: 3 }, 
          mb: { xs: 8, sm: 3 }, 
          px: { xs: 1, sm: 2 } 
        }}
      >
        {currentPage === 'order' && (user.isAdmin ? <AdminOrderPage /> : <OrderPage user={user} />)}
        {currentPage === 'history' && (user.isAdmin ? <AdminOrderHistory /> : <OrderHistory user={user} />)}
        {currentPage === 'defect' && !user.isAdmin && <DefectReportPage user={user} />}
        {currentPage === 'master' && user.isAdmin && <AdminPage user={user} />}
        {currentPage === 'orders' && user.isAdmin && <OrderManagementPage user={user} />}
      </Container>
    </>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;