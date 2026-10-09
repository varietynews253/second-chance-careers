'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InterviewPrepPage() {
  const router = useRouter();
  const [role, setRole] = useState('Customer Support Specialist');
  const [company, setCompany] = useState('North Harbor Solutions');
  const [summary, setSummary] = useState('I have a background in customer-facing service, problem-solving, and supporting fast-moving teams while maintaining excellent communication and reliability.');
  const [challenge, setChallenge] = useState('I want to confidently explain my background and show employers that I am focused on growth and accountability.');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/interview-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, company, summary, challenge }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Unable to generate interview prep.');
      return;
    }

    setOutput(data.output || '');
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Interview Prep</p>
        <h1>Prepare for your next interview</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Role
            <input value={role} onChange={(event) => setRole(event.target.value)} />
          </label>

          <label>
            Company
            <input value={company} onChange={(event) => setCompany(event.target.value)} />
          </label>

          <label>
            Background summary
            <textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>

          <label>
            Interview concern
            <textarea rows={4} value={challenge} onChange={(event) => setChallenge(event.target.value)} />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Preparing...' : 'Generate interview plan'}
          </button>
        </form>

        {output ? (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <h2>Interview prep plan</h2>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--muted)', lineHeight: 1.8 }}>{output}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
