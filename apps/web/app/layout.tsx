import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'Second Chance Careers',
  description: 'Helping people with criminal records find second-chance employment opportunities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
