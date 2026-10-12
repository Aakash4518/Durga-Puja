# Finance module: remaining stages included

This update adds an admin-only finance area at `/admin/finance`.

## Included

1. **Donation/chanda register** — records donor, amount, received date, payment method, reference and notes; generates a receipt number.
2. **Expense register** — records vendor, category, description, amount, date, bill/voucher reference and notes. Expenses entered by an authenticated admin are automatically marked approved and start as unpaid.
3. **Payment tracking** — mark an approved expense paid with the actual payment date and optional payment reference; the UI asks for confirmation first.
4. **Reject and void actions** — reject unpaid expenses or void expense/donation records only after entering a reason. These are status changes, not permanent deletion.
5. **Financial summary** — received donations, approved expenses, paid expenses, approved unpaid expenses, estimated cash position, and active expense count.
6. **CSV exports** — donations, expenses and audit history can be exported and opened in Excel.
7. **Audit history** — stores who recorded, approved, rejected, voided or changed payment status, including reasons for reversal actions.
8. **Admin navigation** — adds a Finance & accounts card to the organizer dashboard.

## Setup and test

1. Copy these changed files into your existing project, preserving your `.env.local` and other local assets.
2. Confirm `MONGODB_URI`, `MONGODB_DB`, `APP_SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are set in the server environment. Do not share secrets or commit `.env.local`.
3. Run `npm install` if dependencies are not installed.
4. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
5. Start locally with `npm run dev`, log in at `/admin/login`, and open `/admin/finance`.
6. Use clearly marked TEST records first. Verify totals and exports against a calculator and a sample spreadsheet.
7. Test a donation, a new expense, reject an unpaid expense with a reason, void a record with a reason, mark an approved expense paid, and inspect audit history.
8. Reconcile existing test data and actual paper records before using the dashboard for official accounts.

## Important accounting notes

- **Approved does not mean paid.** The balance calculation subtracts only expenses explicitly marked paid.
- Voiding excludes a record from active totals but retains its document and reason for traceability.
- CSV is compatible with Excel; it is not a formatted `.xlsx` workbook or PDF report.
- The estimated cash position is a simple register calculation. It is not a bank reconciliation and must be checked against cash-in-hand, UPI/bank statements, receipts and bills.
- MongoDB transactions are used for new donation/expense records plus their creation audit entry; the cluster must support transactions (MongoDB Atlas does).
- Before public launch, test backup/restore, protect admin credentials, verify current database records, and have the committee review the accounting process. Do not use sample/test rows as official totals.


## Finance build fixes (October 2026)

- Added the `submittedBy` field to the client-side finance record type so expense CSV exports type-check.
- Updated the donation and expense list API routes to import `getDb` from the MongoDB helper.
- Prevented rejecting or voiding an expense that is marked paid, because silently excluding a paid expense from totals can misstate the cash position. Reconcile paid transactions before correcting them.
- Admin-created expenses remain automatically approved, but are initially marked unpaid.
- Keep `.env.local` out of Git. Use `.env.example` only as a template.

### Local verification

From the project root, run `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build`. This archive was statically reviewed and the reported source errors were patched, but a full Next.js build could not be completed in the packaging environment because npm dependency installation did not finish. Do not deploy until all four commands pass locally.
