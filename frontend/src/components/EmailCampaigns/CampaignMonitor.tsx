/**
 * @fileoverview CampaignMonitor Component - Real-time campaign monitoring with polling
 * @description Shows campaign stats (sent, failed, delivery rate, open rate, click rate)
 *              with 10-second auto-refresh polling. Supports send, retry, and pause actions.
 *              Muestra estadísticas de campaña (enviados, fallidos, tasa de entrega, apertura, clics)
 *              con polling de auto-refresco cada 10 segundos. Soporta acciones de envío, reintento y pausa.
 * @module components/EmailCampaigns/CampaignMonitor
 * @author Nexo Real Development Team
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Play,
  ArrowLeft,
  Users,
  Mail,
  MousePointerClick,
  Eye,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useEmailCampaignMonitor } from '../../stores/emailCampaignStore';

// ============================================
// Types / Tipos
// ============================================

interface CampaignMonitorProps {
  /** Campaign ID to monitor / ID de campaña a monitorear */
  campaignId: string;
  /** Callback to go back / Callback para volver */
  onBack?: () => void;
  /** Callback to view logs / Callback para ver logs */
  onViewLogs?: (campaignId: string) => void;
}

// ============================================
// Stat Card Sub-component / Sub-componente de tarjeta de estadística
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

// ============================================
// Component / Componente
// ============================================

/**
 * CampaignMonitor - Real-time stats with 10s polling
 * CampaignMonitor - Estadísticas en tiempo real con polling de 10s
 */
export function CampaignMonitor({ campaignId, onBack, onViewLogs }: CampaignMonitorProps) {
  const { t } = useTranslation();
  const {
    selectedCampaign,
    isLoading,
    isSending,
    isRetrying,
    campaignError,
    fetchCampaignDetail,
    sendCampaign,
    retryFailed,
    startPolling,
    stopPolling,
  } = useEmailCampaignMonitor();

  // Fetch detail and start polling on mount / Al montar: obtener detalle e iniciar polling
  useEffect(() => {
    fetchCampaignDetail(campaignId);
    startPolling(campaignId, 10_000);

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // ==========================================
  // Handlers / Manejadores
  // ==========================================

  const handleSendNow = async () => {
    try {
      await sendCampaign(campaignId, true);
      toast.success(t('emailCampaigns.sendSuccess') || 'Campaign is now sending!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send';
      toast.error(msg);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const result = await retryFailed(campaignId);
      toast.success(
        `${result.retriedCount} ${t('emailCampaigns.retriedEmails') || 'emails queued for retry'}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to retry';
      toast.error(msg);
    }
  };

  // ==========================================
  // Loading state / Estado de carga
  // ==========================================

  if (isLoading && !selectedCampaign) {
    return (
      <div className="flex items-center justify-center py-16" data-testid="monitor-loading">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-slate-400">
            {t('emailCampaigns.loadingDetails') || 'Loading campaign details...'}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedCampaign) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16"
        data-testid="monitor-not-found"
      >
        <AlertTriangle className="h-12 w-12 text-slate-600 mb-4" />
        <p className="text-slate-400">{t('emailCampaigns.notFound') || 'Campaign not found'}</p>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="mt-4 text-slate-400">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('emailCampaigns.backToList') || 'Back to Campaigns'}
          </Button>
        )}
      </div>
    );
  }

  // ==========================================
  // Computed values / Valores computados
  // ==========================================

  const campaign = selectedCampaign;
  const stats = campaign.stats;
  const progressPercent =
    campaign.recipientCount > 0
      ? Math.round((campaign.sentCount / campaign.recipientCount) * 100)
      : 0;

  const isActive = campaign.status === 'sending';
  const isDraft = campaign.status === 'draft';
  const isCompleted = campaign.status === 'completed';
  const hasFailed = campaign.failedCount > 0;

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6" data-testid="campaign-monitor">
      {/* Back button / Botón de volver */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 gap-1.5"
          data-testid="monitor-back"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('emailCampaigns.backToList') || 'Back to Campaigns'}
        </Button>
      )}

      {/* Campaign Header / Encabezado de campaña */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              {campaign.name}
            </CardTitle>
            <Badge
              className={cn(
                'text-xs border',
                isActive && 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                isDraft && 'bg-slate-500/20 text-slate-300 border-slate-500/30',
                isCompleted && 'bg-green-500/20 text-green-300 border-green-500/30',
                campaign.status === 'failed' && 'bg-red-500/20 text-red-300 border-red-500/30',
                campaign.status === 'paused' &&
                  'bg-orange-500/20 text-orange-300 border-orange-500/30',
                campaign.status === 'scheduled' && 'bg-blue-500/20 text-blue-300 border-blue-500/30'
              )}
            >
              {campaign.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar / Barra de progreso */}
          <div>
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>
                {t('emailCampaigns.progress') || 'Progress'}: {campaign.sentCount} /{' '}
                {campaign.recipientCount}
              </span>
              <span className="font-medium text-slate-200">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" data-testid="send-progress" />
          </div>

          {/* Polling indicator / Indicador de polling */}
          {isActive && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              {t('emailCampaigns.liveUpdates') || 'Live updates every 10s'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid / Grilla de estadísticas */}
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
        data-testid="stats-grid"
      >
        <StatCard
          label={t('emailCampaigns.statSent') || 'Sent'}
          value={stats.sentCount}
          icon={Send}
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          label={t('emailCampaigns.statFailed') || 'Failed'}
          value={stats.failedCount}
          icon={XCircle}
          color="bg-red-500/20 text-red-400"
        />
        <StatCard
          label={t('emailCampaigns.statDelivery') || 'Delivery'}
          value={stats.deliveryRate}
          icon={CheckCircle2}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          label={t('emailCampaigns.statOpened') || 'Opened'}
          value={stats.openRate}
          icon={Eye}
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          label={t('emailCampaigns.statClicks') || 'Clicks'}
          value={stats.clickRate}
          icon={MousePointerClick}
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard
          label={t('emailCampaigns.statRecipients') || 'Recipients'}
          value={campaign.recipientCount}
          icon={Users}
          color="bg-slate-500/20 text-slate-400"
        />
      </div>

      {/* Error alert / Alerta de error */}
      {campaignError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          data-testid="monitor-error"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{campaignError}</span>
        </div>
      )}

      {/* Action buttons / Botones de acción */}
      <div className="flex flex-wrap gap-3">
        {/* Send now (only for draft campaigns) */}
        {isDraft && (
          <Button
            onClick={handleSendNow}
            disabled={isSending}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            data-testid="send-now-btn"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {t('emailCampaigns.sendNow') || 'Send Now'}
          </Button>
        )}

        {/* Retry failed */}
        {hasFailed && (
          <Button
            onClick={handleRetryFailed}
            disabled={isRetrying}
            variant="outline"
            className="border-red-500/30 text-red-300 hover:bg-red-500/10 gap-1.5"
            data-testid="retry-failed-btn"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {t('emailCampaigns.retryFailed') || 'Retry Failed'}
          </Button>
        )}

        {/* View logs */}
        {onViewLogs && (
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-1.5"
            onClick={() => onViewLogs(campaignId)}
            data-testid="view-logs-btn"
          >
            <Mail className="h-4 w-4" />
            {t('emailCampaigns.viewLogs') || 'View Logs'}
          </Button>
        )}
      </div>
    </div>
  );
}

export default CampaignMonitor;
