/**
 * @fileoverview Streaming data components using React 19 use() hook
 * @description Components for promise-based data fetching with Suspense streaming
 *              Componentes para fetching basado en promises con streaming de Suspense
 * @module components/async/AsyncData
 */

import { use, Suspense, type ReactNode, type ComponentType } from 'react';

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
 * HOC to create an async component from a promise-returning function
 * Useful for creating reusable async components
 *
 * @example
 * const UserProfile = createAsyncComponent(
 *   (userId: string) => api.getUser(userId),
 *   (user) => <div>{user.name}</div>
 * );
 *
 * // Usage with Suspense
 * <Suspense fallback={<Loading />}>
 *   <UserProfile userId="123" />
 * </Suspense>
 */
export function createAsyncComponent<T, Props extends { promise: Promise<T> }>(
  render: (data: T) => ReactNode
): ComponentType<Props> {
  return function AsyncComponent({ promise }: Props) {
    return (
      <Suspense fallback={<DefaultSkeleton />}>
        <AsyncContent promise={promise}>{render}</AsyncContent>
      </Suspense>
    );
  };
}

/**
 * Hook-based async data component alternative
 * Use this when you need more control over the loading state
 */
export function useAsyncData<T>(promise: Promise<T>): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
} {
  try {
    const data = use(promise);
    return { data, isLoading: false, error: null };
  } catch (thrownValue) {
    if (thrownValue instanceof Promise) {
      return { data: null, isLoading: true, error: null };
    }
    return { data: null, isLoading: false, error: thrownValue as Error };
  }
}

/**
 * Component that renders different content based on async state
 * Provides a unified API for loading, error, and success states
 */
interface AsyncStateProps<T> {
  promise: Promise<T>;
  loading: ReactNode;
  error: (error: Error) => ReactNode;
  success: (data: T) => ReactNode;
}

export function AsyncState<T>({ promise, loading, error, success }: AsyncStateProps<T>): ReactNode {
  try {
    const data = use(promise);
    return success(data);
  } catch (thrownValue) {
    if (thrownValue instanceof Promise) {
      return loading;
    }
    return error(thrownValue as Error);
  }
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
