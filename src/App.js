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
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import OrderPage from './components/OrderPage';
import OrderHistory from './components/OrderHistory';

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
  const { user, logout, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('order');

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
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => setCurrentPage('order')}
            sx={{ 
              mr: { xs: 0.5, sm: 2 },
              minWidth: { xs: '60px', sm: 'auto' },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              backgroundColor: currentPage === 'order' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            発注
          </Button>
          <Button 
            color="inherit" 
            onClick={() => setCurrentPage('history')}
            sx={{ 
              mr: { xs: 0.5, sm: 2 },
              minWidth: { xs: '60px', sm: 'auto' },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              backgroundColor: currentPage === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            履歴
          </Button>
          <Button 
            color="inherit" 
            onClick={logout}
            sx={{ 
              minWidth: { xs: '50px', sm: 'auto' },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '4px 6px', sm: '6px 8px' },
              whiteSpace: 'nowrap'
            }}
          >
            <Box 
              sx={{ 
                display: 'inline',
                fontSize: { xs: '0.7rem', sm: '0.875rem' }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                ログアウト
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                OUT
              </Box>
            </Box>
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
        {currentPage === 'order' && <OrderPage user={user} />}
        {currentPage === 'history' && <OrderHistory user={user} />}
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