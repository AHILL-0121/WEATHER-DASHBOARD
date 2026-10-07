import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#eef1f5" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0f17" media="(prefers-color-scheme: dark)" />
        {/* Must block rendering to avoid a theme flash; it's a few bytes */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
