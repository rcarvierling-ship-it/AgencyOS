// Sending for cold outreach.
//
// This deliberately goes through a mailbox the agency controls rather than a
// transactional provider: Resend, SendGrid and Postmark all prohibit
// unsolicited mail, and building on infrastructure whose terms forbid the use
// invites an account termination at the worst possible moment.

import nodemailer from 'nodemailer'

export type MailerConfig = {
  host: string; port: number; secure: boolean
  user: string; pass: string; from: string; fromName: string | null
}

export type MailerStatus =
  | { ready: true; config: Omit<MailerConfig, 'pass'> }
  | { ready: false; missing: string[] }

/** Reads SMTP settings from the environment without ever returning the password. */
export function mailerStatus(): MailerStatus {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS
  const from = (process.env.SMTP_FROM || process.env.SMTP_USER)?.trim()

  const missing: string[] = []
  if (!host) missing.push('SMTP_HOST')
  if (!user) missing.push('SMTP_USER')
  if (!pass) missing.push('SMTP_PASS')
  if (!from) missing.push('SMTP_FROM')
  if (missing.length) return { ready: false, missing }

  const port = Number(process.env.SMTP_PORT || 587)
  return {
    ready: true,
    config: { host: host!, port, secure: port === 465, user: user!, from: from!, fromName: process.env.SMTP_FROM_NAME?.trim() || null },
  }
}

function transport(config: MailerConfig) {
  return nodemailer.createTransport({
    host: config.host, port: config.port, secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    // Refuse to negotiate down to an unencrypted session.
    requireTLS: !config.secure,
    tls: { minVersion: 'TLSv1.2' },
  })
}

function resolved(): MailerConfig | null {
  const status = mailerStatus()
  if (!status.ready) return null
  return { ...status.config, pass: process.env.SMTP_PASS! }
}

/** Proves the credentials work without sending anything to a real person. */
export async function verifyMailer(): Promise<{ ok: boolean; error?: string }> {
  const config = resolved()
  if (!config) return { ok: false, error: 'SMTP is not configured' }
  try {
    await transport(config).verify()
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Connection failed' }
  }
}

export type SendResult = { messageId: string; accepted: string[] }

export async function sendMail(input: { to: string; subject: string; text: string; replyTo?: string | null }): Promise<SendResult> {
  const config = resolved()
  if (!config) throw new Error('SMTP is not configured')

  const info = await transport(config).sendMail({
    from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: input.replyTo || undefined,
    headers: {
      // Lets a recipient's client offer one-click opt-out, and signals to
      // filters that this is not a blast.
      'List-Unsubscribe': `<mailto:${config.from}?subject=unsubscribe>`,
      'X-Entity-Ref-ID': `agencyos-${Date.now()}`,
    },
  })

  const accepted = (info.accepted ?? []).map(String)
  if (!accepted.length) throw new Error('The mail server accepted no recipients')
  return { messageId: String(info.messageId ?? ''), accepted }
}

// Volume guard ---------------------------------------------------------------
// A mailbox that suddenly sends hundreds of cold emails gets flagged, so the
// cap is enforced here rather than trusted to whoever is clicking.

export const DAILY_SEND_CAP = Number(process.env.OUTREACH_DAILY_CAP || 40)
