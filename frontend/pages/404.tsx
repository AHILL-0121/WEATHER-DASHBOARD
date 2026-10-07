import Head from 'next/head';
import Link from 'next/link';
import { CloudSun } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found · Weather Dashboard</title>
      </Head>
      <main className="grid min-h-screen place-items-center px-4">
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-7 shadow-card">
          <span className="grid size-9 place-items-center rounded-lg bg-foreground text-background">
            <CloudSun className="size-5" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h1 className="mt-4 mb-2 text-[22px] font-semibold">Page not found</h1>
          <p className="mb-5 text-muted-foreground">
            There&apos;s no weather here. The page may have moved, or the link is mistyped.
          </p>
          <Link
            href="/"
            className="inline-flex rounded-[10px] bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Back to the dashboard
          </Link>
        </section>
      </main>
    </>
  );
}
