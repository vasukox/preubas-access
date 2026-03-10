/**
 * KOAJ Access v2.0 — Permoda S.A.S.
 * ------------------------------------
 * Utility para combinar clases de Tailwind de forma segura.
 *
 * Combina clsx (lógica condicional) con tailwind-merge
 * (deduplicación de clases en conflicto).
 *
 * Uso:
 *   cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
 *   → 'py-2 bg-primary px-6'  (px-4 eliminado por px-6)
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}