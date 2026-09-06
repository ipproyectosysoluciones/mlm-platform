/**
 * @fileoverview OrdersPage - Paginated order list with status filter
 * @description Displays user's purchase orders in a sortable, filterable table
 *              with loading skeleton, empty state, and error state with retry.
 *              Status filter syncs with URL search params for shareable URLs.
 * @module pages/orders/OrdersPage
 *
 * OrdersPage - Lista de órdenes paginada con filtro de estado
 * @description Muestra las órdenes de compra en una tabla filtrable y paginada
 *              con esqueleto de carga, estado vacío y estado de error con reintento.
 *              El filtro de estado se sincroniza con los search params de la URL.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Filter, RefreshCw } from 'lucide-react';
import { orderService } from '@/services/api';
import type { Order, OrderStatus as OrderStatusType } from '@/types';
import { cn } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatus } from '@/components/OrderStatus';
import { PriceDisplay } from '@/components/PriceDisplay';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/ui/Pagination';

/** All possible order status values for the filter */
const ORDER_STATUSES: OrderStatusType[] = ['pending', 'completed', 'failed', 'cancelled'];

/**
 * TableSkeleton - Loading placeholder with 5 shimmer rows
 * TableSkeleton - Placeholder de carga con 5 filas shimmer
 */
function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-36" />
      </div>
      {/* Data rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
      ))}
    </div>
  );
}

/**
 * ErrorState - Error card with retry button
 * ErrorState - Tarjeta de error con botón de reintento
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <RefreshCw className="h-7 w-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{t('orders.error')}</h3>
          <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{t('orders.retry')}</p>
        </div>
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('orders.retry')}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * OrdersPage component - Paginated order list with status filter
 * Componente OrdersPage - Lista de órdenes paginada con filtro de estado
 */
export function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read params from URL
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const currentStatus = (searchParams.get('status') || '') as OrderStatusType | '';

  /**
   * Fetch orders from API
   * Obtener órdenes de la API
   */
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: Record<string, unknown> = { page: currentPage, limit: 20 };
      if (currentStatus) {
        params.status = currentStatus;
      }

      const response = await orderService.getOrders(params as any);
      setOrders(response.orders);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(t('orders.error'));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, currentStatus, t]);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Update status filter in URL and reset to page 1
   * Actualizar filtro de estado en URL y resetear a página 1
   */
  const handleStatusChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value && value !== '') {
        params.set('status', value);
      } else {
        params.delete('status');
      }
      params.set('page', '1');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  /**
   * Update page in URL
   * Actualizar página en URL
   */
  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('page', String(page));
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  /**
   * Navigate to order detail
   * Navegar al detalle de la orden
   */
  const handleRowClick = useCallback(
    (orderId: string) => {
      navigate(`/orders/${orderId}`);
    },
    [navigate]
  );

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-card)] px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-bold text-white">{t('orders.title')}</h1>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // -- Error state --
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-card)] px-4 py-8" aria-live="polite">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-bold text-white">{t('orders.title')}</h1>
          <ErrorState onRetry={fetchOrders} />
        </div>
      </div>
    );
  }

  // -- Empty state --
  if (!isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-card)] px-4 py-8" aria-live="polite">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-bold text-white">{t('orders.title')}</h1>
          <EmptyState type="order" actionHref="/products" />
        </div>
      </div>
    );
  }

  // -- Data state --
  return (
    <div className="min-h-screen bg-[var(--color-card)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
              <ShoppingBag className="h-7 w-7 text-purple-400" />
              {t('orders.title')}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-foreground-muted)]">{t('orders.subtitle')}</p>
          </div>
        </div>

        {/* Status filter */}
        <div className="mb-6 flex items-center gap-3">
          <label
            htmlFor="status-filter"
            className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground-subtle)]"
          >
            <Filter className="h-4 w-4" />
            <span>{t('orders.status')}:</span>
          </label>
          <select
            id="status-filter"
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={cn(
              'rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-white',
              'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30'
            )}
          >
            <option value="">{t('common.all')}</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`orders.statuses.${status}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Orders table */}
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[var(--color-foreground-muted)]" scope="col">
                  {t('orders.orderNumber')}
                </TableHead>
                <TableHead className="text-[var(--color-foreground-muted)]" scope="col">
                  {t('orders.product')}
                </TableHead>
                <TableHead className="text-[var(--color-foreground-muted)]" scope="col">
                  {t('orders.amount')}
                </TableHead>
                <TableHead className="text-[var(--color-foreground-muted)]" scope="col">
                  {t('orders.status')}
                </TableHead>
                <TableHead className="text-[var(--color-foreground-muted)]" scope="col">
                  {t('orders.date')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer transition-colors hover:bg-[var(--color-card)]/50"
                  onClick={() => handleRowClick(order.id)}
                >
                  <TableCell className="font-mono text-sm text-white">
                    #{order.orderNumber}
                  </TableCell>
                  <TableCell className="text-[var(--color-foreground-subtle)]">{order.product?.name || '-'}</TableCell>
                  <TableCell>
                    <PriceDisplay
                      amount={order.totalAmount ?? order.amount}
                      currency={order.currency}
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <OrderStatus status={order.status} size="sm" />
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-foreground-muted)]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
