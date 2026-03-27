/**
 * @fileoverview PlatformBadge Component - Streaming platform display
 * @description Badge component showing platform icon and name / Componente de insignia mostrando ícono y nombre de plataforma
 * @module components/PlatformBadge
 */

import { useTranslation } from 'react-i18next';
import { Tv, Film, Play, Youtube, Apple, MonitorPlay, Music } from 'lucide-react';
import type { StreamingPlatform } from '../types';
import { cn } from '../utils/cn';

/**
 * PlatformBadge props
 */
interface PlatformBadgeProps {
  platform: StreamingPlatform;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

/**
 * Platform icon mapping
 * Using available lucide-react icons as alternatives
 */
const platformIcons: Record<StreamingPlatform, React.ComponentType<{ className?: string }>> = {
  netflix: MonitorPlay, // Using MonitorPlay as Netflix alternative
  disney_plus: Tv,
  spotify: Music, // Using Music as Spotify alternative
  hbo_max: Film,
  amazon_prime: Play,
  youtube_premium: Youtube,
  apple_tv_plus: Apple,
};

/**
 * Platform color mapping
 */
const platformColors: Record<StreamingPlatform, string> = {
  netflix: 'bg-red-600 text-white',
  disney_plus: 'bg-blue-900 text-white',
  spotify: 'bg-green-600 text-white',
  hbo_max: 'bg-purple-600 text-white',
  amazon_prime: 'bg-orange-500 text-white',
  youtube_premium: 'bg-red-700 text-white',
  apple_tv_plus: 'bg-slate-800 text-white',
};

/**
 * PlatformBadge component - Displays platform icon and name
 * Componente de insignia de plataforma - Muestra ícono y nombre de la plataforma
 */
export function PlatformBadge({
  platform,
  size = 'md',
  showName = true,
  className,
}: PlatformBadgeProps) {
  const { t } = useTranslation();

  const Icon = platformIcons[platform];
  const colorClass = platformColors[platform];
  const platformName = t(`products.platform.${platform}`);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      {showName && <span>{platformName}</span>}
    </span>
  );
}

export default PlatformBadge;
