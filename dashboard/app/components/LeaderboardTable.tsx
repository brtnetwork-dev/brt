/**
 * LeaderboardTable component
 * Displays top contributors ranked by points
 */

'use client';

import React from 'react';

interface LeaderboardEntry {
  rank: number;
  worker: string;
  totalPoints: number;
  totalHashes: number;
  averageHashrate: number;
  uptimePercentage: number;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p style={styles.emptyText}>No leaderboard entries yet</p>
        <p style={styles.emptySubtext}>Start mining to compete for the top spot!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.headerRow}>
              <th style={{ ...styles.th, width: '60px', textAlign: 'center' as const }}>Rank</th>
              <th style={styles.th}>Worker</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }}>Points</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }}>Avg Hashrate</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }}>Total Hashes</th>
              <th style={{ ...styles.th, textAlign: 'right' as const }}>Uptime %</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.worker} style={styles.row}>
                <td style={{ ...styles.td, textAlign: 'center' as const }}>
                  <RankBadge rank={entry.rank} />
                </td>
                <td style={styles.td}>
                  <span style={styles.workerName}>{entry.worker}</span>
                </td>
                <td style={{ ...styles.td, textAlign: 'right' as const }}>
                  <span style={styles.points}>{entry.totalPoints.toLocaleString()}</span>
                </td>
                <td style={{ ...styles.td, textAlign: 'right' as const }}>
                  {entry.averageHashrate.toFixed(2)} H/s
                </td>
                <td style={{ ...styles.td, textAlign: 'right' as const }}>
                  {formatLargeNumber(entry.totalHashes)}
                </td>
                <td style={{ ...styles.td, textAlign: 'right' as const }}>
                  <span style={getUptimeColor(entry.uptimePercentage)}>
                    {entry.uptimePercentage.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span style={{ ...styles.rankBadge, backgroundColor: '#ffd700' }}>🥇 {rank}</span>;
  } else if (rank === 2) {
    return <span style={{ ...styles.rankBadge, backgroundColor: '#c0c0c0' }}>🥈 {rank}</span>;
  } else if (rank === 3) {
    return <span style={{ ...styles.rankBadge, backgroundColor: '#cd7f32' }}>🥉 {rank}</span>;
  } else {
    return <span style={{ ...styles.rankBadge, backgroundColor: '#e0e0e0' }}>{rank}</span>;
  }
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}

function getUptimeColor(uptime: number): React.CSSProperties {
  if (uptime >= 90) {
    return { color: '#4caf50', fontWeight: 'bold' as const };
  } else if (uptime >= 70) {
    return { color: '#ff9800', fontWeight: 'bold' as const };
  } else {
    return { color: '#f44336', fontWeight: 'bold' as const };
  }
}

const styles = {
  container: {
    width: '100%',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  headerRow: {
    backgroundColor: '#1976d2',
    color: 'white',
  },
  th: {
    padding: '15px',
    textAlign: 'left' as const,
    fontWeight: 'bold' as const,
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  row: {
    borderBottom: '1px solid #e0e0e0',
    transition: 'background-color 0.2s',
    cursor: 'default' as const,
  },
  td: {
    padding: '15px',
    fontSize: '14px',
    color: '#333',
  },
  rankBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: 'bold' as const,
    fontSize: '12px',
    color: '#333',
    minWidth: '40px',
  },
  workerName: {
    fontWeight: '500' as const,
    color: '#1976d2',
  },
  points: {
    fontWeight: 'bold' as const,
    color: '#1976d2',
    fontSize: '16px',
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
