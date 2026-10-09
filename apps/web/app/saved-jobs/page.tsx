'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SavedJob = {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location?: string | null;
  salaryRange?: string | null;
  description: string;
  remote?: boolean;
};

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSavedJobs() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/saved-jobs', { cache: 'no-store' });
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          setError('Unable to load your saved roles right now.');
          return;
        }

        const data = await response.json();
        setSavedJobs(data.savedJobs ?? []);
      } catch (err) {
        console.error('Unable to load saved jobs:', err);
        setError('Unable to load your saved roles right now.');
      } finally {
        setLoading(false);
      }
    }

    loadSavedJobs();
  }, []);

  async function handleRemove(jobId: string) {
    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'remove' }),
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        setError('Unable to remove this saved role.');
        return;
      }

      setSavedJobs((current) => current.filter((job) => job.jobId !== jobId));
    } catch (err) {
      console.error('Unable to remove saved job:', err);
      setError('Unable to remove this saved role.');
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Saved jobs</p>
        <h1>Roles you want to revisit</h1>

        {loading ? (
          <div className="empty-state"><p>Loading your saved roles…</p></div>
        ) : error ? (
          <div className="empty-state"><p>{error}</p></div>
        ) : savedJobs.length === 0 ? (
          <div className="empty-state">
            <p>No saved roles yet. Save the jobs that interest you, and they’ll show up here.</p>
          </div>
        ) : (
          <div className="jobs-list">
            {savedJobs.map((savedJob) => (
              <article key={savedJob.id} className="job-card">
                <div>
                  <h2>{savedJob.title}</h2>
                  <p>{savedJob.company}</p>
                  <p>{savedJob.description}</p>
                </div>
                <div className="job-meta">
                  <span>{savedJob.location ?? 'Location flexible'}</span>
                  <span>{savedJob.salaryRange ?? 'Competitive pay'}</span>
                  <div className="job-action-row">
                    <Link href={`/jobs/${savedJob.jobId}`} className="button-link secondary">View details</Link>
                    <button type="button" className="secondary" onClick={() => handleRemove(savedJob.jobId)}>Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
