const steps = [
  ["01", "We find you", "We identify local businesses whose current web presence is holding them back."],
  ["02", "We show you", "We build a tailored website concept using your real business information."],
  ["03", "You decide", "No pressure. If you love the direction, we turn the concept into the real site."],
  ["04", "We launch it", "Choose managed hosting with us or receive the complete codebase to host yourself."],
];

export default function Home() {
  return (
    <main>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">
        <div className="text-lg font-semibold tracking-tight">AGENCY<span className="text-indigo-400">OS</span></div>
        <div className="hidden gap-8 text-sm text-zinc-400 md:flex"><a href="#process">Process</a><a href="#work">What we build</a><a href="#contact">Contact</a></div>
        <a href="#contact" className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium hover:bg-white/10">Start a project</a>
      </nav>

      <section className="mx-auto max-w-7xl px-6 pb-28 pt-20 md:pt-32">
        <div className="max-w-4xl">
          <div className="mb-7 inline-flex rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs tracking-wide text-zinc-300">MODERN WEB EXPERIENCES FOR LOCAL BUSINESS</div>
          <h1 className="text-6xl font-semibold leading-[.95] tracking-[-.055em] md:text-8xl">Your business deserves a <span className="text-zinc-500">better first impression.</span></h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">We create modern, conversion-focused websites for local service businesses. First, we show you what your business could look like. Then, if you love it, we build the real thing.</p>
          <div className="mt-10 flex flex-wrap gap-4"><a href="#demo" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">See the concept</a><a href="#process" className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold">How it works</a></div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl px-6 pb-32">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1118] shadow-2xl shadow-indigo-950/20">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4"><i className="h-2.5 w-2.5 rounded-full bg-red-400"/><i className="h-2.5 w-2.5 rounded-full bg-yellow-400"/><i className="h-2.5 w-2.5 rounded-full bg-green-400"/><div className="ml-4 flex-1 rounded-lg bg-white/[.05] px-4 py-2 text-xs text-zinc-500">concept.agencyos.local / precision-hvac</div></div>
          <div className="grid min-h-[520px] items-center gap-10 p-8 md:grid-cols-2 md:p-16">
            <div><div className="text-xs font-medium uppercase tracking-[.2em] text-indigo-300">Website concept</div><h2 className="mt-5 text-5xl font-semibold tracking-[-.045em]">Precision HVAC</h2><p className="mt-5 max-w-lg leading-7 text-zinc-400">A fictional example of how we transform a local service business into a polished, trustworthy digital experience.</p><button className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">Request service</button></div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-400/10 p-8"><div className="h-3 w-32 rounded bg-white/20"/><div className="mt-8 h-28 w-full rounded-2xl bg-white/[.06]"/><div className="mt-5 grid grid-cols-3 gap-3"><div className="h-20 rounded-xl bg-white/[.05]"/><div className="h-20 rounded-xl bg-white/[.05]"/><div className="h-20 rounded-xl bg-white/[.05]"/></div></div>
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-6 pb-32"><div className="max-w-2xl"><div className="text-sm text-indigo-300">A simpler way to buy a website</div><h2 className="mt-4 text-5xl font-semibold tracking-[-.04em]">See it before you commit.</h2></div><div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">{steps.map(([n,t,d])=><div key={n} className="bg-[#0d1118] p-7"><div className="text-sm text-zinc-600">{n}</div><h3 className="mt-14 text-xl font-semibold">{t}</h3><p className="mt-3 text-sm leading-6 text-zinc-500">{d}</p></div>)}</div></section>

      <section id="work" className="border-y border-white/10 bg-white/[.025]"><div className="mx-auto max-w-7xl px-6 py-28"><div className="max-w-3xl"><div className="text-sm text-indigo-300">Built for businesses that rely on trust</div><h2 className="mt-4 text-5xl font-semibold tracking-[-.04em] md:text-6xl">From first impression to first customer.</h2><p className="mt-6 text-lg leading-8 text-zinc-400">Your website is often the first place a potential customer decides whether your business is worth calling. We make that decision easy.</p></div></div></section>

      <section id="contact" className="mx-auto max-w-7xl px-6 py-32"><div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/15 to-transparent p-10 md:p-16"><div className="max-w-2xl"><h2 className="text-5xl font-semibold tracking-[-.04em]">Ready to see what yours could look like?</h2><p className="mt-5 text-zinc-400">Tell us about your business and we&apos;ll start with the concept.</p><a href="mailto:hello@agencyos.com" className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-black">Start a conversation</a></div></div></section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">AGENCYOS — modern websites for local business.</footer>
    </main>
  );
}
