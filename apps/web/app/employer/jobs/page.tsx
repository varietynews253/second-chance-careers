'use client';

import { useEffect, useState } from 'react';

type JobPost = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  remote: boolean;
  salaryRange?: string | null;
  description: string;
  requirements: string[];
  createdAt: string;
};

const initialForm = {
  title: '',
  company: '',
  location: '',
  remote: false,
  salaryRange: '',
  description: '',
  requirements: '',
};

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch('/api/jobs/manage', { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
          }
          return;
        }

        const data = await response.json();
        setJobs(data.jobs ?? []);
      } catch {
        setJobs([]);
      }
    }

    loadJobs();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jobs/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requirements: form.requirements
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to publish this role.');
        return;
      }

      setJobs((current) => [data.job, ...current]);
      setForm(initialForm);
    } catch {
      setError('Unable to publish this role right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Employer tools</p>
        <h1>Manage your job postings</h1>
        <p className="lead">Share open roles and keep your hiring pipeline visible in one place.</p>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-grid">
            <label>
              Job title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Warehouse operations lead" />
            </label>
            <label>
              Company
              <input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="North Harbor Solutions" />
            </label>
            <label>
              Location
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Chicago, IL / Remote" />
            </label>
            <label>
              Salary range
              <input value={form.salaryRange} onChange={(event) => setForm({ ...form, salaryRange: event.target.value })} placeholder="$40k - $52k" />
            </label>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={form.remote} onChange={(event) => setForm({ ...form, remote: event.target.checked })} />
            Remote-friendly role
          </label>

          <label>
            Description
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} placeholder="Describe the role, responsibilities, and what success looks like." />
          </label>

          <label>
            Requirements
            <input value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} placeholder="customer service, scheduling, inventory, teamwork" />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>{loading ? 'Publishing...' : 'Publish role'}</button>
        </form>

        <div className="application-list">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <p>You have not published any roles yet. Start with your first open position.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <article key={job.id} className="application-card">
                <div className="application-header">
                  <div>
                    <h2>{job.title}</h2>
                    <p>{job.company}</p>
                  </div>
                  <span className="status-badge applied">{job.remote ? 'Remote' : 'On-site'}</span>
                </div>
                <div className="application-meta">
                  <span>{job.location || 'Location flexible'}</span>
                  <span>{job.salaryRange || 'Compensation flexible'}</span>
                </div>
                <p className="application-notes">{job.description}</p>
                {job.requirements.length > 0 ? (
                  <p className="application-notes">Requirements: {job.requirements.join(', ')}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
