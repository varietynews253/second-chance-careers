'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Draft = {
  id: string;
  title: string;
  content: string;
};

export default function ResumePage() {
  const router = useRouter();
  const [title, setTitle] = useState('Career Summary');
  const [role, setRole] = useState('Customer Support Specialist');
  const [summary, setSummary] = useState('I have experience supporting customers, coordinating schedules, and helping teams deliver reliable service in fast-paced environments.');
  const [skills, setSkills] = useState('Customer service, problem solving, communication, scheduling');
  const [output, setOutput] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDrafts() {
      const response = await fetch('/api/resume', { cache: 'no-store' });
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      setDrafts(Array.isArray(data) ? data : []);
    }

    loadDrafts();
  }, [router]);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        role,
        summary,
        skills: skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Unable to generate resume copy.');
      return;
    }

    setOutput(data.output || '');
    setDrafts((current) => [data.draft, ...current]);
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Resume Builder</p>
        <h1>Generate a stronger resume summary</h1>

        <form onSubmit={handleGenerate} className="auth-form">
          <label>
            Resume title
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label>
            Target role
            <input value={role} onChange={(event) => setRole(event.target.value)} />
          </label>

          <label>
            Candidate summary
            <textarea rows={5} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>

          <label>
            Skills
            <input value={skills} onChange={(event) => setSkills(event.target.value)} />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate resume summary'}
          </button>
        </form>

        {output ? (
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h2>Generated draft</h2>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--muted)', lineHeight: 1.7 }}>{output}</p>
          </div>
        ) : null}

        {drafts.length > 0 ? (
          <div style={{ marginTop: '2rem' }}>
            <h2>Saved drafts</h2>
            <div className="jobs-list">
              {drafts.map((draft) => (
                <article key={draft.id} className="job-card">
                  <div>
                    <h2>{draft.title}</h2>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{draft.content}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
