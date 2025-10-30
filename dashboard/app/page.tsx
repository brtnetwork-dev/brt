/**
 * Main dashboard page
 */

'use client';

import React from 'react';
import { WorkerList } from './components/WorkerList';
import { LeaderboardTable } from './components/LeaderboardTable';
import { useWorkers } from './hooks/useWorkers';
import { useLeaderboard } from './hooks/useLeaderboard';

export default function DashboardPage() {
  const { workers, isLoading: workersLoading } = useWorkers(5000);
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard(10000);

  // Calculate aggregate stats
  const totalHashrate = workers.reduce((sum, w) => sum + w.hashrate1m, 0);
  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const totalShares = workers.reduce((sum, w) => sum + w.totalAccepted, 0);

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Pool Statistics</h2>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Hashrate</div>
            <div style={styles.statValue}>
              {workersLoading ? '...' : totalHashrate.toFixed(2)} H/s
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Active Workers</div>
            <div style={styles.statValue}>
              {workersLoading ? '...' : activeWorkers} / {workers.length}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Shares</div>
            <div style={styles.statValue}>
              {workersLoading ? '...' : totalShares.toLocaleString()}
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Workers</div>
            <div style={styles.statValue}>{workersLoading ? '...' : workers.length}</div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Active Workers</h2>
        {workersLoading ? (
          <div style={styles.loading}>Loading workers...</div>
        ) : (
          <WorkerList workers={workers} />
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Leaderboard</h2>
        {leaderboardLoading ? (
          <div style={styles.loading}>Loading leaderboard...</div>
        ) : (
          <LeaderboardTable entries={leaderboard} />
        )}
      </section>

      <section style={styles.infoSection}>
        <h3>Getting Started</h3>
        <ol style={styles.instructions}>
          <li>Download and install the BRT desktop application</li>
          <li>Configure your pool URL and wallet address</li>
          <li>Start mining to see your contribution appear here</li>
          <li>Earn points based on your accepted shares</li>
          <li>Compete on the leaderboard with other workers</li>
        </ol>
      </section>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '25px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '22px',
    fontWeight: 'bold' as const,
    color: '#1976d2',
  },
  placeholder: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '2px dashed #ddd',
  },
  placeholderSubtext: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '6px',
    textAlign: 'center' as const,
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold' as const,
    color: '#1976d2',
  },
  infoSection: {
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    padding: '25px',
    border: '1px solid #90caf9',
  },
  instructions: {
    lineHeight: '1.8',
    paddingLeft: '20px',
    margin: '15px 0 0 0',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  },
};
