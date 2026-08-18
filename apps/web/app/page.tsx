export default function Home() {
  return (
    <main>
      <div className="container">
        <nav className="nav"><a className="logo" href="/">RCV.</a><div className="navlinks"><a href="#work">What we build</a><a href="#process">Process</a><a href="#hosting">Hosting</a></div><a className="navcta" href="#contact">Start a project</a></nav>
      </div>

      <section className="hero"><div className="container">
        <span className="eyebrow">Websites for ambitious local businesses</span>
        <h1>Your business deserves a <span className="gradient">better first impression.</span></h1>
        <p>RCV Agency turns outdated local-business websites into modern digital experiences designed to earn trust, generate calls, and win customers.</p>
        <div className="buttons"><a className="button" href="#demo">See what we could build →</a><a className="button secondary" href="#contact">Start a project</a></div>
      </div></section>

      <section id="demo" className="section"><div className="container">
        <span className="eyebrow">The concept</span><h2>We don't just tell you.<br/>We show you.</h2>
        <p className="section-intro">Before you commit to a website, we can create a tailored concept around your actual business. Your services. Your market. Your story. A real preview of what your next website could feel like.</p>
        <div className="demo"><div className="browserbar"><span className="dot"/><span className="dot"/><span className="dot"/></div><div className="mocksite"><small>HARRISON & SONS • INDIANAPOLIS</small><h3>Comfort at home. Service you can trust.</h3><p>Modern service. Local expertise. A website built to make the next call obvious.</p><div className="buttons" style={{justifyContent:'flex-start',marginTop:25}}><span className="button">Request service →</span></div><div className="mockgrid"><div className="card"><strong>24/7 Service</strong><span>Help when your customers need it.</span></div><div className="card"><strong>4.9 ★</strong><span>Trusted by local homeowners.</span></div><div className="card"><strong>15+ Years</strong><span>Experience in the community.</span></div></div></div></div>
      </div></section>

      <section id="process" className="section"><div className="container"><span className="eyebrow">How it works</span><h2>From first impression<br/>to finished website.</h2><div className="steps"><div className="step"><b>01</b><h3>We find you</h3><p>We identify local businesses where a better website could make a meaningful difference.</p></div><div className="step"><b>02</b><h3>We show you</h3><p>We research your business and create a custom website concept using your real information.</p></div><div className="step"><b>03</b><h3>You decide</h3><p>If you love the direction, we turn the concept into your complete production website.</p></div><div className="step"><b>04</b><h3>We launch</h3><p>Host with RCV Agency for a simple recurring fee, or take the complete code and host it yourself.</p></div></div></div></section>

      <section id="hosting" className="section"><div className="container"><span className="eyebrow">No lock-in</span><h2>Your website.<br/>Your choice.</h2><p className="section-intro">We can host and maintain your website for a simple recurring fee, or hand over the complete project so you can host it anywhere you choose. The website belongs to you.</p></div></section>

      <section id="contact" className="section"><div className="container"><span className="eyebrow">Let's build</span><h2>Ready for a better<br/>first impression?</h2><p className="section-intro">Tell us about your business and we'll show you what's possible.</p><div className="buttons" style={{justifyContent:'flex-start',marginTop:30}}><a className="button" href="mailto:hello@rcvagency.com">hello@rcvagency.com →</a></div></div></section>

      <footer className="container footer"><span>© 2026 RCV Agency</span><span>Built with intention.</span></footer>
    </main>
  );
}
