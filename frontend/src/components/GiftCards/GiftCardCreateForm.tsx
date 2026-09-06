/**
 * @fileoverview GiftCardCreateForm Component - Admin form for creating gift cards
 * @description Form with amount, expiry days, and QR code display on success
 *              Formulario con monto, días de expiración y visualización de QR al crear
 * @module components/GiftCards/GiftCardCreateForm
 * @author Nexo Real Development Team
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gift,
  Loader2,
  AlertCircle,
  Download,
  Copy,
  CheckCircle,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGiftCardCreate } from '../../stores/giftCardStore';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { GiftCardResponse } from '../../types';

/**
 * GiftCardCreateForm component props
 * Props del componente GiftCardCreateForm
 */
interface GiftCardCreateFormProps {
  onSuccess?: (card: GiftCardResponse) => void;
  onError?: (error: Error) => void;
}

/** Valid currencies / Monedas válidas */
const CURRENCIES = ['USD', 'EUR', 'ARS'] as const;

/** Default expiry days / Días de expiración por defecto */
const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Format a date string for display
 * Formatea una fecha para mostrar
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * GiftCardCreateForm - Admin form for creating gift cards with QR display
 * GiftCardCreateForm - Formulario admin para crear gift cards con visualización QR
 */
export function GiftCardCreateForm({ onSuccess, onError }: GiftCardCreateFormProps) {
  const { t } = useTranslation();
  const { isCreating, createError, createCard, clearErrors } = useGiftCardCreate();

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [expiryDays, setExpiryDays] = useState<string>(String(DEFAULT_EXPIRY_DAYS));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdCard, setCreatedCard] = useState<GiftCardResponse | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Validate form inputs
   * Validar inputs del formulario
   */
  const validateForm = (): string | null => {
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount)) {
      return t('giftCards.enterAmount') || 'Please enter an amount';
    }

    if (parsedAmount <= 0) {
      return t('giftCards.amountMustBePositive') || 'Amount must be greater than 0';
    }

    if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
      return t('giftCards.invalidCurrency') || 'Please select a valid currency';
    }

    const parsedDays = parseInt(expiryDays, 10);
    if (!expiryDays || isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
      return t('giftCards.invalidExpiryDays') || 'Expiry days must be between 1 and 365';
    }

    return null;
  };

  /**
   * Handle amount input change
   * Maneja cambio de input de monto
   */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !/^\d*\.?\d{0,2}$/.test(value)) return;
    setAmount(value);
    if (validationError) setValidationError(null);
    if (createError) clearErrors();
  };

  /**
   * Handle expiry days input change
   * Maneja cambio de días de expiración
   */
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !/^\d{0,3}$/.test(value)) return;
    setExpiryDays(value);
    if (validationError) setValidationError(null);
  };

  /**
   * Handle form submission
   * Maneja envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      const card = await createCard(parseFloat(amount), parseInt(expiryDays, 10));
      setCreatedCard(card);
      setAmount('');
      setExpiryDays(String(DEFAULT_EXPIRY_DAYS));
      toast.success(t('giftCards.createSuccess') || 'Gift card created successfully!');
      onSuccess?.(card);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to create gift card');
      toast.error(errorObj.message);
      onError?.(errorObj);
    }
  };

  /**
   * Download QR code image
   * Descargar imagen de código QR
   */
  const handleDownloadQR = () => {
    if (!createdCard?.qrCodeData) return;

    const link = document.createElement('a');
    link.href = createdCard.qrCodeData;
    link.download = `gift-card-${createdCard.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Copy gift card link to clipboard
   * Copiar link de gift card al portapapeles
   */
  const handleCopyLink = async () => {
    if (!createdCard?.code) return;

    const link = `${window.location.origin}/q/${createdCard.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t('giftCards.linkCopied') || 'Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('giftCards.copyFailed') || 'Failed to copy link');
    }
  };

  /**
   * Reset form to create another card
   * Resetear formulario para crear otra tarjeta
   */
  const handleCreateAnother = () => {
    setCreatedCard(null);
    clearErrors();
  };

  const canSubmit = parseFloat(amount) > 0 && !isCreating;

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[var(--color-foreground)]">
          <Gift className="h-5 w-5 text-emerald-400" />
          {t('giftCards.createTitle') || 'Create Gift Card'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Success panel — show created card details */}
        {createdCard ? (
          <div className="space-y-4" data-testid="card-details">
            <div className="rounded-lg bg-emerald-900/30 border border-emerald-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <p className="font-medium text-emerald-300">
                  {t('giftCards.cardCreated') || 'Gift card created successfully!'}
                </p>
              </div>

              {/* Card details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-foreground-muted)]">{t('giftCards.cardId') || 'Card ID'}</span>
                  <span className="font-mono text-[var(--color-foreground-muted)] text-xs">
                    {createdCard.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-foreground-muted)]">{t('giftCards.code') || 'Code'}</span>
                  <span className="font-mono font-medium text-emerald-300">{createdCard.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-foreground-muted)]">{t('giftCards.balance') || 'Balance'}</span>
                  <span className="font-semibold text-[var(--color-foreground)]">
                    ${Number(createdCard.balance).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-foreground-muted)]">{t('giftCards.status') || 'Status'}</span>
                  <span className="capitalize text-emerald-400">{createdCard.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-foreground-muted)]">{t('giftCards.expiresAt') || 'Expires'}</span>
                  <span className="text-[var(--color-foreground-muted)]">{formatDate(createdCard.expiresAt)}</span>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {createdCard.qrCodeData && (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={createdCard.qrCodeData}
                  alt={t('giftCards.qrCode') || 'Gift Card QR Code'}
                  className="w-48 h-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-2"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {createdCard.qrCodeData && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:bg-[var(--color-card)]"
                  onClick={handleDownloadQR}
                  aria-label={t('giftCards.downloadQR') || 'Download QR Code'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('giftCards.downloadQR') || 'Download QR'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[var(--color-border)] text-[var(--color-foreground-muted)] hover:bg-[var(--color-card)]"
                onClick={handleCopyLink}
                aria-label={t('giftCards.copyLink') || 'Copy Link'}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied
                  ? t('giftCards.copied') || 'Copied!'
                  : t('giftCards.copyLink') || 'Copy Link'}
              </Button>
            </div>

            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              onClick={handleCreateAnother}
            >
              <Gift className="h-4 w-4 mr-2" />
              {t('giftCards.createAnother') || 'Create Another'}
            </Button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount input */}
            <div>
              <Label htmlFor="gc-amount" className="text-[var(--color-foreground-subtle)]">
                {t('giftCards.amount') || 'Amount'}
              </Label>
              <div className="relative mt-1.5">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-foreground-muted)]" />
                <Input
                  type="text"
                  id="gc-amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className={cn(
                    'pl-10 bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)]',
                    'focus:border-emerald-500 focus:ring-emerald-500'
                  )}
                  disabled={isCreating}
                  aria-label={t('giftCards.amountLabel') || 'Gift card amount'}
                  aria-describedby="gc-amount-error"
                />
              </div>
            </div>

            {/* Currency select */}
            <div>
              <Label htmlFor="gc-currency" className="text-[var(--color-foreground-subtle)]">
                {t('giftCards.currency') || 'Currency'}
              </Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isCreating}>
                <SelectTrigger
                  id="gc-currency"
                  className="mt-1.5 bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-foreground)]"
                  aria-label={t('giftCards.currencyLabel') || 'Select currency'}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--color-card)] border-[var(--color-border)]">
                  {CURRENCIES.map((cur) => (
                    <SelectItem key={cur} value={cur} className="text-[var(--color-foreground-muted)]">
                      {cur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expiry days input */}
            <div>
              <Label htmlFor="gc-expiry" className="text-[var(--color-foreground-subtle)]">
                {t('giftCards.expiryDays') || 'Expiry Days'}
              </Label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-foreground-muted)]" />
                <Input
                  type="text"
                  id="gc-expiry"
                  value={expiryDays}
                  onChange={handleExpiryChange}
                  placeholder="30"
                  className={cn(
                    'pl-10 bg-[var(--color-card)] border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)]',
                    'focus:border-emerald-500 focus:ring-emerald-500'
                  )}
                  disabled={isCreating}
                  aria-label={t('giftCards.expiryLabel') || 'Days until expiration'}
                  aria-describedby="gc-expiry-hint"
                />
              </div>
              <p id="gc-expiry-hint" className="mt-1 text-xs text-[var(--color-foreground-muted)]">
                {t('giftCards.expiryHint') || 'Between 1 and 365 days'}
              </p>
            </div>

            {/* Validation error */}
            {(validationError || createError) && (
              <div
                id="gc-amount-error"
                className="flex items-center gap-2 text-sm text-red-400"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{validationError || createError}</span>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'w-full',
                canSubmit
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-[var(--color-card)] text-[var(--color-foreground-muted)] cursor-not-allowed'
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('giftCards.creating') || 'Creating...'}
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  {t('giftCards.createCard') || 'Create Gift Card'}
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default GiftCardCreateForm;
