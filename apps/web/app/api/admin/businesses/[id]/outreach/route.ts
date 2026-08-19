import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../../lib/admin-auth'
import { withWrite } from '../../../../../../lib/crm'
import { readSettings } from '../../../../../../lib/settings'
import { buildOutreachDraft } from '../../../../../../lib/outreach'

export const runtime = 'nodejs'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })

  try {
    const { id } = await params
    const result = await withWrite(sql => sql.begin(async tx => {
      const [business] = await tx<any[]>`
        select id,name,city,state,industry,email,website_url as "websiteUrl",do_not_contact as "doNotContact"
        from businesses where id=${id}`
      if (!business) throw new Error('Business not found')
      if (business.doNotContact) throw new Error('This business is marked do not contact')

      const settings = await readSettings(tx)
      const [contact] = await tx<any[]>`select name,email from business_contacts where business_id=${id} order by created_at limit 1`
      const [audit] = await tx<any[]>`select overall_score as "overallScore",findings from website_audits where business_id=${id} order by created_at desc limit 1`
      // Only an approved concept may be linked; an unreviewed one must not go out.
      const [demo] = await tx<any[]>`select id,slug from demos where business_id=${id} and status='approved' order by approved_at desc limit 1`
      const [opportunity] = await tx<any[]>`select id from opportunities where business_id=${id} and stage not in ('won','lost') order by updated_at desc limit 1`

      const siteUrl = (settings.websiteUrl || 'https://rcvagency.com').replace(/\/$/, '')
      const draft = buildOutreachDraft({
        businessName: business.name, city: business.city, state: business.state, industry: business.industry,
        websiteUrl: business.websiteUrl,
        contactFirstName: contact?.name ? String(contact.name).split(/\s+/)[0]! : null,
        demoUrl: demo ? `${siteUrl}/demo/${demo.slug}` : null,
        auditChecks: audit?.findings?.checks ?? null,
        auditOverall: audit?.overallScore ?? null,
        agencyName: settings.agencyName, senderName: auth.user!.name,
        postalAddress: settings.postalAddress ?? null,
      })

      const [row] = await tx<any[]>`
        insert into outreach_messages (business_id,opportunity_id,demo_id,to_email,subject,body,status,metadata)
        values (${id},${opportunity?.id ?? null},${demo?.id ?? null},${contact?.email ?? business.email ?? null},
                ${draft.subject},${draft.body},'draft',${tx.json({ generatedBy: auth.user!.name, problems: draft.problems, warnings: draft.warnings })})
        returning id,subject,status`

      await tx`
        insert into business_activities (business_id,opportunity_id,type,title,detail,metadata)
        values (${id},${opportunity?.id ?? null},'outreach','Outreach drafted',
                ${`Draft prepared by ${auth.user!.name}. Review before sending.`},${tx.json({ actor: auth.user!.name })})`
      return { message: row, draft }
    }))
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to draft outreach' }, { status: 400 })
  }
}
