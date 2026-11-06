import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { StatusBanner } from '@/components/StatusBanner';
import { ProductionStorageRequired } from '@/components/ProductionStorageRequired';
import { isSupabaseConfigured } from '@/lib/supabase/server';

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
  const isProduction =
    process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const showProductionError =
    isProduction &&
    !isSupabaseConfigured &&
    process.env.ALLOW_IN_MEMORY_MOCK !== 'true' &&
    process.env.NEXT_PHASE !== 'phase-production-build';

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {showProductionError ? (
          <ProductionStorageRequired />
        ) : (
          <>
            <StatusBanner />
            <Navbar />
            <main>{children}</main>
          </>
        )}
      </body>
    </html>
  );
}
