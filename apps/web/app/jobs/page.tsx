'use client';

import { useEffect, useState } from 'react';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange: string;
  description: string;
  remote?: boolean;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ [key: string]: string }>({});
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadJobs() {
      const [jobsResponse, savedJobsResponse] = await Promise.all([
        fetch('/api/jobs', { cache: 'no-store' }),
        fetch('/api/saved-jobs', { cache: 'no-store' }),
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData ?? []);
      }

      if (savedJobsResponse.ok) {
        const savedJobsData = await savedJobsResponse.json();
        setSavedJobIds(new Set((savedJobsData.savedJobs ?? []).map((item: { jobId: string }) => item.jobId)));
      }
    }

    loadJobs();
  }, []);

  async function handleSave(job: Job) {
    setSavingId(job.id);
    setStatus((current) => ({ ...current, [job.id]: '' }));

    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, action: 'toggle' }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }

        setStatus((current) => ({ ...current, [job.id]: data.error || 'Unable to save job right now.' }));
        return;
      }

      const isSaved = Boolean(data.saved);
      setSavedJobIds((current) => {
        const next = new Set(current);
        if (isSaved) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
      setStatus((current) => ({ ...current, [job.id]: isSaved ? 'Saved.' : 'Removed from saved jobs.' }));
    } finally {
      setSavingId(null);
    }
  }

  async function handleApply(job: Job) {
    setSavingId(job.id);
    setStatus((current) => ({ ...current, [job.id]: '' }));

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
          source: 'Job board',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }

        setStatus((current) => ({ ...current, [job.id]: data.error || 'Unable to apply right now.' }));
        return;
      }

      setStatus((current) => ({ ...current, [job.id]: 'Application saved.' }));
    } finally {
      setSavingId(null);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    if (!query.trim()) {
      return true;
    }

    const haystack = `${job.title} ${job.company} ${job.description} ${job.location}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Open opportunities</p>
        <h1>Second-chance employers hiring now</h1>

        <div className="search-panel">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search jobs, companies, or keywords"
            aria-label="Search jobs"
          />
          <span className="status-note">{filteredJobs.length} roles</span>
        </div>

        <div className="jobs-list">
          {filteredJobs.map((job) => {
            const isSaved = savedJobIds.has(job.id);

            return (
              <article key={job.id} className="job-card">
                <div>
                  <h2>{job.title}</h2>
                  <p>{job.company}</p>
                  <p>{job.description}</p>
                </div>
                <div className="job-meta">
                  <span>{job.location}</span>
                  <span>{job.salaryRange}</span>
                  <div className="job-action-row">
                    <a href={`/jobs/${job.id}`} className="button-link secondary">View details</a>
                    <button type="button" className="secondary" disabled={savingId === job.id} onClick={() => handleSave(job)}>
                      {isSaved ? 'Saved' : 'Save job'}
                    </button>
                    <button type="button" className="secondary" disabled={savingId === job.id} onClick={() => handleApply(job)}>
                      {savingId === job.id ? 'Applying...' : 'Apply now'}
                    </button>
                  </div>
                  {status[job.id] ? <span className="status-note">{status[job.id]}</span> : null}
                </div>
              </article>
            );
          })}
        </div>

        {!filteredJobs.length ? (
          <div className="empty-state">
            <p>No roles match your search right now. Try a different keyword or browse the full list again.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
