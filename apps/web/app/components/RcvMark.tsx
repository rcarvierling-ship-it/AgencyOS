'use client'

import { useId } from 'react'

/**
 * The RCV Agency mark: a rising line over a baseline.
 *
 * Ids come from useId rather than anything derived from props — several marks
 * render at once and one sits inside the mobile drawer's display:none subtree,
 * so a shared id lets a visible mark resolve its fill to a hidden definition.
 */
export function RcvMark({ size = 32, className, title, tone = 'ink' }: {
  size?: number; className?: string; title?: string; tone?: 'ink' | 'inverse'
}) {
  const id = useId()
  return <svg
    width={size} height={size} viewBox="0 0 64 64" className={className}
    role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}
  >
    {title && <title>{title}</title>}
    <defs>
      <linearGradient id={`${id}-rise`} x1="8" y1="48" x2="56" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#2563EB" />
        <stop offset=".55" stopColor="#7C3AED" />
        <stop offset="1" stopColor="#F97362" />
      </linearGradient>
    </defs>
    <path d="M8 46 22 28l10 11L56 11" fill="none" stroke={`url(#${id}-rise)`}
      strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 58h34" fill="none" stroke={tone === 'inverse' ? '#FFFFFF' : '#18181B'}
      strokeWidth="7.5" strokeLinecap="round" />
  </svg>
}
