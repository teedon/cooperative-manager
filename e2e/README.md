# E2E Testing

This directory contains end-to-end tests for the Cooperative Manager app.

## Test Workflow: Cooperative Payment Flow

The primary E2E test covers the following workflow:

1. **Create Cooperative** → Admin creates a new cooperative
2. **Create Contribution Plan** → Admin creates a monthly contribution plan
3. **Member Records Payment** → Member submits a payment record with receipt
4. **Admin Verifies Payment** → Admin approves the payment
5. **Ledger Updates** → Virtual balance is updated via ledger entry

## Running E2E Tests

### Prerequisites

1. Start the mock server:
   ```bash
   npm run mock-server
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

### Manual Testing Steps

Due to the complexity of setting up Detox or Playwright for React Native, the E2E test is documented as a manual test procedure:

#### Test Case: Complete Payment Verification Flow

**Setup:**
- Mock server running on http://localhost:3001
- App running on iOS simulator or Android emulator
- Use demo credentials: john.doe@example.com / password123

**Steps:**

1. **Login**
   - Open the app
   - Enter credentials and tap "Sign In"
   - Verify: Home dashboard displays with cooperatives

2. **Navigate to Cooperative**
   - Tap on "Neighborhood Savings Circle"
   - Verify: Cooperative details screen shows tabs

3. **View Contribution Plan**
   - Tap "Contributions" tab
   - Tap on "Monthly Savings" plan
   - Verify: Current period shows with status

4. **Record a Payment**
   - Tap "Record Payment" for active period
   - Enter amount: $500
   - Enter payment date: current date
   - Add payment reference
   - Optionally add receipt image
   - Tap "Submit Payment Record"
   - Verify: Success message appears

5. **Verify Payment (Admin)**
   - Navigate to "Payment Verification" from cooperative page
   - Find the pending payment
   - Tap "Approve"
   - Confirm approval
   - Verify: Success message, payment status changes to "verified"

6. **Check Ledger**
   - Navigate to "Ledger" tab
   - Verify: New entry for contribution appears
   - Verify: Balance is updated

## Automated E2E Tests (Future)

For automated E2E testing, we recommend:

1. **Detox** for iOS/Android native testing
2. **Playwright** with Expo Web for cross-platform testing

### Detox Setup (TODO)

```bash
npm install --save-dev detox @types/detox
```

Configuration would go in `detox.config.js`.

### Playwright Setup (TODO)

```bash
npm install --save-dev @playwright/test
```

Configuration would go in `playwright.config.ts`.

## API Test Script

For quick API verification, use the following curl commands:

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"password123"}'

# List cooperatives
curl http://localhost:3001/api/cooperatives \
  -H "Authorization: Bearer mock-jwt-token-user-1"

# Record payment
curl -X POST http://localhost:3001/api/contribution-periods/period-6/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-jwt-token-user-1" \
  -d '{"amount":500,"paymentDate":"2024-06-20","paymentReference":"TEST-REF"}'

# Verify payment
curl -X POST http://localhost:3001/api/contribution-records/record-3/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mock-jwt-token-user-1" \
  -d '{"approved":true}'

# Check ledger
curl http://localhost:3001/api/cooperatives/coop-1/ledger \
  -H "Authorization: Bearer mock-jwt-token-user-1"
```
