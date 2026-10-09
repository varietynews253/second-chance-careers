'use client';

import { useEffect, useState } from 'react';

type ApplicantRecord = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  company: string;
  location: string;
  status: string;
  notes?: string | null;
  source?: string | null;
  updatedAt: string;
};

export default function EmployerApplicantsPage() {
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadApplicants() {
    setLoading(true);
    try {
      const response = await fetch('/api/employer/applicants', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        return;
      }

      const data = await response.json();
      setApplicants(data.applications ?? []);
    } catch {
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplicants();
  }, []);

  async function handleStatusChange(applicantId: string, nextStatus: string) {
    setSavingId(applicantId);

    try {
      const response = await fetch(`/api/employer/applicants/${applicantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        return;
      }

      await loadApplicants();
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Talent pipeline</p>
        <h1>Review candidate applications</h1>
        <p className="lead">Keep track of who has applied for your roles and what stage they are in.</p>

        {loading ? (
          <div className="empty-state">
            <p>Loading applicants...</p>
          </div>
        ) : applicants.length === 0 ? (
          <div className="empty-state">
            <p>No applications yet. Once candidates apply to your roles, they will appear here.</p>
          </div>
        ) : (
          <div className="application-list">
            {applicants.map((applicant) => (
              <article key={applicant.id} className="application-card">
                <div className="application-header">
                  <div>
                    <h2>{applicant.candidateName}</h2>
                    <p>{applicant.candidateEmail}</p>
                  </div>
                  <div className="status-stack">
                    <span className={`status-badge ${applicant.status}`}>{applicant.status}</span>
                    <select
                      value={applicant.status}
                      disabled={savingId === applicant.id}
                      onChange={(event) => handleStatusChange(applicant.id, event.target.value)}
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
                  <span>{applicant.jobTitle}</span>
                  <span>{applicant.company}</span>
                  <span>{applicant.location || 'Location flexible'}</span>
                </div>
                {applicant.notes ? <p className="application-notes">Notes: {applicant.notes}</p> : null}
                {applicant.source ? <p className="application-notes">Source: {applicant.source}</p> : null}
                <p className="application-notes">Updated: {new Date(applicant.updatedAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
