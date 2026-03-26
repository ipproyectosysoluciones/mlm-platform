/**
 * @fileoverview Classname utility for Tailwind CSS
 * @description Utility function to merge Tailwind classes with cn() pattern
 * @module utils/cn
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS conflict resolution
 * Combina nombres de clases con resolución de conflictos de Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default cn;
