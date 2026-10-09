'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CoverLetterPage() {
  const router = useRouter();
  const [company, setCompany] = useState('North Harbor Solutions');
  const [role, setRole] = useState('Customer Support Specialist');
  const [hiringManager, setHiringManager] = useState('Hiring Manager');
  const [summary, setSummary] = useState('I bring strong customer service experience, problem-solving skills, and a dependable work ethic built through roles that required communication, scheduling, and calm service under pressure.');
  const [motivation, setMotivation] = useState('I am excited to join a company that values growth, service quality, and second chances, and I want to contribute to a team that helps customers feel supported and heard.');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, role, hiringManager, summary, motivation }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Unable to generate cover letter.');
      return;
    }

    setOutput(data.output || '');
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">AI Cover Letter</p>
        <h1>Draft a strong application letter</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Company
            <input value={company} onChange={(event) => setCompany(event.target.value)} />
          </label>

          <label>
            Role
            <input value={role} onChange={(event) => setRole(event.target.value)} />
          </label>

          <label>
            Hiring manager name
            <input value={hiringManager} onChange={(event) => setHiringManager(event.target.value)} />
          </label>

          <label>
            Candidate summary
            <textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>

          <label>
            Motivation
            <textarea rows={5} value={motivation} onChange={(event) => setMotivation(event.target.value)} />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate cover letter'}
          </button>
        </form>

        {output ? (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <h2>Draft letter</h2>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--muted)', lineHeight: 1.8 }}>{output}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
