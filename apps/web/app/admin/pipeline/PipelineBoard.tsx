'use client'

import { useState } from 'react'
import Link from 'next/link'

const STAGES = ['discovered','qualified','researching','demo_ready','contacted','interested','proposal','won'] as const

type Item = { id: string; name: string; slug: string; score: number | null; stage: string }

export default function PipelineBoard({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial)
  const [dragging, setDragging] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  async function move(id: string, stage: string) {
    const previous = items
    setItems(current => current.map(item => item.id === id ? { ...item, stage } : item))
    setSaving(id)
    try {
      const response = await fetch('/api/admin/pipeline', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: id, stage }) })
      if (!response.ok) throw new Error('Failed to update pipeline')
    } catch {
      setItems(previous)
      window.alert('Could not save this pipeline change. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  return <div className="pipeline">
    {STAGES.map(stage => {
      const stageItems = items.filter(item => item.stage === stage)
      return <div className={`stage ${dragging ? 'dropTarget' : ''}`} key={stage}
        onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
        onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) void move(id, stage); setDragging(null) }}>
        <div className="stageHead"><span>{stage.replaceAll('_',' ')}</span><b>{stageItems.length}</b></div>
        {stageItems.map(item => <div className={`item ${dragging === item.id ? 'dragging' : ''}`} draggable key={item.id}
          onDragStart={event => { event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; setDragging(item.id) }}
          onDragEnd={() => setDragging(null)}>
          <Link href={`/admin/businesses/${item.slug}`}><b>{item.name}</b><span>{item.score != null ? `Opportunity ${item.score}/100` : 'No score yet'}</span></Link>
          {saving === item.id && <small className="saving">Saving…</small>}
        </div>)}
        {stageItems.length === 0 && <div className="dropHint">Drop businesses here</div>}
      </div>
    })}
  </div>
}
