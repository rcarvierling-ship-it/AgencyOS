// The single source of truth for pipeline stages.
//
// This module deliberately has no dependencies so both server routes and client
// components can import it. Previously the stage list was written out four
// separate times — the board, the pipeline API, the settings form, and the
// dashboard query — and the settings form had already drifted, offering "demo"
// and "ready" stages that no other part of the system recognized.

export const PIPELINE_STAGES = [
  'discovered', 'qualified', 'researching', 'demo_ready',
  'contacted', 'interested', 'proposal', 'won',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number] | 'lost'

/** Every stage an opportunity may occupy, including terminal ones. */
export const ALL_PIPELINE_STAGES: readonly string[] = [...PIPELINE_STAGES, 'lost']

export const STAGE_LABELS: Record<string, string> = {
  discovered: 'Discovered',
  qualified: 'Qualified',
  researching: 'Researching',
  demo_ready: 'Demo ready',
  contacted: 'Contacted',
  interested: 'Interested',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

export function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage.replaceAll('_', ' ')
}

export function isPipelineStage(value: unknown): value is PipelineStage {
  return typeof value === 'string' && ALL_PIPELINE_STAGES.includes(value)
}
