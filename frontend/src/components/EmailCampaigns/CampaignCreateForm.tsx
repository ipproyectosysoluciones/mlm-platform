/**
 * @fileoverview CampaignCreateForm Component - Create a new email campaign
 * @description Form to select template, recipient segment, optional scheduling,
 *              and name for a new email campaign.
 *              Formulario para seleccionar plantilla, segmento de destinatarios,
 *              programación opcional y nombre para una nueva campaña de email.
 * @module components/EmailCampaigns/CampaignCreateForm
 * @author Nexo Real Development Team
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Clock, Loader2, AlertCircle, ArrowLeft, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useEmailCampaigns, useEmailTemplates } from '../../stores/emailCampaignStore';
import type { RecipientSegment, EmailCampaignCreatePayload } from '../../types';

// ============================================
// Types / Tipos
// ============================================

interface CampaignCreateFormProps {
  /** Callback on successful creation / Callback al crear exitosamente */
  onCreated?: () => void;
  /** Callback to go back / Callback para volver */
  onBack?: () => void;
}

// ============================================
// Constants / Constantes
// ============================================

/** Recipient segments with labels / Segmentos de destinatarios con etiquetas */
const RECIPIENT_SEGMENTS: Array<{ value: RecipientSegment; label: string; description: string }> = [
  { value: 'all_users', label: 'All Users', description: 'Send to all active users' },
  { value: 'high_value', label: 'High Value', description: 'Top-tier users by spending' },
  { value: 'new_users', label: 'New Users', description: 'Recently joined users' },
  { value: 'inactive', label: 'Inactive', description: 'Users inactive for 30+ days' },
];

// ============================================
// Component / Componente
// ============================================

/**
 * CampaignCreateForm - Form to create a new email campaign
 * CampaignCreateForm - Formulario para crear una nueva campaña de email
 */
