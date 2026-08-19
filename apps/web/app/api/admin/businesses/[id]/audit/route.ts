import { NextResponse } from 'next/server'
import { requireApiUser } from '../../../../../../lib/admin-auth'
import { withWrite } from '../../../../../../lib/crm'
import { auditWebsite } from '../../../../../../lib/audit'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['owner', 'admin', 'manager', 'operator', 'agent'])
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Authentication required' ? 401 : 403 })

  try {
    const { id } = await params
    const business = await withWrite(async sql => {
      const [row] = await sql<any[]>`select id, name, website_url as "websiteUrl" from businesses where id=${id}`
      return row
    })
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const result = await auditWebsite(business.websiteUrl)

    await withWrite(sql => sql.begin(async tx => {
      await tx`
        insert into website_audits (business_id,url,overall_score,design_score,mobile_score,performance_score,seo_score,accessibility_score,conversion_score,findings)
        values (${id},${result.url},${result.scores.overall},${result.scores.design},${result.scores.mobile},
                ${result.scores.performance},${result.scores.seo},${result.scores.accessibility},${result.scores.conversion},
                ${tx.json({ checks: result.checks, reachable: result.reachable, error: result.error, statusCode: result.statusCode, responseMs: result.responseMs })})`

      // The audit is what makes an opportunity score meaningful, so it owns it.
      await tx`update businesses set opportunity_score=${result.opportunityScore}, updated_at=now() where id=${id}`

      const summary = result.reachable
        ? `Scored ${result.scores.overall}/100. Opportunity now ${result.opportunityScore}/100.`
        : result.url
          ? `Site could not be audited: ${result.error}. Opportunity now ${result.opportunityScore}/100.`
          : `No website recorded. Opportunity now ${result.opportunityScore}/100.`
      await tx`
        insert into business_activities (business_id,type,title,detail,metadata)
        values (${id},'note','Website audit run',${summary},${tx.json({ actor: auth.user!.name, overall: result.scores.overall })})`
    }))

    return NextResponse.json({ audit: result })
  } catch (error) {
    console.error('AgencyOS audit failed', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to run the audit' }, { status: 500 })
  }
}
