'use client'

import { useId } from 'react'

// The RCV Agency mark. Inlined as SVG so it scales crisply at every size the
// shell uses and costs no extra request.
//
// The gradient ids come from useId rather than anything derived from props:
// several marks are on the page at once, and the mobile drawer's copy sits
// inside a display:none subtree. Reused ids meant a visible mark could resolve
// url(#...) to a hidden definition and render unfilled.
export function RcvMark({ size = 32, className, title }: { size?: number; className?: string; title?: string }) {
  const id = useId()
  return <svg
    width={size} height={size} viewBox="0 0 64 64" className={className}
    role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}
  >
    {title && <title>{title}</title>}
    <defs>
      <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#7C3AED" />
        <stop offset=".52" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fff" stopOpacity=".22" />
        <stop offset=".55" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="15" fill={`url(#${id}-tile)`} />
    <rect width="64" height="64" rx="15" fill={`url(#${id}-sheen)`} />
    <g fill="none" stroke="#fff" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 46V17h13a8 8 0 0 1 0 16H20" />
      <path d="m31.5 33 12.5 13" />
    </g>
    {size >= 24 && <circle cx="47.5" cy="17.5" r="3.4" fill="#22D3EE" />}
  </svg>
}
