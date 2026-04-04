/**
 * @fileoverview GiftCardRedeem Component - Validate and redeem gift cards at checkout
 * @description Code input, validation preview, and redeem flow for gift cards
 *              Input de código, preview de validación y flujo de canje de gift cards
 * @module components/Checkout/GiftCardRedeem
 * @author MLM Platform
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gift,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  CreditCard,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useGiftCardRedeem } from '../../stores/giftCardStore';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { GiftCardValidateResponse, GiftCardTransactionResponse } from '../../types';

/**
 * GiftCardRedeem component props
 * Props del componente GiftCardRedeem
 */
interface GiftCardRedeemProps {
  orderId?: string;
  onRedeem?: (transaction: GiftCardTransactionResponse) => void;
  onError?: (error: Error) => void;
  className?: string;
}

/**
 * Map validation rejection reasons to user-friendly messages
 * Mapear razones de rechazo a mensajes amigables
 */
function getReasonMessage(
  reason: GiftCardValidateResponse['reason'],
  t: (key: string) => string
): string {
  switch (reason) {
    case 'NOT_FOUND':
      return t('giftCards.notFound') || 'Gift card not found';
    case 'ALREADY_REDEEMED':
      return t('giftCards.alreadyRedeemed') || 'This gift card has already been redeemed';
    case 'EXPIRED':
      return t('giftCards.expired') || 'This gift card has expired';
    case 'INACTIVE':
      return t('giftCards.inactive') || 'This gift card is inactive';
    default:
      return t('giftCards.invalidCard') || 'Invalid gift card';
  }
}

/**
 * Format a date string for display
 * Formatea una fecha para mostrar
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * GiftCardRedeem - Validate and redeem gift cards during checkout
 * GiftCardRedeem - Validar y canjear gift cards durante checkout
 */
