import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { StatusBanner } from '@/components/StatusBanner';

export const metadata: Metadata = {
  title: 'TrueNorth | Pre-Publication Brand Governance',
  description:
    'Hybrid pre-publication brand governance engine for Inkloom AI Hackathon. Validates tone, terminology, claims, and facts with strict source citations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <StatusBanner />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
