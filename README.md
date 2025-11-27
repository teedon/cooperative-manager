# Cooperative Manager

A production-ready React Native mobile app for community cooperative platforms. This app enables cooperative creation, multi-membership management, role-based permissions, recurring contributions, group buys, offline payment recording, loan requests/approval, and ledger-driven virtual balance tracking.

## 🚀 Features

- **Cooperative Management**: Create and manage multiple cooperatives with role-based permissions (admin, moderator, member)
- **Contribution Plans**: Fixed or variable contribution plans with different frequencies (weekly, biweekly, monthly, quarterly, annually)
- **Payment Recording**: Members can record payments with receipt upload, pending admin verification
- **Group Buys**: Browse group buy listings, indicate interest, and track allocations
- **Loan Management**: Request loans, admin approval workflow, repayment tracking
- **Virtual Balance**: Ledger-driven balance computed from contributions, loans, and group buys
- **Offline Support**: AsyncStorage for offline caching and receipt storage

## 📱 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Tab navigators)
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form + Zod validation
- **Styling**: NativeWind (Tailwind for React Native)
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Media**: Expo Image Picker and Camera
- **Testing**: Jest + React Native Testing Library

## 🏗️ Project Structure

```
cooperative-manager/
├── src/
│   ├── api/              # API client and endpoint modules
│   ├── assets/           # Images, fonts, and other assets
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Generic components (Button, Card, Modal)
│   │   ├── cooperative/  # Cooperative-specific components
│   │   ├── contributions/# Contribution-related components
│   │   ├── groupbuys/    # Group buy components
│   │   ├── loans/        # Loan components
│   │   └── ledger/       # Ledger display components
│   ├── config/           # App configuration
│   ├── hooks/            # Custom React hooks
│   ├── models/           # TypeScript types and interfaces
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # Screen components
│   │   ├── auth/         # Login, Signup
│   │   ├── home/         # Home dashboard
│   │   ├── cooperative/  # Cooperative detail, member dashboard
│   │   ├── contributions/# Contribution plans, periods, payment recording
│   │   ├── groupbuys/    # Group buy list, detail, management
│   │   ├── loans/        # Loan request, detail, admin decision
│   │   └── ledger/       # Ledger view
│   ├── services/         # Business logic services
│   ├── store/            # Redux store and slices
│   └── utils/            # Utility functions
├── mock-server/          # Express mock API server
│   ├── data/             # Seed data (JSON)
│   ├── openapi.yaml      # OpenAPI specification
│   └── server.ts         # Mock server implementation
├── storybook/            # Storybook configuration
├── e2e/                  # End-to-end tests
├── tests/                # Unit and integration tests
└── .github/workflows/    # CI/CD pipelines
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/cooperative-manager.git
   cd cooperative-manager
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the mock server:
   ```bash
   npm run mock-server
   ```

5. In a new terminal, start the Expo dev server:
   ```bash
   npm start
   ```

6. Run on your preferred platform:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

### Demo Credentials

- **Email**: john.doe@example.com
- **Password**: password123

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in web browser |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run mock-server` | Start mock API server |

## 🔌 Mock API Server

The mock server runs on `http://localhost:3001` and provides all the endpoints defined in the OpenAPI spec.

### Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/signup` - User registration
- `GET /api/cooperatives` - List user's cooperatives
- `POST /api/cooperatives` - Create cooperative
- `GET /api/cooperatives/:id/members` - List members
- `GET /api/cooperatives/:id/contribution-plans` - List contribution plans
- `POST /api/contribution-periods/:id/records` - Record payment
- `POST /api/contribution-records/:id/verify` - Verify payment (admin)
- `GET /api/cooperatives/:id/group-buys` - List group buys
- `POST /api/group-buys/:id/orders` - Indicate interest
- `POST /api/group-buys/:id/finalize` - Finalize group buy (admin)
- `GET /api/cooperatives/:id/loans` - List loans
- `POST /api/loans/:id/review` - Review loan (admin)
- `GET /api/cooperatives/:id/ledger` - Get ledger entries
- `GET /api/cooperatives/:id/members/:memberId/balance` - Get virtual balance

### Health Check

```bash
curl http://localhost:3001/api/health
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### With Coverage

```bash
npm run test:coverage
```

### E2E Tests

E2E tests use the mock server. Make sure it's running:

```bash
npm run mock-server &
npm run test:e2e
```

## 📊 Business Rules

### Virtual Balance Calculation

```
Virtual Balance = Total Contributions 
                + Total Loan Repayments 
                + Total Group Buy Repayments
                + Manual Adjustments
                - Total Loan Disbursements 
                - Total Group Buy Outlays
```

### Contribution Plans

- **Type**: Fixed (set amount) or Variable (min/max range)
- **Frequency**: Weekly, Biweekly, Monthly, Quarterly, Annually
- **Duration**: Continuous or Fixed Period

### Group Buy Allocation

- **First Come**: Orders fulfilled in order received
- **Proportional**: Units distributed based on request ratio
- **Admin Override**: Manual allocation by admin

### Payment Verification Flow

1. Member records payment with receipt
2. Payment status: `pending`
3. Admin reviews and approves/rejects
4. If approved: Status → `verified`, ledger entry created, balance updated
5. If rejected: Status → `rejected` with reason

## 🔒 Security Considerations

- No real payment processing - all payments are recorded transactions
- Receipts stored as local mock URLs (no actual file uploads)
- Role-based permission checks in UI and API
- No sensitive data committed to repository

## 📝 Developer Checklist

- [ ] Review OpenAPI spec before implementing new endpoints
- [ ] Follow TypeScript strict mode
- [ ] Add unit tests for new reducers and services
- [ ] Update Storybook stories for new components
- [ ] Run linting before committing
- [ ] Test on both iOS and Android simulators

## 🚧 Remaining Work

### High Priority
- [ ] Implement proper authentication with JWT tokens
- [ ] Add push notifications for payment reminders
- [ ] Implement offline data sync
- [ ] Add biometric authentication

### Medium Priority
- [ ] Complete Storybook stories for all components
- [ ] Add more comprehensive E2E tests
- [ ] Implement dark mode support
- [ ] Add multi-language support (i18n)

### Low Priority
- [ ] Add analytics tracking
- [ ] Implement export reports feature
- [ ] Add member invitation system
- [ ] Performance optimization for large cooperatives

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📞 Support

For questions or issues, please open a GitHub issue.
