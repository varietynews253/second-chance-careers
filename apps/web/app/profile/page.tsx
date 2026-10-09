'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProfileForm = {
  role: 'candidate' | 'employer';
  headline: string;
  summary: string;
  skills: string;
  experience: string;
  companyName: string;
  industry: string;
  description: string;
};

const initialForm: ProfileForm = {
  role: 'candidate',
  headline: '',
  summary: '',
  skills: '',
  experience: '',
  companyName: '',
  industry: '',
  description: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (!data) return;

      const role = data.role === 'employer' ? 'employer' : 'candidate';
      setForm((current) => ({
        ...current,
        role,
        headline: data.candidate?.headline ?? '',
        summary: data.candidate?.summary ?? '',
        skills: (data.candidate?.skills ?? []).join(', '),
        experience: data.candidate?.experience ?? '',
        companyName: data.employer?.companyName ?? '',
        industry: data.employer?.industry ?? '',
        description: data.employer?.description ?? '',
      }));
    }

    loadProfile();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...form,
      skills: form.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || 'Unable to save profile.');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="page-shell narrow-shell">
      <section className="hero-card">
        <p className="eyebrow">Profile</p>
        <h1>Tell us about your goals</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            I am a
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as 'candidate' | 'employer' })}>
              <option value="candidate">Candidate</option>
              <option value="employer">Employer</option>
            </select>
          </label>

          {form.role === 'candidate' ? (
            <>
              <label>
                Headline
                <input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} placeholder="Customer support specialist with 5+ years in service and logistics" />
              </label>

              <label>
                Summary
                <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={5} placeholder="Describe your background, strengths, and what you’re looking for next." />
              </label>

              <label>
                Skills
                <input value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Customer service, inventory, scheduling, teamwork" />
              </label>

              <label>
                Experience
                <textarea value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} rows={5} placeholder="Add your work history, achievements, or certifications." />
              </label>
            </>
          ) : (
            <>
              <label>
                Company name
                <input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} placeholder="North Harbor Solutions" />
              </label>

              <label>
                Industry
                <input value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} placeholder="Logistics, healthcare, manufacturing" />
              </label>

              <label>
                Company description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={5} placeholder="Tell candidates what makes your organization a great place to work." />
              </label>
            </>
          )}

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Saving profile...' : 'Save profile'}
          </button>
        </form>
      </section>
    </main>
  );
}
