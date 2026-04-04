/**
 * @fileoverview CampaignLogsTable Component - Delivery logs table for email campaigns
 * @description Shows recipient delivery logs in a table with status badges, error reasons,
 *              retry counts, and pagination.
 *              Muestra logs de entrega de destinatarios en una tabla con badges de estado,
 *              razones de error, conteos de reintentos y paginación.
 * @module components/EmailCampaigns/CampaignLogsTable
 * @author MLM Platform
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useEmailCampaignLogs } from '../../stores/emailCampaignStore';
import type { RecipientLogStatus } from '../../types';

// ============================================
// Types / Tipos
// ============================================

interface CampaignLogsTableProps {
  /** Campaign ID to load logs for / ID de campaña para cargar logs */
  campaignId: string;
}

// ============================================
// Constants / Constantes
// ============================================

const PAGE_SIZE = 20;

/** Log status badge colors / Colores de badge por estado de log */
const LOG_STATUS_COLORS: Record<RecipientLogStatus, string> = {
  pending: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  sent: 'bg-green-500/20 text-green-300 border-green-500/30',
  failed: 'bg-red-500/20 text-red-300 border-red-500/30',
  bounced: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  deferred: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'deferred', label: 'Deferred' },
];

// ============================================
// Helpers / Ayudantes
// ============================================

function formatLogDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

// ============================================
// Component / Componente
// ============================================

/**
 * CampaignLogsTable - Delivery logs table with filtering and pagination
 * CampaignLogsTable - Tabla de logs de entrega con filtrado y paginación
 */
export function CampaignLogsTable({ campaignId }: CampaignLogsTableProps) {
  const { t } = useTranslation();
  const { campaignLogs, logsTotal, isLoadingLogs, error, fetchCampaignLogs } =
    useEmailCampaignLogs();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(logsTotal / PAGE_SIZE);

  // Fetch logs on mount and when filters change
  // Obtener logs al montar y cuando cambian los filtros
  useEffect(() => {
    const params: { status?: RecipientLogStatus; limit: number; offset: number } = {
      limit: PAGE_SIZE,
      offset: (currentPage - 1) * PAGE_SIZE,
    };
    if (statusFilter !== 'all') {
      params.status = statusFilter as RecipientLogStatus;
    }
    fetchCampaignLogs(campaignId, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, statusFilter, currentPage]);

  // ==========================================
  // Handlers / Manejadores
  // ==========================================

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <Card className="border-slate-700 bg-slate-800" data-testid="campaign-logs-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <FileText className="h-5 w-5 text-purple-400" />
            {t('emailCampaigns.logsTitle') || 'Delivery Logs'}
          </CardTitle>

          {/* Status filter / Filtro de estado */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger
                className="w-[140px] bg-slate-900 border-slate-600 text-slate-100 text-xs"
                aria-label={t('emailCampaigns.filterStatus') || 'Filter by status'}
                data-testid="logs-status-filter"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-slate-100 focus:bg-purple-600/20 text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading / Cargando */}
        {isLoadingLogs ? (
          <div className="flex items-center justify-center py-12" data-testid="logs-loading">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            <span className="ml-2 text-sm text-slate-400">
              {t('emailCampaigns.loadingLogs') || 'Loading logs...'}
            </span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-center gap-2 py-8 justify-center text-sm text-red-400"
            data-testid="logs-error"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : campaignLogs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-testid="logs-empty"
          >
            <FileText className="h-10 w-10 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              {t('emailCampaigns.noLogs') || 'No delivery logs found'}
            </p>
          </div>
        ) : (
          <>
            {/* Table / Tabla */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">
                      {t('emailCampaigns.logEmail') || 'Email'}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t('emailCampaigns.logStatus') || 'Status'}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t('emailCampaigns.logSentAt') || 'Sent At'}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t('emailCampaigns.logRetries') || 'Retries'}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t('emailCampaigns.logError') || 'Error'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignLogs.map((log, idx) => (
                    <TableRow
                      key={`${log.recipientEmail}-${idx}`}
                      className="border-slate-700/50 hover:bg-slate-700/30"
                      data-testid={`log-row-${idx}`}
                    >
                      <TableCell className="text-slate-200 font-mono text-sm">
                        {log.recipientEmail}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs border', LOG_STATUS_COLORS[log.status])}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatLogDate(log.sentAt)}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm text-center">
                        {log.retryCount}
                      </TableCell>
                      <TableCell className="text-red-400 text-xs max-w-[200px] truncate">
                        {log.errorReason || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination / Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                  {t('emailCampaigns.showingLogs') || 'Showing'} {(currentPage - 1) * PAGE_SIZE + 1}
                  –{Math.min(currentPage * PAGE_SIZE, logsTotal)}{' '}
                  {t('emailCampaigns.ofTotal') || 'of'} {logsTotal}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="border-slate-600 text-slate-300 h-8 w-8 p-0"
                    aria-label="Previous page"
                    data-testid="logs-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-slate-400">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="border-slate-600 text-slate-300 h-8 w-8 p-0"
                    aria-label="Next page"
                    data-testid="logs-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CampaignLogsTable;
