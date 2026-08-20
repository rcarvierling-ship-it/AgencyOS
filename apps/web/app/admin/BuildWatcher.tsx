'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Refreshes the page while builds are in flight. A build runs on the worker,
 * not in the browser, so nothing would otherwise tell the page it finished.
 */
export function BuildWatcher({ active }: { active: number }) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!active) return
    const tick = setInterval(() => setElapsed(s => s + 1), 1000)
    const poll = setInterval(() => {
      // Never reload while a concept preview is open on screen.
      if (document.body.dataset.previewOpen) return
      router.refresh()
    }, 6000)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [active, router])

  if (!active) return null
  const mins = Math.floor(elapsed / 60)
  return <span style={{ fontSize: 8, color: '#9a6a16' }}>
    live{mins ? ` · ${mins}m on this page` : ''}
  </span>
}
