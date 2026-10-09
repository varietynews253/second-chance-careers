import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as { id?: string } | undefined)?.id ?? '';
  const role = (session.user as { role?: string } | undefined)?.role ?? 'candidate';
  const candidateProfile = await prisma.candidateProfile.findUnique({ where: { userId } }).catch(() => null);
  const employerProfile = await prisma.employerProfile.findUnique({ where: { userId } }).catch(() => null);
  const profileComplete = Boolean(candidateProfile || employerProfile);
  const displayName = session.user.name ?? 'friend';
  const isEmployer = role === 'employer';

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Dashboard</p>
        <h1>Welcome back, {displayName}.</h1>
        <p className="lead">
          {isEmployer
            ? 'Build your hiring pipeline, post roles, and keep your open positions organized.'
            : 'Your career momentum starts here. Track roles, refine your resume, and focus on the next step in your path.'}
        </p>
        <div className="feature-grid">
          <article>
            <h2>Profile status</h2>
            <p>{profileComplete ? 'Your profile is complete and ready to use.' : 'Your profile is still being built. Complete it to unlock better matching.'}</p>
          </article>

          {isEmployer ? (
            <>
              <article>
                <h2>Job postings</h2>
                <p>Publish new frontline roles and keep your openings organized in one place.</p>
                <p><a href="/employer/jobs" className="button-link secondary">Manage listings</a></p>
              </article>
              <article>
                <h2>Talent pipeline</h2>
                <p>Review applications, shortlist candidates, and keep hiring momentum moving.</p>
                <p><a href="/employer/applicants" className="button-link secondary">Review applicants</a></p>
              </article>
            </>
          ) : (
            <>
              <article>
                <h2>Applications</h2>
                <p>Track active roles, interview notes, and follow-up reminders.</p>
                <p><a href="/applications" className="button-link secondary">Manage applications</a></p>
              </article>
              <article>
                <h2>Saved jobs</h2>
                <p>Keep the roles you want to revisit in one place and compare options later.</p>
                <p><a href="/saved-jobs" className="button-link secondary">View saved jobs</a></p>
              </article>
              <article>
                <h2>Resume generator</h2>
                <p>Build a tailored resume summary using AI and your profile details.</p>
                <p><a href="/resume" className="button-link secondary">Open resume builder</a></p>
              </article>
              <article>
                <h2>Cover letter</h2>
                <p>Create a polished application letter for each role you want to pursue.</p>
                <p><a href="/cover-letter" className="button-link secondary">Draft letter</a></p>
              </article>
              <article>
                <h2>Interview prep</h2>
                <p>Prepare for likely questions and sharpen your talking points before each interview.</p>
                <p><a href="/interview-prep" className="button-link secondary">Practice now</a></p>
              </article>
              <article>
                <h2>Job matches</h2>
                <p>See which open roles best align with your profile, strengths, and career goals.</p>
                <p><a href="/matches" className="button-link secondary">View matches</a></p>
              </article>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
