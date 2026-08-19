export const ACTIVITY_TYPES = ['note', 'call', 'email', 'meeting', 'outreach', 'follow_up', 'proposal', 'other'] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]
