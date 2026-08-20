import type { Metadata } from 'next'
import './demo.css'
import { getDemoBySlug } from '../../admin/data'
import type { DemoContent } from '../../../lib/demo'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const demo = await getDemoBySlug(slug)
  // A Claude Code build has no template content, so fall back to the record.
  const name = demo?.content?.businessName ?? demo?.business ?? 'Website concept'
  return {
    title: `${name} — website concept by RCV Agency`,
    description: `A website concept prepared for ${name} by RCV Agency.`,
    // A concept is not the business's real site and must never outrank it.
    robots: { index: false, follow: false },
  }
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const demo = await getDemoBySlug(slug)

  // The slug carries a random suffix, so the link is the capability. A rejected
  // concept still stops rendering, so a withdrawn link cannot keep circulating.
  if (!demo || demo.status === 'rejected' || (!demo.content && !demo.html)) {
    return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter,system-ui,sans-serif', padding: 24, textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 22, letterSpacing: '-.03em', margin: '0 0 8px' }}>This concept is not available.</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>The link may have expired, or the concept may not have been published yet.</p>
      </div>
    </main>
  }

  if (demo.html) {
    // Claude Code returns a complete document. Nesting one inside Next's own
    // <html> only renders because browsers are lenient about it, so lift the
    // stylesheets out of its <head> and mount just the body content.
    const headHtml = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(demo.html)?.[1] ?? ''
    const assets = (headHtml.match(/<link[^>]+rel=["']?(?:stylesheet|preconnect)["']?[^>]*>|<style[\s\S]*?<\/style>/gi) ?? []).join('\n')
    const bodyHtml = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(demo.html)?.[1] ?? demo.html
    const bodyAttrs = /<body([^>]*)>/i.exec(demo.html)?.[1] ?? ''
    const bodyClass = /class=["']([^"']*)["']/i.exec(bodyAttrs)?.[1] ?? ''

    return <div className={`demoBuilt ${bodyClass}`.trim()}
      dangerouslySetInnerHTML={{ __html: assets + bodyHtml }} />
  }

  const c = demo.content as DemoContent
  const p = c.palette
  const tel = c.phone ? `tel:${c.phone.replace(/[^\d+]/g, '')}` : null
  const style = { ['--ink' as string]: p.ink, ['--accent' as string]: p.accent, ['--accentSoft' as string]: p.accentSoft, ['--wash' as string]: p.wash, ['--deep' as string]: p.deep }

  return <div className="demo" style={style as React.CSSProperties}>
    <div className="ribbon"><div className="ribbonInner">
      <b>Website concept</b>
      <span>Prepared for {c.businessName} by RCV Agency · not a live website</span>
      <a href="https://rcvagency.com" target="_blank" rel="noreferrer">About RCV Agency ↗</a>
    </div></div>

    <header className="dNav"><div className="dNavInner">
      <div className="dLogo">{c.businessName.split(' ')[0]}<em>{c.businessName.split(' ').length > 1 ? ' ' + c.businessName.split(' ').slice(1).join(' ') : ''}</em></div>
      <nav className="dNavLinks"><span>Services</span><span>Why us</span><span>Areas</span><span>Contact</span></nav>
      {tel ? <a className="dCall" href={tel}>Call {c.phone}</a> : <a className="dCall" href="#contact">Get in touch</a>}
    </div></header>

    <section className="dHero"><div className="demoWrap dHeroGrid">
      <div>
        <div className="dEyebrow">{c.tagline}</div>
        <h1>{c.headline}<em>{c.headlineAccent}</em></h1>
        <p>{c.subhead}</p>
        <div className="dActions">
          {tel ? <a className="dPrimary" href={tel}>Call {c.phone} →</a> : <a className="dPrimary" href="#contact">Request a quote →</a>}
          <a className="dSecondary" href="#services">See what we do</a>
        </div>
      </div>
      <div className="dHeroArt"><i className="a" /><i className="b" />
        <div><b>{c.businessName}</b><small>{c.serviceArea ?? c.industryLabel}</small></div>
      </div>
    </div></section>

    <section id="services" className="dSection"><div className="demoWrap">
      <div className="dEyebrow">What we do</div>
      <h2>Services</h2>
      <p className="dLead">The work {c.businessName} takes on, set out plainly so a visitor knows in seconds whether they are in the right place.</p>
      <div className="dGrid">{c.services.map((s, i) => <article className="dCard" key={s.title}>
        <span>{String(i + 1).padStart(2, '0')}</span><h3>{s.title}</h3><p>{s.blurb}</p>
      </article>)}</div>
    </div></section>

    <section className="dSection dWhy"><div className="demoWrap">
      <div className="dEyebrow">Why us</div>
      <h2>Why people call back.</h2>
      <div className="dWhyGrid">{c.reasons.map(r => <article key={r.title}><h3>{r.title}</h3><p>{r.blurb}</p></article>)}</div>
    </div></section>

    <section id="contact" className="dCta"><div className="demoWrap dCtaGrid">
      <div>
        <h2>Ready when you are.</h2>
        <p>{c.serviceArea ? `Covering ${c.serviceArea} and the surrounding area.` : 'Get in touch to talk through the job.'}</p>
      </div>
      <div className="dCtaActions">
        {tel && <a href={tel}>Call {c.phone}</a>}
        {c.email && <a href={`mailto:${c.email}`}>Email us</a>}
        {!tel && !c.email && <a href="#">Request a callback</a>}
      </div>
    </div></section>

    <footer className="demoWrap dFoot">
      <span>© {new Date().getFullYear()} {c.businessName}</span>
      <span>Concept design by RCV Agency</span>
    </footer>
  </div>
}