export function CampaignCreateForm({ onCreated, onBack }: CampaignCreateFormProps) {
  const { t } = useTranslation();
  const { templates, fetchTemplates, isLoading: isLoadingTemplates } = useEmailTemplates();
  const { createCampaign, isCreatingCampaign, campaignError, clearErrors } = useEmailCampaigns();

  // Form state / Estado del formulario
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [recipientSegment, setRecipientSegment] = useState<RecipientSegment>('all_users');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch templates on mount / Obtener plantillas al montar
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // Validation / Validación
  // ==========================================

  const validateForm = (): string | null => {
    if (!campaignName.trim()) {
      return t('emailCampaigns.nameRequired') || 'Campaign name is required';
    }
    if (!selectedTemplateId) {
      return t('emailCampaigns.templateRequired') || 'Please select an email template';
    }
    if (scheduleType === 'later' && !scheduledFor) {
      return t('emailCampaigns.scheduleRequired') || 'Please select a scheduled date/time';
    }
    if (scheduleType === 'later' && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        return t('emailCampaigns.scheduleFuture') || 'Scheduled time must be in the future';
      }
    }
    return null;
  };

  // ==========================================
  // Handlers / Manejadores
  // ==========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    try {
      const payload: EmailCampaignCreatePayload = {
        name: campaignName.trim(),
        emailTemplateId: selectedTemplateId,
        recipientSegment,
        scheduledFor: scheduleType === 'later' ? scheduledFor : null,
      };

      await createCampaign(payload);
      toast.success(t('emailCampaigns.created') || 'Campaign created successfully!');
      onCreated?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create campaign';
      toast.error(errorMsg);
    }
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="max-w-2xl mx-auto" data-testid="campaign-create-form">
      {/* Back button / Botón de volver */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-4 text-slate-400 hover:text-slate-200 gap-1.5"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('emailCampaigns.backToList') || 'Back to Campaigns'}
        </Button>
      )}

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Send className="h-5 w-5 text-purple-400" />
            {t('emailCampaigns.createTitle') || 'Create Email Campaign'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campaign Name / Nombre de campaña */}
            <div>
              <Label htmlFor="campaign-name" className="text-slate-300">
                {t('emailCampaigns.campaignName') || 'Campaign Name'}
              </Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => {
                  setCampaignName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="March Newsletter"
                className="mt-1.5 bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500"
                disabled={isCreatingCampaign}
                aria-label={t('emailCampaigns.campaignNameLabel') || 'Campaign name'}
              />
            </div>

            {/* Template Selection / Selección de plantilla */}
            <div>
              <Label className="text-slate-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-400" />
                {t('emailCampaigns.selectTemplate') || 'Email Template'}
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={(value) => {
                  setSelectedTemplateId(value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isCreatingCampaign || isLoadingTemplates}
              >
                <SelectTrigger
                  className="mt-1.5 bg-slate-900 border-slate-600 text-slate-100"
                  aria-label={t('emailCampaigns.templateLabel') || 'Select template'}
                  data-testid="template-select"
                >
                  <SelectValue
                    placeholder={t('emailCampaigns.chooseTpl') || 'Choose a template...'}
                  />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {templates.map((tpl) => (
                    <SelectItem
                      key={tpl.id}
                      value={tpl.id}
                      className="text-slate-100 focus:bg-purple-600/20"
                    >
                      {tpl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingTemplates && (
                <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('emailCampaigns.loadingTemplates') || 'Loading templates...'}
                </p>
              )}
            </div>

            {/* Recipient Segment / Segmento de destinatarios */}
            <div>
              <Label className="text-slate-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                {t('emailCampaigns.recipientSegment') || 'Recipient Segment'}
              </Label>
              <Select
                value={recipientSegment}
                onValueChange={(value) => setRecipientSegment(value as RecipientSegment)}
                disabled={isCreatingCampaign}
              >
                <SelectTrigger
                  className="mt-1.5 bg-slate-900 border-slate-600 text-slate-100"
                  aria-label={t('emailCampaigns.segmentLabel') || 'Select recipient segment'}
                  data-testid="segment-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {RECIPIENT_SEGMENTS.map((seg) => (
                    <SelectItem
                      key={seg.value}
                      value={seg.value}
                      className="text-slate-100 focus:bg-purple-600/20"
                    >
                      <div>
                        <span className="font-medium">{seg.label}</span>
                        <span className="text-slate-400 ml-2 text-xs">— {seg.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule / Programación */}
            <div>
              <Label className="text-slate-300 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {t('emailCampaigns.schedule') || 'Schedule'}
              </Label>
              <div className="mt-1.5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleType('now')}
                  className={cn(
                    'flex-1 border-slate-600',
                    scheduleType === 'now'
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                      : 'text-slate-300 hover:bg-slate-700'
                  )}
                  data-testid="schedule-now"
                >
                  {t('emailCampaigns.sendNow') || 'Send Now'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleType('later')}
                  className={cn(
                    'flex-1 border-slate-600',
                    scheduleType === 'later'
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500'
                      : 'text-slate-300 hover:bg-slate-700'
                  )}
                  data-testid="schedule-later"
                >
                  {t('emailCampaigns.scheduleLater') || 'Schedule Later'}
                </Button>
              </div>
              {scheduleType === 'later' && (
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => {
                    setScheduledFor(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="mt-2 bg-slate-900 border-slate-600 text-slate-100"
                  disabled={isCreatingCampaign}
                  aria-label={t('emailCampaigns.scheduleDateLabel') || 'Schedule date and time'}
                  data-testid="schedule-datetime"
                />
              )}
            </div>

            {/* Validation error / Error de validación */}
            {(validationError || campaignError) && (
              <div
                className="flex items-center gap-2 text-sm text-red-400"
                role="alert"
                data-testid="create-error"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{validationError || campaignError}</span>
              </div>
            )}

            {/* Submit / Enviar */}
            <Button
              type="submit"
              disabled={isCreatingCampaign}
              className={cn(
                'w-full',
                !isCreatingCampaign
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              )}
              data-testid="submit-campaign"
            >
              {isCreatingCampaign ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('emailCampaigns.creating') || 'Creating...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('emailCampaigns.createCampaign') || 'Create Campaign'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CampaignCreateForm;
