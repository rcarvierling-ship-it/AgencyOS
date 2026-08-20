// Bearer-token identity for automated workers.
//
// Deliberately separate from the browser session: a worker has no cookie jar,
// and an agent should be revocable by rotating one value without disturbing
// anyone's login. This is the beginning of the OpenClaw service identity.

export type AgentIdentity = { name: string; role: 'agent' }

export function authenticateAgent(request: Request): AgentIdentity | null {
  const expected = process.env.AGENT_API_TOKEN
  if (!expected || expected.length < 24) return null      // refuse to run on a weak or absent token

  const header = request.headers.get('authorization') ?? ''
  const presented = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!presented) return null

  // Constant-time comparison; a length mismatch is itself a mismatch.
  if (presented.length !== expected.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= presented.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) return null

  return { name: request.headers.get('x-agent-name')?.slice(0, 60) || 'worker', role: 'agent' }
}

export function agentUnauthorized() {
  return Response.json({ error: 'A valid agent token is required' }, { status: 401 })
}
