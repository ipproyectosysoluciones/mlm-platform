/**
 * @fileoverview TwoFactor Page - 2FA Management UI
 * @description Page for managing Two-Factor Authentication settings
 * @module pages/TwoFactor
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  Key,
} from 'lucide-react';
import {
  twoFactorService,
  type TwoFactorStatus,
  type TwoFactorSetupResponse,
  type TwoFactorVerifySetupResponse,
} from '../services/twoFactorService';

/**
 * TwoFactor page component
 * Componente de página para gestión de 2FA
 */
export default function TwoFactor() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup state
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Disable state
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);

  // Recovery codes display
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Fetch 2FA status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  /**
   * Fetch current 2FA status
   * Obtiene el estado actual de 2FA
   */
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await twoFactorService.getStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('twoFactor.errorFetching'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start 2FA setup
   * Inicia la configuración de 2FA
   */
  const handleStartSetup = async () => {
    try {
      setIsSettingUp(true);
      setError(null);
      setSuccess(null);
      const data = await twoFactorService.setup();
      setSetupData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('twoFactor.errorSetup'));
    } finally {
      setIsSettingUp(false);
    }
  };

  /**
   * Verify setup code and enable 2FA
   * Verifica el código y habilita 2FA
   */
  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      setError(t('twoFactor.invalidCode'));
      return;
    }

    try {
      setSetupLoading(true);
      setError(null);
      const data: TwoFactorVerifySetupResponse =
        await twoFactorService.verifySetup(verificationCode);
      setSuccess(t('twoFactor.enabledSuccess'));
      setRecoveryCodes(data.recoveryCodes);
      // Refresh status
      await fetchStatus();
      // Clear setup state
      setSetupData(null);
      setVerificationCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('twoFactor.invalidCode'));
    } finally {
      setSetupLoading(false);
    }
  };

  /**
   * Disable 2FA
   * Deshabilita 2FA
   */
  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      setError(t('twoFactor.invalidCode'));
      return;
    }

    try {
      setDisableLoading(true);
      setError(null);
      await twoFactorService.disable(disableCode);
      setSuccess(t('twoFactor.disabledSuccess'));
      // Refresh status
      await fetchStatus();
      // Clear disable state
      setIsDisabling(false);
      setDisableCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('twoFactor.invalidCode'));
    } finally {
      setDisableLoading(false);
    }
  };

  /**
   * Copy recovery code to clipboard
   * Copia código de recuperación al portapapeles
   */
  const copyRecoveryCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setError(t('twoFactor.copyFailed'));
    }
  };

  /**
   * Cancel setup
   * Cancela la configuración
   */
  const handleCancelSetup = () => {
    setSetupData(null);
    setVerificationCode('');
    setError(null);
  };

  /**
   * Close recovery codes view
   * Cierra la vista de códigos de recuperación
   */
  const handleCloseRecoveryCodes = () => {
    setRecoveryCodes(null);
  };

  /**
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  /**
   * Show recovery codes after successful setup
   */
  if (recoveryCodes) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {t('twoFactor.recoveryCodesTitle')}
              </h1>
              <p className="text-slate-600 text-sm">{t('twoFactor.recoveryCodesSubtitle')}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{t('twoFactor.recoveryCodesWarning')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {recoveryCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3"
              >
                <code className="font-mono text-sm text-slate-700">{code}</code>
                <button
                  onClick={() => copyRecoveryCode(code, index)}
                  className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                  title={t('common.copy')}
                >
                  {copiedIndex === index ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleCloseRecoveryCodes}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    );
  }

  /**
   * Main render
   */
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('twoFactor.title')}</h1>
            <p className="text-slate-600 text-sm">{t('twoFactor.subtitle')}</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* 2FA Disabled - Show enable button */}
        {!status?.enabled && !setupData && !isDisabling && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {t('twoFactor.disabledTitle')}
            </h2>
            <p className="text-slate-600 mb-6">{t('twoFactor.disabledDescription')}</p>
            <button
              onClick={handleStartSetup}
              disabled={isSettingUp}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettingUp ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  {t('twoFactor.enable')}
                </>
              )}
            </button>
          </div>
        )}

        {/* Setup in progress - Show QR and verification */}
        {setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {t('twoFactor.setupTitle')}
              </h2>
              <p className="text-slate-600 text-sm">{t('twoFactor.setupDescription')}</p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 border border-slate-200 rounded-lg">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-slate-500 mt-2">{t('twoFactor.scanWithApp')}</p>
            </div>

            {/* Manual secret */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  {t('twoFactor.manualSecret')}
                </span>
              </div>
              <code className="text-xs text-slate-600 break-all">{setupData.secret}</code>
            </div>

            {/* Verification input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('twoFactor.enterCode')}
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelSetup}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleVerifySetup}
                disabled={verificationCode.length !== 6 || setupLoading}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {setupLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  t('twoFactor.verifyAndEnable')
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 text-center">
              {t('twoFactor.expiresIn', { minutes: Math.floor(setupData.expiresIn / 60) })}
            </p>
          </div>
        )}

        {/* 2FA Enabled - Show disable option */}
        {status?.enabled && !setupData && !isDisabling && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {t('twoFactor.enabledTitle')}
            </h2>
            <p className="text-slate-600 mb-2">
              {t('twoFactor.enabledDescription', {
                date: status.enabledAt ? new Date(status.enabledAt).toLocaleDateString() : '',
              })}
            </p>
            <p className="text-xs text-slate-500 mb-6">
              {t('twoFactor.method', { method: status.method?.toUpperCase() || 'TOTP' })}
            </p>
            <button
              onClick={() => setIsDisabling(true)}
              className="inline-flex items-center gap-2 px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <ShieldOff className="w-5 h-5" />
              {t('twoFactor.disable')}
            </button>
          </div>
        )}

        {/* Disable confirmation */}
        {isDisabling && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                {t('twoFactor.disableTitle')}
              </h2>
              <p className="text-slate-600 text-sm">{t('twoFactor.disableDescription')}</p>
            </div>

            {/* Disable input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('twoFactor.enterCodeToDisable')}
              </label>
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-slate-500 mt-2">{t('twoFactor.useRecoveryCode')}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsDisabling(false);
                  setDisableCode('');
                  setError(null);
                }}
                className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDisable}
                disabled={disableCode.length !== 6 || disableLoading}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disableLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  t('twoFactor.confirmDisable')
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
