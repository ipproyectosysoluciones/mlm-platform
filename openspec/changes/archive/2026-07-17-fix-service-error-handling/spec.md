# Spec: Fix Service Error Handling

## Requirements

### REQ-1: Try/catch on all async service methods
Every async method in R2Service, QRService, and MercadoPagoService MUST have a try/catch block wrapping its implementation.

### REQ-2: Error logging
On catch, the service MUST log the error via `logger.error` with:
- Service name as context (e.g., `R2Service.uploadImage`)
- Error message and stack trace

### REQ-3: Error rethrowing
On catch, the service MUST rethrow the error (or a typed wrapper) so upstream callers can handle it. The error MUST NOT be silently swallowed.

### REQ-4: No behavior change
The try/catch MUST NOT change the method's return type, success path behavior, or public API contract. It adds observability, not new logic.

## Scenarios

### S-1: R2Service.uploadImage succeeds
- Input: valid UploadImageParams
- Expected: returns uploaded image URL (unchanged behavior)

### S-2: R2Service.uploadImage fails (S3 error)
- Input: params causing S3 to throw
- Expected: error logged via logger.error, error rethrown to caller

### S-3: QRService.generateQRDataUrl succeeds
- Input: valid referral code
- Expected: returns data URL (unchanged behavior)

### S-4: QRService.generateQRDataUrl fails (invalid input)
- Input: null/undefined referral code
- Expected: error logged, error rethrown

### S-5: MercadoPagoService.createPreference succeeds
- Input: valid MercadoPagoPreference
- Expected: returns CreatePreferenceResult (unchanged behavior)

### S-6: MercadoPagoService.createPreference fails (API error)
- Input: preference causing MercadoPago API to throw
- Expected: error logged, error rethrown with context

### S-7: MercadoPagoService.refundPayment fails
- Input: invalid payment ID
- Expected: error logged, error rethrown

## Affected Services

| Service | File | Async Methods | Current State |
|---------|------|---------------|---------------|
| R2Service | `backend/src/services/R2Service.ts` | 3 | Zero try/catch |
| QRService | `backend/src/services/QRService.ts` | 5 | Zero try/catch |
| MercadoPagoService | `backend/src/services/MercadoPagoService.ts` | 5 | Zero try/catch |
