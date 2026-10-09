import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getMatches() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const response = await fetch(new URL('/api/matches', baseUrl), {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { matches: [], message: 'Unable to load matches right now.' };
    }

    return response.json();
  } catch {
    return { matches: [], message: 'Unable to load matches right now.' };
  }
}

export default async function MatchesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const { matches, message, profile } = await getMatches();

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Job matches</p>
        <h1>Roles aligned to your experience</h1>

        {!profile ? (
          <div className="empty-state">
            <p>{message}</p>
            <a href="/profile" className="button-link secondary">Complete your profile</a>
          </div>
        ) : (
          <>
            <p className="lead">{message}</p>
            <div className="jobs-list">
              {matches.length === 0 ? (
                <div className="empty-state">
                  <p>No matches yet. Add more skills or update your profile to improve your recommendations.</p>
                </div>
              ) : (
                matches.map((job: any) => (
                  <article key={job.id} className="job-card">
                    <div>
                      <div className="job-header-line">
                        <h2>{job.title}</h2>
                        <span className="score-badge">{job.matchScore}% match</span>
                      </div>
                      <p className="job-company">{job.company}</p>
                      <p>{job.description}</p>
                    </div>
                    <div className="job-meta">
                      <span>{job.location || 'Remote friendly'}</span>
                      <span>{job.salaryRange || 'Compensation discussed'}</span>
                    </div>
                    <p className="match-reason">Why it fits: {job.reason}</p>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
