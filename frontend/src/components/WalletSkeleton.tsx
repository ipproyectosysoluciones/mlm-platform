/**
 * @fileoverview WalletSkeleton - Skeleton loader for wallet components
 * @description Loading placeholder while wallet data loads
 *              Placeholder de carga mientras los datos del wallet cargan
 * @module components/WalletSkeleton
 * @author Nexo Real Development Team
 */

interface WalletSkeletonProps {
  /** Type of skeleton to display */
  type?: 'balance' | 'transactions' | 'form' | 'full';
}

/**
 * Skeleton loader for wallet balance display
 */
function BalanceSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-12 w-12 bg-slate-200 rounded-full animate-pulse" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for transaction list
 */
function TransactionsSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for withdrawal form
 */
function FormSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
      <div className="space-y-4">
        <div className="h-12 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-12 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-14 w-full bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Full wallet page skeleton
 */
function FullSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BalanceSkeleton />
        </div>
        <div>
          <FormSkeleton />
        </div>
      </div>
      <TransactionsSkeleton />
    </div>
  );
}

/**
 * WalletSkeleton - Loading placeholder component
 * Displays different skeleton layouts based on type prop
 */
export default function WalletSkeleton({ type = 'full' }: WalletSkeletonProps) {
  switch (type) {
    case 'balance':
      return <BalanceSkeleton />;
    case 'transactions':
      return <TransactionsSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'full':
    default:
      return <FullSkeleton />;
  }
}

// Re-export for convenience
export { BalanceSkeleton, TransactionsSkeleton, FormSkeleton, FullSkeleton };
