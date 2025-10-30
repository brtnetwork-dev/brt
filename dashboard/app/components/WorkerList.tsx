/**
 * WorkerList component
 * Displays a list of all active workers with their current status
 */

'use client';

import React from 'react';

interface Worker {
  worker: string;
  status: 'active' | 'inactive' | 'offline';
  hashrate1m: number;
  hashrate10m: number;
  totalAccepted: number;
  totalRejected: number;
  totalPoints: number;
  lastSeenAt: string;
}

interface WorkerListProps {
  workers: Worker[];
}

export function WorkerList({ workers }: WorkerListProps) {
  if (workers.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No workers found</p>
        <p style={styles.emptySubtext}>Start mining to see your worker appear here</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {workers.map((worker) => (
          <WorkerCard key={worker.worker} worker={worker} />
        ))}
      </div>
    </div>
  );
}

function WorkerCard({ worker }: { worker: Worker }) {
  const statusColor = {
    active: '#4caf50',
    inactive: '#ff9800',
    offline: '#f44336',
  }[worker.status];

  const lastSeen = new Date(worker.lastSeenAt);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);

  const timeAgo =
    minutesAgo < 1
      ? 'Just now'
      : minutesAgo < 60
      ? `${minutesAgo}m ago`
      : `${Math.floor(minutesAgo / 60)}h ago`;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.workerName}>{worker.worker}</div>
        <div style={{ ...styles.statusBadge, backgroundColor: statusColor }}>
          {worker.status}
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Hashrate (1m):</span>
          <span style={styles.statValue}>{worker.hashrate1m.toFixed(2)} H/s</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Hashrate (10m):</span>
          <span style={styles.statValue}>{worker.hashrate10m.toFixed(2)} H/s</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Accepted:</span>
          <span style={styles.statValue}>{worker.totalAccepted}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Rejected:</span>
          <span style={styles.statValue}>{worker.totalRejected}</span>
        </div>
        <div style={styles.statRow}>
          <span style={styles.statLabel}>Points:</span>
          <span style={{ ...styles.statValue, fontWeight: 'bold' as const, color: '#1976d2' }}>
            {worker.totalPoints}
          </span>
        </div>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.lastSeen}>Last seen: {timeAgo}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e0e0e0',
  },
  workerName: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    color: 'white',
    textTransform: 'uppercase' as const,
  },
  stats: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginBottom: '15px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  statValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500' as const,
  },
  cardFooter: {
    paddingTop: '10px',
    borderTop: '1px solid #e0e0e0',
  },
  lastSeen: {
    fontSize: '12px',
    color: '#999',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '2px dashed #ddd',
  },
  emptyText: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '10px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999',
  },
};
