import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../lib/admin-auth'
import { withWrite } from '../../../../../lib/crm'
import { readSettings } from '../../../../../lib/settings'
import { sendMail, mailerStatus, DAILY_SEND_CAP } from '../../../../../lib/mailer'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: Request) {
  const auth = await requireApiUser(['owner', 'admin', 'manager'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })

  const status = mailerStatus()
  if (!status.ready) {
    return NextResponse.json({ error: `SMTP is not configured. Missing: ${status.missing.join(', ')}.` }, { status: 503 })
  }

  try {
    const { messageId } = await request.json()
    if (typeof messageId !== 'string' || !messageId) {
      return NextResponse.json({ error: 'A message id is required' }, { status: 400 })
    }

    // Everything that must be true before a real person receives this.
    const prepared = await withWrite(sql => sql.begin(async tx => {
      const [message] = await tx<any[]>`
        select m.id, m.subject, m.body, m.status, m.to_email as "toEmail", m.business_id as "businessId",
               b.name as business, b.do_not_contact as "doNotContact"
        from outreach_messages m join businesses b on b.id = m.business_id
        where m.id = ${messageId}`
      if (!message) throw new Error('Message not found')
      if (message.doNotContact) throw new Error(`${message.business} is marked do not contact`)
      if (!message.toEmail) throw new Error('This message has no recipient address')
      if (message.status !== 'approved') throw new Error('Only an approved message can be sent. Approve it first.')

      const settings = await readSettings(tx)
      if (!settings.postalAddress) {
        throw new Error('Set a postal address in Settings first — commercial email is required to carry one.')
      }

      const [sentToday] = await tx<any[]>`
        select count(*)::int as n from outreach_messages
        where sent_at > now() - interval '24 hours'`
      if (Number(sentToday?.n ?? 0) >= DAILY_SEND_CAP) {
        throw new Error(`Daily send cap of ${DAILY_SEND_CAP} reached. A mailbox that suddenly sends more than that gets flagged.`)
      }

      // Claim it before the network call so a double click cannot send twice.
      await tx`update outreach_messages set status='sent', sent_at=now(), updated_at=now() where id=${messageId}`
      return message
    }))

    try {
      const result = await sendMail({
        to: prepared.toEmail, subject: prepared.subject, text: prepared.body,
        replyTo: status.config.from,
      })
      await withWrite(sql => sql.begin(async tx => {
        await tx`update outreach_messages set metadata = coalesce(metadata,'{}'::jsonb) || ${tx.json({ messageId: result.messageId, sentBy: auth.user!.name })}, updated_at=now() where id=${messageId}`
        await tx`insert into business_activities (business_id,type,title,detail,metadata)
          values (${prepared.businessId},'outreach','Outreach sent',${`Sent to ${prepared.toEmail} by ${auth.user!.name}.`},${tx.json({ actor: auth.user!.name, messageId: result.messageId })})`
      }))
      return NextResponse.json({ ok: true, accepted: result.accepted })
    } catch (sendError) {
      // The claim must be released, or a transient failure silently records a
      // send that never happened.
      const detail = sendError instanceof Error ? sendError.message : 'Send failed'
      await withWrite(sql => sql.begin(async tx => {
        await tx`update outreach_messages set status='approved', sent_at=null, updated_at=now() where id=${messageId}`
        await tx`insert into business_activities (business_id,type,title,detail,metadata)
          values (${prepared.businessId},'outreach','Outreach send failed',${detail.slice(0, 400)},${tx.json({ actor: auth.user!.name })})`
      }))
      return NextResponse.json({ error: `Not sent: ${detail}` }, { status: 502 })
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to send' }, { status: 400 })
  }
}