export function GiftCardRedeem({ orderId, onRedeem, onError, className }: GiftCardRedeemProps) {
  const { t } = useTranslation();
  const {
    validationResult,
    lastTransaction,
    isValidating,
    isRedeeming,
    validateError,
    redeemError,
    validateCode,
    redeemCard,
    clearValidation,
    clearErrors,
  } = useGiftCardRedeem();

  // Form state
  const [code, setCode] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  /**
   * Handle code input change
   * Maneja cambio del input de código
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setCode(value);
    if (inputError) setInputError(null);
    if (validateError) clearErrors();
    // Clear previous validation when user types a new code
    if (validationResult) clearValidation();
  };

  /**
   * Handle code validation
   * Maneja validación del código
   */
  const handleValidate = async () => {
    if (!code) {
      setInputError(t('giftCards.enterCode') || 'Please enter a gift card code');
      return;
    }

    try {
      await validateCode(code);
    } catch {
      // Error is already in the store via validateError
    }
  };

  /**
   * Handle key press for enter-to-validate
   * Maneja tecla enter para validar
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidate();
    }
  };

  /**
   * Handle gift card redemption
   * Maneja el canje de la gift card
   */
  const handleRedeem = async () => {
    if (!validationResult?.card?.id) return;

    try {
      const transaction = await redeemCard(validationResult.card.id, orderId);
      toast.success(t('giftCards.redeemSuccess') || 'Gift card redeemed successfully!');
      setCode('');
      onRedeem?.(transaction);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to redeem gift card');
      toast.error(errorObj.message);
      onError?.(errorObj);
    }
  };

  /**
   * Reset the form to start over
   * Resetear el formulario para empezar de nuevo
   */
  const handleReset = () => {
    setCode('');
    setInputError(null);
    clearValidation();
    clearErrors();
  };

  const isValid = validationResult?.isValid === true;
  const isInvalid = validationResult !== null && !validationResult.isValid;
  const hasError = !!inputError || !!validateError;

  return (
    <Card className={cn('border-slate-700 bg-slate-800', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Gift className="h-5 w-5 text-purple-400" />
          {t('giftCards.redeemTitle') || 'Redeem Gift Card'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Success state — show transaction details */}
        {lastTransaction ? (
          <div className="space-y-4" data-testid="redeem-success">
            <div className="rounded-lg bg-emerald-900/30 border border-emerald-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <p className="font-medium text-emerald-300">
                  {t('giftCards.redeemSuccess') || 'Gift card redeemed successfully!'}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t('giftCards.transactionId') || 'Transaction ID'}
                  </span>
                  <span className="font-mono text-slate-200 text-xs">
                    {lastTransaction.id.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t('giftCards.amountRedeemed') || 'Amount Redeemed'}
                  </span>
                  <span className="font-semibold text-emerald-300">
                    ${Number(lastTransaction.amountRedeemed).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('giftCards.status') || 'Status'}</span>
                  <Badge variant="outline" className="border-emerald-600 text-emerald-400 text-xs">
                    {lastTransaction.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white"
              onClick={handleReset}
            >
              <Gift className="h-4 w-4 mr-2" />
              {t('giftCards.redeemAnother') || 'Redeem Another'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Code input */}
            <div>
              <Label htmlFor="gc-code" className="text-slate-300">
                {t('giftCards.codeLabel') || 'Gift Card Code'}
              </Label>
              <div className="relative mt-1.5">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  id="gc-code"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder={t('giftCards.codePlaceholder') || 'Enter gift card code or ID'}
                  className={cn(
                    'pl-10 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500',
                    'focus:border-purple-500 focus:ring-purple-500',
                    hasError && 'border-red-500'
                  )}
                  disabled={isValidating || isRedeeming}
                  aria-label={t('giftCards.codeInputLabel') || 'Gift card code input'}
                  aria-describedby="gc-code-error"
                />
              </div>
            </div>

            {/* Error messages */}
            {hasError && (
              <div
                id="gc-code-error"
                className="flex items-center gap-2 text-sm text-red-400"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{inputError || validateError}</span>
              </div>
            )}

            {/* Validate button (show when no validation result yet) */}
            {!validationResult && (
              <Button
                type="button"
                onClick={handleValidate}
                disabled={!code || isValidating}
                className={cn(
                  'w-full',
                  code && !isValidating
                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                )}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('giftCards.validating') || 'Validating...'}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {t('giftCards.validateCard') || 'Validate Card'}
                  </>
                )}
              </Button>
            )}

            {/* Validation result — Invalid card */}
            {isInvalid && (
              <div
                className="rounded-lg bg-red-900/30 border border-red-700 p-4"
                data-testid="validation-invalid"
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-400 shrink-0" />
                  <p className="text-sm font-medium text-red-300">
                    {getReasonMessage(validationResult?.reason, t)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-700 text-red-300 hover:bg-red-900/50"
                  onClick={handleReset}
                >
                  {t('giftCards.tryAnother') || 'Try Another Code'}
                </Button>
              </div>
            )}

            {/* Validation result — Valid card preview */}
            {isValid && validationResult?.card && (
              <div
                className="rounded-lg bg-slate-900 border border-slate-600 p-4 space-y-3"
                data-testid="validation-valid"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-300">
                    {t('giftCards.cardVerified') || 'Card Verified'}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('giftCards.code') || 'Code'}</span>
                    <span className="font-mono font-medium text-purple-300">
                      {validationResult.card.code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('giftCards.balance') || 'Balance'}</span>
                    <span className="font-semibold text-slate-100">
                      ${Number(validationResult.card.balance).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('giftCards.status') || 'Status'}</span>
                    <Badge
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 text-xs"
                    >
                      {validationResult.card.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{t('giftCards.expiresAt') || 'Expires'}</span>
                    <span className="flex items-center gap-1 text-slate-300 text-xs">
                      <Clock className="h-3 w-3" />
                      {formatDate(validationResult.card.expiresAt)}
                    </span>
                  </div>
                </div>

                {/* Redeem / Cancel buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                    onClick={handleReset}
                    disabled={isRedeeming}
                  >
                    {t('giftCards.cancel') || 'Cancel'}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                  >
                    {isRedeeming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('giftCards.redeeming') || 'Redeeming...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('giftCards.redeemNow') || 'Redeem Now'}
                      </>
                    )}
                  </Button>
                </div>

                {/* Redeem error */}
                {redeemError && (
                  <div className="flex items-center gap-2 text-sm text-red-400" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{redeemError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GiftCardRedeem;
