# Wallet Digital - Deployment Guide / Guía de Despliegue

## Pre-requisitos

- Node.js 18+ installed
- MySQL database running (or Docker container)
- Access to staging/production environment
- Environment variables configured (see below)

## Step-by-Step Deployment

### 1. Pull latest changes on development branch

```bash
git checkout development
git pull origin development
```

### 2. Merge wallet-digital feature (if not already merged)

```bash
git merge feature/wallet-digital
# Should be already merged if you're following this guide
```

### 3. Install new dependencies

Backend requires `node-cron` for the scheduler:

```bash
cd backend
pnpm add node-cron
# or npm: npm install node-cron
```

### 4. Run database migrations

Create the wallet tables:

```bash
# Using sequelize-cli (if installed globally)
npx sequelize-cli db:migrate

# Or run migration directly:
pnpm ts-node src/database/migrations/20260327025956-createWallets.js
```

Verify tables exist:

- `wallets`
- `wallet_transactions`
- `withdrawal_requests`

### 5. Migrate historical commissions (optional but recommended)

This script will credit all existing approved/paid commissions to user wallets:

```bash
pnpm ts-node src/database/migrations/migrateHistoricalCommissions.ts
```

**Options:**

- `--rollback` - Undo the migration (deducts amounts from wallets)

**Output:**

```
========== Historical Commission Migration ==========
Found X commissions to migrate.

Successfully migrated: X
Skipped (already migrated): 0
Failed: 0
========== Migration Complete ==========
```

**Important:** This script is idempotent - can be safely re-run.

### 6. Configure environment variables

Add to your `.env` file:

```env
# Wallet Configuration
WALLET_MIN_WITHDRAWAL=20
WALLET_FEE_PERCENTAGE=5
WALLET_CRON_TIME=0 0 * * *  # Midnight UTC daily

# Currency Conversion (optional - uses Frankfurter by default)
# EXCHANGE_RATES_API_URL=https://api.frankfurter.dev
```

Restart the application after adding env vars.

### 7. Verify wallet endpoints are accessible

Check Swagger UI at `http://your-api-domain.com/api-docs` and verify wallet endpoints appear:

- `GET /api/wallets/:userId`
- `GET /api/wallets/:userId/transactions`
- `POST /api/wallets/withdraw`
- `GET /api/wallets/withdrawals/:id`
- `DELETE /api/wallets/withdrawals/:id`

Or test with curl:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/wallets/USER_ID
```

### 8. Verify frontend integration

1. Start frontend: `pnpm dev` (or `npm run dev`)
2. Login as a user
3. Navigate to `/wallet` page:
   - Should display balance (may be $0.00 if no commissions)
   - Transaction history table
   - Withdrawal form with amount input
4. From Dashboard, verify wallet card links to `/wallet`
5. Navigation menu should show "Wallet" / "Billetera"

### 9. Test withdrawal flow (staging only)

```bash
# 1. Ensure user has balance > $20
# 2. Go to /wallet
# 3. Enter amount >= 20
# 4. Submit withdrawal
# 5. Check withdrawal request created (status: PENDING)
# 6. In admin panel (if available), approve withdrawal
# 7. Scheduler will process at midnight (or trigger manually):
#    pnpm ts-node src/services/SchedulerService.ts
```

### 10. Configure scheduler (production)

The scheduler uses `node-cron` and runs at cron schedule defined in `WALLET_CRON_TIME`.

To start scheduler automatically when app boots, add to your server entry point:

```typescript
import { schedulerService } from './src/services/SchedulerService';

// After server starts
schedulerService.start();
```

**For testing**, you can change cron to run every minute:

```env
WALLET_CRON_TIME=*/1 * * * *
```

### 11. Monitor logs

Check for:

- `[SchedulerService]` logs for payout processing
- `[WalletService]` logs for withdrawal creation
- Any errors from Frankfurter API (currency conversion)

### 12. Rollback plan (if needed)

**To rollback historical migration:**

```bash
pnpm ts-node src/database/migrations/migrateHistoricalCommissions.ts --rollback
```

**To disable wallet feature:**

1. Comment out wallet routes in `backend/src/routes/index.ts`
2. Remove wallet navigation from `frontend/src/components/layout/AppLayout.tsx`
3. Remove wallet card from `frontend/src/pages/Dashboard.tsx`
4. Restart application

## Troubleshooting

### "node-cron not found"

Install dependency: `pnpm add node-cron`

### "Wallet table doesn't exist"

Run migration again. Check database connection.

### "Historical migration failed: Commission not found"

The script skips commissions that can't be found. Check logs for specific IDs.

### "Withdrawal rejected: insufficient balance"

Ensure `minWithdrawal` is met AND balance covers amount + 5% fee.
Example: To withdraw $20, need balance >= $21.05 ($20 + $1.05 fee)

### "Currency conversion failing"

Frankfurter API may be down. The system falls back to hardcoded rates.
Check network connectivity: `curl https://api.frankfurter.dev/latest?from=USD`

## Verification Checklist

- [ ] Database tables exist (wallets, wallet_transactions, withdrawal_requests)
- [ ] Backend starts without errors
- [ ] Wallet endpoints return 200 for authenticated user
- [ ] Frontend `/wallet` page loads
- [ ] Dashboard shows wallet card with balance
- [ ] Withdrawal form validates $20 minimum
- [ ] Historical commissions migrated (if ran)
- [ ] Scheduler running (check logs)
- [ ] Swagger docs updated

## Support

If issues persist, check:

- Backend logs: `pnpm start:backend`
- Frontend logs: Browser console
- Database: Verify data in `wallets` table

---

**Last updated:** 2026-03-27  
**Version:** 1.0
