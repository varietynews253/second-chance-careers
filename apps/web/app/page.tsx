async function getHealth() {
  try {
    const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    const apiBaseUrl = configuredApiUrl.startsWith('http')
      ? configuredApiUrl
      : `https://${configuredApiUrl}`;
    const response = await fetch(`${apiBaseUrl}/health`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }
    return response.json();
  } catch {
    return {
      status: 'offline',
      service: 'second-chance-careers-api',
    };
  }
}

export default async function Home() {
  const health = await getHealth();
  const aiReady = Boolean(process.env.GEMINI_API_KEY);

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Second Chance Careers</p>
        <h1>Build a future beyond the résumé.</h1>
        <p className="lead">
          AI-powered career support for people with criminal records, designed to help match
          candidates with employers who value growth, skills, and second chances.
        </p>

        <div className="cta-row">
          <a href="/register" className="button-link">Get started</a>
          <a href="/jobs" className="button-link secondary">Explore jobs</a>
        </div>

        <div className="status-row">
          <div className="status-pill" data-status={health.status}>
            API status: {health.status}
          </div>
          <div className="status-pill" data-status={aiReady ? 'ok' : 'offline'}>
            Gemini: {aiReady ? 'configured' : 'not configured'}
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article>
          <h2>Resume Builder</h2>
          <p>Create a stronger resume with AI-assisted summaries and skills framing.</p>
        </article>
        <article>
          <h2>Job Matching</h2>
          <p>Find employers aligned with second-chance hiring and inclusive practices.</p>
        </article>
        <article>
          <h2>Career Coaching</h2>
          <p>Track interview prep, goals, and upskilling with guided progression.</p>
        </article>
      </section>
    </main>
  );
}
