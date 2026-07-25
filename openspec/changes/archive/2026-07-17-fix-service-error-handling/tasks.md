# Tasks: Fix Service Error Handling

> **TDD Mode**: STRICT. Every task marked 🔴 writes a failing test first. 🟢 makes it pass.
> **Test runner**: `cd backend && pnpm test` (Jest)
> **Total tasks**: 19 | **Total estimated hours**: ~3h

---

## Phase 1: R2Service Error Handling (3 methods)

- [x] 1.1 🔴 **RED** — Write error path test in `backend/src/__tests__/unit/R2Service.test.ts`: mock S3 `putObject` to throw, call `uploadImage()`, assert error is logged and rethrown.
- [x] 1.2 🟢 **GREEN** — Wrap `uploadImage()` in try/catch in `R2Service.ts`. Log via `logger.error`, rethrow.
- [x] 1.3 🟢 **GREEN** — Wrap `deleteImage()` in try/catch in `R2Service.ts`. Same pattern.
- [x] 1.4 🟢 **GREEN** — Wrap `uploadImages()` in try/catch in `R2Service.ts`. Same pattern.
- [x] 1.5 ✅ **VERIFY** — `cd backend && pnpm test` — all R2Service tests pass.

---

## Phase 2: QRService Error Handling (5 methods)

- [x] 2.1 🔴 **RED** — Write error path test in `backend/src/__tests__/unit/QRService.test.ts`: mock QR generation to throw, call `generateQRDataUrl()`, assert error is logged and rethrown.
- [x] 2.2 🟢 **GREEN** — Wrap `generateQRDataUrl()` in try/catch in `QRService.ts`. Log via `logger.error`, rethrow.
- [x] 2.3 🟢 **GREEN** — Wrap `generateQRBuffer()` in try/catch. Same pattern.
- [x] 2.4 🟢 **GREEN** — Wrap `generateQRFile()` in try/catch. Same pattern.
- [x] 2.5 🟢 **GREEN** — Wrap `generateGiftCardQR()` in try/catch. Same pattern.
- [x] 2.6 🟢 **GREEN** — Wrap `resolveShortCode()` in try/catch. Same pattern.
- [x] 2.7 ✅ **VERIFY** — `cd backend && pnpm test` — all QRService tests pass.

> Note: Required `return await` instead of `return` for promise-returning calls inside try blocks — critical JS gotcha.

---

## Phase 3: MercadoPagoService Error Handling (5 methods)

- [x] 3.1 🔴 **RED** — Write error path test in `backend/src/__tests__/unit/MercadoPagoService.test.ts`: mock MP API to throw, call `createPreference()`, assert error is logged and rethrown.
- [x] 3.2 🟢 **GREEN** — Wrap `createPreference()` in try/catch in `MercadoPagoService.ts`. Log via `logger.error`, rethrow.
- [x] 3.3 🟢 **GREEN** — Wrap `getPayment()` in try/catch. Same pattern.
- [x] 3.4 🟢 **GREEN** — Wrap `processPayment()` in try/catch. Same pattern.
- [x] 3.5 🟢 **GREEN** — Wrap `refundPayment()` in try/catch. Same pattern.
- [x] 3.6 🟢 **GREEN** — Wrap `getPaymentMethods()` in try/catch. Same pattern.
- [x] 3.7 ✅ **VERIFY** — `cd backend && pnpm test` — all MercadoPagoService tests pass.

---

## Final Verification

- [x] F.1 `cd backend && pnpm test` — 877 passing, 0 failures ✅
- [x] F.2 `grep -c "try {" backend/src/services/R2Service.ts` = 3 ✅
- [x] F.3 `grep -c "try {" backend/src/services/QRService.ts` = 5 ✅
- [x] F.4 `grep -c "try {" backend/src/services/MercadoPagoService.ts` = 5 ✅
