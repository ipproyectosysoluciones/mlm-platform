/**
 * @fileoverview CampaignDashboard Component - Email campaign list with status tabs
 * @description Lists all email campaigns with Draft/Scheduled/Active/Completed tab filters,
 *              campaign stats summary, and quick actions.
 *              Lista todas las campañas de email con filtros de estado por tabs,
 *              resumen de estadísticas y acciones rápidas.
 * @module components/EmailCampaigns/CampaignDashboard
 * @author MLM Platform
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  Pause,
  AlertTriangle,
  Loader2,
  Users,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useEmailCampaigns } from '../../stores/emailCampaignStore';
import type { EmailCampaignStatus, EmailCampaign } from '../../types';

// ============================================
// Types / Tipos
// ============================================

/**
 * CampaignDashboard props
 * Props del CampaignDashboard
 */
interface CampaignDashboardProps {
  /** Callback when "Create Campaign" is clicked / Callback al hacer clic en "Crear Campaña" */
  onCreateCampaign?: () => void;
  /** Callback when a campaign is selected for monitoring / Callback al seleccionar campaña */
  onSelectCampaign?: (campaign: EmailCampaign) => void;
}

// ============================================
// Constants / Constantes
// ============================================

/** Tab configuration / Configuración de tabs */
const STATUS_TABS: Array<{
  value: EmailCampaignStatus | 'all';
  label: string;
  icon: React.ElementType;
}> = [
  { value: 'all', label: 'All', icon: Mail },
  { value: 'draft', label: 'Draft', icon: Clock },
  { value: 'scheduled', label: 'Scheduled', icon: Clock },
  { value: 'sending', label: 'Active', icon: Send },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'paused', label: 'Paused', icon: Pause },
  { value: 'failed', label: 'Failed', icon: AlertTriangle },
];

/** Status badge color mapping / Mapeo de colores de badge por estado */
const STATUS_BADGE_COLORS: Record<EmailCampaignStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  sending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  paused: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
};

// ============================================
// Helpers / Ayudantes
// ============================================

/**
 * Format a date string to locale display
 * Formatear un string de fecha para visualización local
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate delivery rate percentage
 * Calcular porcentaje de tasa de entrega
 */
function calcDeliveryRate(campaign: EmailCampaign): string {
  if (!campaign.recipientCount || campaign.recipientCount === 0) return '0%';
  const rate = (campaign.sentCount / campaign.recipientCount) * 100;
  return `${rate.toFixed(1)}%`;
}

// ============================================
// Component / Componente
// ============================================

/**
 * CampaignDashboard - Lists campaigns with status tabs and quick stats
 * CampaignDashboard - Lista campañas con tabs de estado y estadísticas rápidas
 */
export function CampaignDashboard({ onCreateCampaign, onSelectCampaign }: CampaignDashboardProps) {
  const { t } = useTranslation();
  const { campaigns, activeTab, isLoading, error, fetchCampaigns, setActiveTab } =
    useEmailCampaigns();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch campaigns on mount / Obtener campañas al montar
  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle tab change / Manejar cambio de tab
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value as EmailCampaignStatus | 'all');
  };

  /**
   * Handle refresh / Manejar refresco
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const status = activeTab === 'all' ? undefined : activeTab;
    await fetchCampaigns(status);
    setIsRefreshing(false);
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="space-y-6" data-testid="campaign-dashboard">
      {/* Header / Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
            <Mail className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {t('emailCampaigns.title') || 'Email Campaigns'}
            </h2>
            <p className="text-sm text-slate-400">
              {t('emailCampaigns.subtitle') || 'Manage and monitor your email campaigns'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
            aria-label={t('emailCampaigns.refresh') || 'Refresh campaigns'}
            data-testid="refresh-campaigns"
          >
            <RefreshCw className={cn('h-4 w-4', (isRefreshing || isLoading) && 'animate-spin')} />
          </Button>

          <Button
            onClick={onCreateCampaign}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
            data-testid="create-campaign-btn"
          >
            <Plus className="h-4 w-4" />
            {t('emailCampaigns.create') || 'New Campaign'}
          </Button>
        </div>
      </div>

      {/* Error alert / Alerta de error */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          data-testid="campaign-error"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs / Pestañas */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700 flex-wrap h-auto gap-1 p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'gap-1.5 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white',
                'text-slate-400 hover:text-slate-200'
              )}
              data-testid={`tab-${tab.value}`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {t(`emailCampaigns.tab.${tab.value}`) || tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab content - all use the same campaign list */}
        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {isLoading ? (
              <div
                className="flex items-center justify-center py-16"
                data-testid="campaigns-loading"
              >
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                  <p className="text-sm text-slate-400">
                    {t('emailCampaigns.loading') || 'Loading campaigns...'}
                  </p>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 text-center"
                data-testid="campaigns-empty"
              >
                <Mail className="h-12 w-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-1">
                  {t('emailCampaigns.emptyTitle') || 'No campaigns yet'}
                </h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md">
                  {t('emailCampaigns.emptyDescription') ||
                    'Create your first email campaign to start reaching your audience.'}
                </p>
                <Button
                  onClick={onCreateCampaign}
                  className="bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  {t('emailCampaigns.createFirst') || 'Create Campaign'}
                </Button>
              </div>
            ) : (
              <div className="grid gap-4" data-testid="campaigns-list">
                {campaigns.map((campaign) => (
                  <Card
                    key={campaign.id}
                    className="border-slate-700 bg-slate-800 hover:border-purple-500/30 transition-colors cursor-pointer"
                    onClick={() => onSelectCampaign?.(campaign)}
                    data-testid={`campaign-card-${campaign.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Campaign info / Info de campaña */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-100 truncate">
                              {campaign.name}
                            </h3>
                            <Badge
                              className={cn('text-xs border', STATUS_BADGE_COLORS[campaign.status])}
                            >
                              {campaign.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {campaign.recipientCount} recipients
                            </span>
                            <span className="flex items-center gap-1">
                              <Send className="h-3.5 w-3.5" />
                              {campaign.sentCount} sent
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3.5 w-3.5" />
                              {calcDeliveryRate(campaign)}
                            </span>
                            <span className="text-slate-500">
                              {formatDate(campaign.scheduledFor || campaign.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default CampaignDashboard;
