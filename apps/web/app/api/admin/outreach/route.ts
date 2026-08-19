import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../lib/admin-auth'
import { withWrite } from '../../../../lib/crm'
import { OUTREACH_STATUSES, isEmailProviderConfigured } from '../../../../lib/outreach'

export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })
  try {
    const body = await request.json()
    const messageId = String(body.messageId || '')
    const status = String(body.status || '')
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 300) : null
    const emailBody = typeof body.body === 'string' ? body.body.slice(0, 20000) : null
    if (!messageId) return NextResponse.json({ error: 'A message id is required' }, { status: 400 })
    if (status && !(OUTREACH_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'That outreach status is not recognized' }, { status: 400 })
    }
    // Marking a message sent must reflect something that actually happened.
    if (status === 'sent' && !isEmailProviderConfigured() && body.confirmSentManually !== true) {
      return NextResponse.json({
        error: 'No email provider is configured. Send the message yourself, then mark it sent to confirm it really went out.',
        needsManualConfirmation: true,
      }, { status: 409 })
    }

    await withWrite(sql => sql.begin(async tx => {
      const [message] = await tx<any[]>`select id, business_id as "businessId", status from outreach_messages where id=${messageId}`
      if (!message) throw new Error('Message not found')

      await tx`
        update outreach_messages set
          subject=coalesce(${subject},subject),
          body=coalesce(${emailBody},body),
          status=coalesce(${status || null},status),
          sent_at=case when ${status === 'sent'} then coalesce(sent_at, now()) else sent_at end,
          replied_at=case when ${['replied','interested','declined'].includes(status)} then coalesce(replied_at, now()) else replied_at end,
          updated_at=now()
        where id=${messageId}`

      // A decline suppresses the business permanently rather than merely
      // closing one message, so nothing else can be drafted against it.
      if (status === 'declined') {
        await tx`update businesses set do_not_contact=true, updated_at=now() where id=${message.businessId}`
      }
      if (status === 'interested') {
        await tx`update opportunities set stage='interested', updated_at=now() where business_id=${message.businessId} and stage not in ('won','lost')`
      }
      if (status) {
        await tx`
          insert into business_activities (business_id,type,title,detail,metadata)
          values (${message.businessId},'outreach',${'Outreach ' + status},
                  ${`Marked ${status} by ${auth.user!.name}.`},${tx.json({ actor: auth.user!.name, status })})`
      }
    }))
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update outreach' }, { status: 400 })
  }
}
