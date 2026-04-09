/**
 * @fileoverview Streaming data components using React 19 use() hook
 * @description Components for promise-based data fetching with Suspense streaming
 *              Componentes para fetching basado en promises con streaming de Suspense
 * @module components/async/AsyncData
 */

import { use, Suspense, type ReactNode } from 'react';

interface AsyncDataProps<T> {
  promise: Promise<T>;
  children: (data: T) => ReactNode;
  fallback?: ReactNode;
}

/**
 * Async data component that uses React 19 use() hook
 * Suspends until the promise resolves and renders the data
 *
 * @example
 * <AsyncData promise={fetchUserData()}>
 *   {(user) => <UserProfile user={user} />}
 * </AsyncData>
 */
export function AsyncData<T>({
  promise,
  children,
  fallback = <DefaultSkeleton />,
}: AsyncDataProps<T>): ReactNode {
  return (
    <Suspense fallback={fallback}>
      <AsyncContent promise={promise}>{children}</AsyncContent>
    </Suspense>
  );
}

/**
 * Internal component that uses the use() hook
 * This is where the actual promise resolution happens
 */
function AsyncContent<T>({
  promise,
  children,
}: {
  promise: Promise<T>;
  children: (data: T) => ReactNode;
}): ReactNode {
  // use() is available in React 19 and suspends until the promise resolves
  const data = use(promise);
  return <>{children(data)}</>;
}

/**
 * Default skeleton shown while data is loading
 */
function DefaultSkeleton(): ReactNode {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-5/6" />
    </div>
  );
}

/**
 * Parallel async data loader
 * Loads multiple promises in parallel and renders when all resolve
 *
 * @example
 * <AsyncAll
 *   promises={{
 *     user: fetchUser(),
 *     stats: fetchStats(),
 *     activity: fetchActivity(),
 *   }}
 * >
 *   {({ user, stats, activity }) => (
 *     <Dashboard user={user} stats={stats} activity={activity} />
 *   )}
 * </AsyncAll>
 */
interface AsyncAllProps<T extends Record<string, Promise<unknown>>> {
  promises: T;
  children: (data: { [K in keyof T]: Awaited<NonNullable<T[K]>> }) => ReactNode;
  fallback?: ReactNode;
}

export function AsyncAll<T extends Record<string, Promise<unknown>>>({
  promises,
  children,
  fallback = <DefaultSkeleton />,
}: AsyncAllProps<T>): ReactNode {
  return (
    <Suspense fallback={fallback}>
      <ParallelLoader promises={promises}>{children}</ParallelLoader>
    </Suspense>
  );
}

function ParallelLoader<T extends Record<string, Promise<unknown>>>({
  promises,
  children,
}: {
  promises: T;
  children: (data: { [K in keyof T]: Awaited<NonNullable<T[K]>> }) => ReactNode;
}): ReactNode {
  const data = use(Promise.all(Object.values(promises)));
  const keys = Object.keys(promises) as (keyof T)[];
  const result = {} as { [K in keyof T]: Awaited<NonNullable<T[K]>> };

  keys.forEach((key, index) => {
    result[key] = data[index] as Awaited<NonNullable<T[keyof T]>>;
  });

  return <>{children(result)}</>;
}
