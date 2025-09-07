# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
```bash
# Start development server
npm start

# If npm start fails on Windows, use:
npx react-scripts start
```

### Build and Deploy
```bash
# Build for production
npm run build

# Deploy to Firebase (after firebase init)
firebase deploy

# Deploy Cloud Functions only
firebase deploy --only functions
```

### Testing
```bash
# Run tests
npm test

# Run tests in CI mode
npm test -- --coverage --ci
```

### Firebase Functions
```bash
# Install Cloud Functions dependencies
cd functions && npm install

# Set Gmail configuration for notifications
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
```

## Architecture Overview

### Demo Mode vs Production Mode
This application supports two modes:
- **Demo Mode**: Automatically enabled when no Firebase environment variables are set. Uses mock data and bypasses Firebase authentication.
- **Production Mode**: Full Firebase integration with real authentication and Firestore database.

The mode is determined by the presence of `REACT_APP_FIREBASE_API_KEY` environment variable in `src/firebase/config.js`.

### Component Architecture
The app uses a centralized state management pattern with React Context:

- `AuthContext`: Manages authentication state and provides login/logout methods. Automatically detects Firebase availability and falls back to mock authentication.
- `useProducts`: Custom hook managing product data with optimistic updates for order counts
- `useOrders`: Custom hook managing order history with real-time updates

### Key Design Patterns

**Customer-Specific Data**: All products and orders are scoped to specific customers via `customerId`. This enables multi-tenant functionality where each customer sees only their data.

**Optimistic Updates**: When users place orders, the UI immediately updates (increments product order counts) before the server confirms, providing responsive user experience.

**Responsive Design**: The app uses Material-UI's breakpoint system with custom theme overrides for mobile optimization. Critical UI elements like the order button become full-width on mobile.

### Firebase Integration

**Authentication**: Uses Firebase Auth with custom claims to store `customerId` and `salesStaffId`. In demo mode, mock user data is generated.

**Database Structure**: 
- Customer-scoped products with `orderCount` for popularity ranking
- Orders with embedded product details for historical accuracy
- Notification queue for async processing by Cloud Functions

**Cloud Functions**: Handle email notifications to sales staff, triggered by new order creation. Include emergency notification logic for high-value orders.

### Notification System
The notification system in `src/utils/notifications.js` and `functions/index.js` supports:
- Automatic email notifications to sales staff
- Emergency notifications for orders above ¥50,000 or >10 items
- HTML email templates with order details
- Future LINE Bot API integration

### Mock Data Strategy
Mock data is embedded in hooks (`useProducts.js`, `useOrders.js`) with realistic business data including:
- Japanese produce with regional origins
- Varying order counts for popularity testing
- Complete order histories with different statuses
- Proper date formatting and currency display

## Environment Setup

### Required Environment Variables (Production Mode)
Create `.env` file from `.env.example`:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Database Setup
Database schema is documented in `src/firebase/schema.md`. Key collections:
- `customers`: Customer master data with sales staff assignments
- `products`: Customer-scoped product catalog with order tracking
- `orders`: Order records with embedded product snapshots
- `notifications`: Queue for outbound notifications

## Troubleshooting

### Windows-specific Issues
If `npm start` fails with "command not found" error:
```bash
# Clear npm cache and reinstall
npm cache clean --force
rmdir /s /q node_modules
del package-lock.json
npm install
npx react-scripts start
```

### Firebase Errors
If Firebase initialization fails, the app automatically enables demo mode. Check console for "🔧 デモモードで動作中" message to confirm mock data usage.

### Port Conflicts
If port 3000 is occupied:
```bash
npm start -- --port 3001
```

## Testing Strategy

The application includes comprehensive testing documentation in `TESTING.md`. Key test scenarios:
- Authentication flow (both Firebase and mock modes)
- Product ordering workflow with quantity adjustments
- Order history with status filtering
- Responsive design across device sizes
- Notification triggers for emergency orders

Testing can be performed entirely with mock data, making it suitable for development environments without Firebase setup.