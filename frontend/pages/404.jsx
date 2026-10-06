import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page not found · Weather Dashboard</title>
      </Head>
      <div className="scene scene-default" />
      <div className="app-wrapper">
        <div className="dashboard-container">
          <Header />
          <main className="glass-panel" style={{ padding: 28 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Page not found</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              There&apos;s no weather here. The page may have moved, or the link is mistyped.
            </p>
            <Link href="/" className="search-btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              Back to the dashboard
            </Link>
          </main>
        </div>
      </div>
    </>
  );
}
