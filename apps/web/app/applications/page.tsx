'use client';

import { useEffect, useState } from 'react';

type ApplicationRecord = {
  id: string;
  jobTitle: string;
  company: string;
  location?: string | null;
  status: 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  notes?: string | null;
  nextStep?: string | null;
  followUpDate?: string | null;
  source?: string | null;
  createdAt: string;
};

const initialForm = {
  jobTitle: '',
  company: '',
  location: '',
  status: 'saved' as ApplicationRecord['status'],
  notes: '',
  nextStep: '',
  followUpDate: '',
  source: '',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadApplications() {
    try {
      const response = await fetch('/api/applications', { cache: 'no-store' });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setApplications(data.applications ?? []);
    } catch {
      setApplications([]);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          followUpDate: form.followUpDate || undefined,
          nextStep: form.nextStep || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to save this application.');
        return;
      }

      setApplications((current) => [data.application, ...current]);
      setForm(initialForm);
    } catch {
      setError('Unable to save this application right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(applicationId: string, nextStatus: string) {
    setSavingId(applicationId);

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        return;
      }

      await loadApplications();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Applications</p>
        <h1>Keep your job search organized</h1>
        <p className="lead">Track roles you want to pursue, where you are in the process, and notes for follow-up.</p>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-grid">
            <label>
              Role title
              <input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} placeholder="Operations coordinator" />
            </label>
            <label>
              Company
              <input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="North Harbor Industries" />
            </label>
            <label>
              Location
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Remote / Seattle, WA" />
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ApplicationRecord['status'] })}>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          <label>
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} placeholder="Follow up with hiring manager, list required skills, or note interview prep." />
          </label>

          <div className="form-grid">
            <label>
              Next step
              <input value={form.nextStep} onChange={(event) => setForm({ ...form, nextStep: event.target.value })} placeholder="Send thank-you note, prepare portfolio, call recruiter" />
            </label>
            <label>
              Follow-up date
              <input type="date" value={form.followUpDate} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} />
            </label>
          </div>

          <label>
            Source
            <input value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })} placeholder="Indeed, company site, referral" />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save application'}</button>
        </form>

        <div className="application-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <p>You have not logged any applications yet. Save your first role to start tracking your pipeline.</p>
            </div>
          ) : (
            applications.map((application) => (
              <article key={application.id} className="application-card">
                <div className="application-header">
                  <div>
                    <h2>{application.jobTitle}</h2>
                    <p>{application.company}</p>
                  </div>
                  <div className="status-stack">
                    <span className={`status-badge ${application.status}`}>{application.status}</span>
                    <select
                      value={application.status}
                      disabled={savingId === application.id}
                      onChange={(event) => handleStatusChange(application.id, event.target.value)}
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="application-meta">
                  {application.location ? <span>{application.location}</span> : null}
                  {application.source ? <span>Source: {application.source}</span> : null}
                  {application.followUpDate ? <span>Follow-up: {new Date(application.followUpDate).toLocaleDateString()}</span> : null}
                </div>

                {application.notes ? <p className="application-notes">{application.notes}</p> : null}
                {application.nextStep ? <p className="application-notes">Next step: {application.nextStep}</p> : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
