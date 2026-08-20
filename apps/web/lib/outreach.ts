// Drafts a cold email for one business.
//
// The whole value of this is that it is specific: the problems named are ones
// the audit actually found on their actual site, and the concept linked was
// built from their actual details. Nothing here asserts anything we have not
// observed, and every draft is written to be read by a person who did not ask
// to hear from us.

export type OutreachInput = {
  businessName: string
  city: string | null
  state: string | null
  industry: string | null
  websiteUrl: string | null
  contactFirstName: string | null
  demoUrl: string | null
  auditChecks: { label: string; status: string; detail: string; category: string }[] | null
  auditOverall: number | null
  agencyName: string
  senderName: string
  postalAddress: string | null
}

export type OutreachDraft = { subject: string; body: string; problems: string[]; warnings: string[] }

/** Plain-English versions of audit failures, safe to put in front of an owner. */
const PHRASING: Record<string, string> = {
  'Mobile viewport': 'it does not adapt to phone screens, so visitors have to pinch and zoom to read anything',
  'Tap-to-call': 'the phone number is not tappable on a mobile, so calling takes copying the number out by hand',
  'Contact route': 'there is no form or email link, so a visitor who wants to get in touch has no obvious way to do it',
  'HTTPS': 'it is served over plain HTTP, which browsers now label "Not secure" in the address bar',
  'Page title': 'the page title is doing little for you in search results',
  'Meta description': 'search engines are inventing the description shown under your listing rather than using one you wrote',
  'Single H1': 'the page never states plainly what the business does',
  'Server response time': 'it is slow to respond, and most people leave before a slow page finishes loading',
  'Render-blocking scripts': 'scripts in the head delay the page appearing at all',
  'Language declared': 'the page does not declare its language, which affects screen readers',
  'Image alt text': 'most images have no alternative text, which affects both accessibility and search',
  'Modern document type': 'the markup is from an older era of the web',
  'Layout technique': 'the layout is built with tables, a technique abandoned well over a decade ago',
  'Clear call to action': 'there is nothing telling a visitor what to do next',
  'Favicon': 'there is no icon, so the tab shows a blank page symbol',
  'Social preview image': 'links shared to social media or messaging apps render without a preview',
  'Structured data': 'your business details are not marked up in a way search engines can read directly',
  'Pinch-zoom allowed': 'zooming is disabled, which makes the page hard to use for anyone with less than perfect sight',
  'Web fonts': 'it falls back to default browser fonts',
  'Responsive styling signals': 'there is no responsive layout, so the desktop design is what phone visitors get',
}

function firstSentence(name: string) { return name.replace(/\s+(inc|llc|ltd|co)\.?$/i, '').trim() }

export function buildOutreachDraft(input: OutreachInput): OutreachDraft {
  const warnings: string[] = []
  const business = firstSentence(input.businessName)
  const greeting = input.contactFirstName ? `Hi ${input.contactFirstName},` : `Hi,`
  const area = [input.city, input.state].filter(Boolean).join(', ')

  const failures = (input.auditChecks ?? []).filter(c => c.status === 'fail')
  const warns = (input.auditChecks ?? []).filter(c => c.status === 'warn')
  const ranked = [...failures, ...warns]
    .map(c => PHRASING[c.label])
    .filter((x): x is string => Boolean(x))
  const problems = ranked.slice(0, 3)

  if (!input.auditChecks?.length) warnings.push('No audit has been run, so this draft cannot cite anything specific about their current site.')
  if (!input.demoUrl) warnings.push('No approved concept is linked, so the email has nothing to show.')
  if (!input.postalAddress) warnings.push('No postal address is set in Settings. Commercial email is required to carry one.')

  const hasSite = Boolean(input.websiteUrl)
  const subject = hasSite
    ? problems.length
      ? `${business} — a few things about your website`
      : `${business} — your website`
    : `${business} — you don't have a website yet`

  const opening = hasSite
    ? `I came across ${business}${area ? ` while looking at ${input.industry ? input.industry.toLowerCase() + ' ' : ''}businesses around ${area}` : ''}, and had a look at your site.`
    : `I came across ${business}${area ? ` while looking at ${input.industry ? input.industry.toLowerCase() + ' ' : ''}businesses around ${area}` : ''}, and couldn't find a website for you.`

  const problemBlock = hasSite
    ? problems.length
      ? `A few things stood out:\n\n${problems.map(p => `• ${p.charAt(0).toUpperCase()}${p.slice(1)}`).join('\n')}\n\nNone of that says anything about the work you do — but it is what someone deciding whether to call you sees first.`
      : `It works, but there is room to make it do more of the selling for you.`
    : `That matters more than it used to: for most people looking for ${input.industry ? input.industry.toLowerCase() : 'a local service'}, a search is the first place they go, and a business without a site tends to get skipped over.`

  const demoBlock = input.demoUrl
    ? `So I built you something to look at rather than just describing it:\n\n${input.demoUrl}\n\nThat is a concept, not a live site — put together from your details to show what a better version could look like. Nothing is published anywhere and it does not affect your current site.`
    : `I would be glad to put together a concept using your own details so you can see what a better version would look like, rather than me just describing it.`

  const close = `If it is not of interest, just say so and I won't follow up again.\n\nBest,\n${input.senderName}\n${input.agencyName}`
  const footer = `\n\n—\n${input.agencyName}${input.postalAddress ? `\n${input.postalAddress}` : ''}\nReply "no thanks" and you won't hear from me again.`

  return {
    subject,
    body: [greeting, opening, problemBlock, demoBlock, close].join('\n\n') + footer,
    problems,
    warnings,
  }
}

export const OUTREACH_STATUSES = ['draft', 'approved', 'sent', 'opened', 'replied', 'interested', 'declined', 'no_response', 'bounced'] as const
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number]

/** Statuses that mean the conversation is over and nothing further should go out. */
export const TERMINAL_STATUSES: readonly string[] = ['declined', 'bounced']

// Deliberately not re-exporting from ./mailer: this module is imported by a
// client component for OUTREACH_STATUSES, and re-exporting would drag the
// nodemailer transport toward the browser bundle.
export function isEmailProviderConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
