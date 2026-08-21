'use client'

import { useEffect, useState } from 'react'
import styles from './AdminShell.module.css'

type Theme = 'light' | 'dark' | 'system'
const ORDER: Theme[] = ['system', 'light', 'dark']
const LABEL: Record<Theme, string> = { system: 'Match system', light: 'Light', dark: 'Dark' }
const ICON: Record<Theme, string> = { system: 'desktop', light: 'sun', dark: 'moon' }

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('agencyos-theme') as Theme | null
    if (stored && ORDER.includes(stored)) setTheme(stored)
  }, [])

  function apply(next: Theme) {
    setTheme(next)
    localStorage.setItem('agencyos-theme', next)
    const root = document.documentElement
    if (next === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', next)
  }

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!
  return <button
    type="button"
    className={styles.iconButton}
    onClick={() => apply(next)}
    aria-label={`Theme: ${LABEL[theme]}. Switch to ${LABEL[next]}.`}
    title={`Theme: ${LABEL[theme]} — click for ${LABEL[next]}`}
  >
    <i aria-hidden="true" className={`uil uil-${ICON[theme]}`} style={{ fontSize: 15 }} />
  </button>
}

/**
 * Applies the stored theme before first paint. Without this the page renders
 * light and then snaps to dark, which is worse than having no dark mode.
 */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('agencyos-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
