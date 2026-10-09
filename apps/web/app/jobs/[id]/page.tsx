'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  description: string;
  requirements: string[];
  remote?: boolean;
};

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function loadJob() {
      setLoading(true);

      try {
        const [jobResponse, savedResponse] = await Promise.all([
          fetch(`/api/jobs/${params.id}`, { cache: 'no-store' }),
          fetch('/api/saved-jobs', { cache: 'no-store' }),
        ]);

        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          setJob(jobData);
        }

        if (savedResponse.ok) {
          const savedJobsData = await savedResponse.json();
          const ids = new Set((savedJobsData.savedJobs ?? []).map((item: { jobId: string }) => item.jobId));
          setSaved(ids.has(params.id));
        }
      } catch (error) {
        console.error('Failed to load job detail:', error);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [params.id]);

  async function handleSaveToggle() {
    if (!job) return;

    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, action: 'toggle' }),
      });

      const data = await response.json();
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        setStatus(data.error || 'Unable to save this role right now.');
        return;
      }

      setSaved(Boolean(data.saved));
      setStatus(Boolean(data.saved) ? 'Saved for later.' : 'Removed from saved jobs.');
    } catch (error) {
      console.error('Save toggle failed:', error);
      setStatus('Unable to update saved jobs right now.');
    }
  }

  async function handleApply() {
    if (!job) return;

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          status: 'applied',
          source: 'Job detail page',
        }),
      });

      const data = await response.json();
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        setStatus(data.error || 'Unable to apply right now.');
        return;
      }

      setStatus('Application saved successfully.');
    } catch (error) {
      console.error('Apply failed:', error);
      setStatus('Unable to submit your application right now.');
    }
  }

  if (loading) {
    return <main className="page-shell narrow-shell"><section className="hero-card"><p>Loading job details…</p></section></main>;
  }

  if (!job) {
    return (
      <main className="page-shell narrow-shell">
        <section className="hero-card">
          <p className="eyebrow">Not found</p>
          <h1>That role is no longer available.</h1>
          <Link href="/jobs" className="button-link secondary">Back to jobs</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card detail-card">
        <p className="eyebrow">Role details</p>
        <h1>{job.title}</h1>
        <p className="lead">{job.company} • {job.location}</p>

        <div className="job-action-row detail-actions">
          <button type="button" className="secondary" onClick={handleSaveToggle}>{saved ? 'Saved' : 'Save job'}</button>
          <button type="button" className="primary" onClick={handleApply}>Apply now</button>
        </div>

        {status ? <p className="status-note">{status}</p> : null}

        <div className="job-meta">
          <span>{job.salaryRange}</span>
          <span>{job.remote ? 'Remote-friendly' : 'On-site role'}</span>
        </div>

        <div className="job-detail-copy">
          <h2>Role overview</h2>
          <p>{job.description}</p>

          <h2>Requirements</h2>
          <ul>
            {(job.requirements?.length ? job.requirements : ['Strong communication skills', 'Basic digital workflow comfort', 'Ability to work independently and follow through']).map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </div>

        <Link href="/jobs" className="button-link secondary">Back to all jobs</Link>
      </section>
    </main>
  );
}
