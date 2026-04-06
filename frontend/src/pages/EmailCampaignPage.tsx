/**
 * @fileoverview EmailCampaignPage - Main page for email campaign management
 * @description Top-level page with tabs for Campaign Dashboard, Create Campaign,
 *              Email Builder, Campaign Monitor, and Delivery Logs.
 *              Página principal con tabs para Dashboard de campañas, Crear campaña,
 *              Email Builder, Monitor de campaña y Logs de entrega.
 * @module pages/EmailCampaignPage
 * @author Nexo Real Development Team
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CampaignDashboard } from '../components/EmailCampaigns/CampaignDashboard';
import { CampaignCreateForm } from '../components/EmailCampaigns/CampaignCreateForm';
import { CampaignMonitor } from '../components/EmailCampaigns/CampaignMonitor';
import { CampaignLogsTable } from '../components/EmailCampaigns/CampaignLogsTable';
import { EmailBuilder } from '../components/EmailBuilder/EmailBuilder';
import type { EmailCampaign } from '../types';

// ============================================
// Types / Tipos
// ============================================

type PageView =
  | { type: 'dashboard' }
  | { type: 'create' }
  | { type: 'builder' }
  | { type: 'monitor'; campaignId: string }
  | { type: 'logs'; campaignId: string };

// ============================================
// Component / Componente
// ============================================

/**
 * EmailCampaignPage - Main email campaign management page
 * EmailCampaignPage - Página principal de gestión de campañas de email
 */
export function EmailCampaignPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('campaigns');
  const [pageView, setPageView] = useState<PageView>({ type: 'dashboard' });

  // ==========================================
  // Navigation handlers / Manejadores de navegación
  // ==========================================

  const handleCreateCampaign = () => {
    setPageView({ type: 'create' });
    setActiveTab('campaigns');
  };

  const handleSelectCampaign = (campaign: EmailCampaign) => {
    setPageView({ type: 'monitor', campaignId: campaign.id });
    setActiveTab('campaigns');
  };

  const handleViewLogs = (campaignId: string) => {
    setPageView({ type: 'logs', campaignId });
    setActiveTab('campaigns');
  };

  const handleBackToDashboard = () => {
    setPageView({ type: 'dashboard' });
  };

  const handleCampaignCreated = () => {
    setPageView({ type: 'dashboard' });
  };

  const handleTemplateSaved = () => {
    setActiveTab('campaigns');
    setPageView({ type: 'create' });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'campaigns') {
      setPageView({ type: 'dashboard' });
    } else if (value === 'builder') {
      setPageView({ type: 'builder' });
    }
  };

  // ==========================================
  // Render Campaign Tab Content / Contenido del tab de campañas
  // ==========================================

  const renderCampaignContent = () => {
    switch (pageView.type) {
      case 'create':
        return (
          <CampaignCreateForm onCreated={handleCampaignCreated} onBack={handleBackToDashboard} />
        );
      case 'monitor':
        return (
          <CampaignMonitor
            campaignId={pageView.campaignId}
            onBack={handleBackToDashboard}
            onViewLogs={handleViewLogs}
          />
        );
      case 'logs':
        return (
          <div className="space-y-4">
            <button
              onClick={() => setPageView({ type: 'monitor', campaignId: pageView.campaignId })}
              className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              ← {t('emailCampaigns.backToMonitor') || 'Back to Monitor'}
            </button>
            <CampaignLogsTable campaignId={pageView.campaignId} />
          </div>
        );
      case 'dashboard':
      default:
        return (
          <CampaignDashboard
            onCreateCampaign={handleCreateCampaign}
            onSelectCampaign={handleSelectCampaign}
          />
        );
    }
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8" data-testid="email-campaign-page">
      {/* Page Header / Encabezado de página */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
            <Mail className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {t('emailCampaigns.pageTitle') || 'Email Marketing'}
          </h1>
        </div>
        <p className="text-sm text-slate-400 ml-[52px]">
          {t('emailCampaigns.pageSubtitle') ||
            'Build templates, create campaigns, and track performance'}
        </p>
      </div>

      {/* Main Tabs / Tabs principales */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700 mb-6">
          <TabsTrigger
            value="campaigns"
            className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-testid="page-tab-campaigns"
          >
            <Mail className="h-4 w-4" />
            {t('emailCampaigns.tabCampaigns') || 'Campaigns'}
          </TabsTrigger>
          <TabsTrigger
            value="builder"
            className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-testid="page-tab-builder"
          >
            {t('emailCampaigns.tabBuilder') || 'Email Builder'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">{renderCampaignContent()}</TabsContent>

        <TabsContent value="builder">
          <EmailBuilder onSave={handleTemplateSaved} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EmailCampaignPage;
