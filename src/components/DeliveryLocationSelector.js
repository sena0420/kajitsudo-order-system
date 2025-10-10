import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Paper
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import StorefrontIcon from '@mui/icons-material/Storefront';

const DeliveryLocationSelector = () => {
  const { user, deliveryLocations, setDeliveryLocation } = useAuth();

  const handleLocationSelect = (location) => {
    setDeliveryLocation(location.id, location.name);
    // 納品先を選択すると、App.jsが自動的に発注画面を表示します
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            納品先を選択してください
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.customerName || ''}
          </Typography>
        </Box>

        {deliveryLocations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              納品先が登録されていません。管理者にお問い合わせください。
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {deliveryLocations.map((location) => (
              <Grid item xs={12} sm={6} key={location.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleLocationSelect(location)}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <StorefrontIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Typography variant="h5" component="h2">
                          {location.name}
                        </Typography>
                      </Box>
                      {location.address && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {location.address}
                        </Typography>
                      )}
                      {location.phone && (
                        <Typography variant="body2" color="text.secondary">
                          TEL: {location.phone}
                        </Typography>
                      )}
                      {location.contactPerson && (
                        <Typography variant="body2" color="text.secondary">
                          担当: {location.contactPerson}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default DeliveryLocationSelector;
