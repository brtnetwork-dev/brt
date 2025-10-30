/**
 * Root layout for Next.js 14 App Router
 */

import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BRT Dashboard',
  description: 'Real-time mining contribution dashboard',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          <header style={styles.header}>
            <h1 style={styles.title}>BRT Dashboard</h1>
            <p style={styles.subtitle}>Real-time worker contribution tracking</p>
          </header>
          <main style={styles.main}>{children}</main>
          <footer style={styles.footer}>
            <p>Powered by XMRig | GPLv3 Licensed</p>
          </footer>
        </div>
      </body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '20px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold' as const,
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    opacity: 0.9,
  },
  main: {
    flex: 1,
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    padding: '20px',
  },
  footer: {
    backgroundColor: '#333',
    color: 'white',
    textAlign: 'center' as const,
    padding: '15px',
    fontSize: '12px',
  },
};
