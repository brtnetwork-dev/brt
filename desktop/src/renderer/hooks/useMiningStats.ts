/**
 * React hook for real-time mining statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { XMRigStats } from '../../main/xmrig-manager';

interface UseMiningStatsOptions {
  pollingInterval?: number; // Milliseconds between updates
  enabled?: boolean; // Enable/disable polling
}

interface MiningStatsState {
  stats: XMRigStats | null;
  isRunning: boolean;
  loading: boolean;
  error: Error | null;
}

export function useMiningStats(
  options: UseMiningStatsOptions = {}
): MiningStatsState & {
  refresh: () => Promise<void>;
} {
  const { pollingInterval = 5000, enabled = true } = options;

  const [state, setState] = useState<MiningStatsState>({
    stats: null,
    isRunning: false,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      if (!window.electron) {
        throw new Error('Electron API not available');
      }

      const [status, stats] = await Promise.all([
        window.electron.mining.getStatus(),
        window.electron.mining.getStats(),
      ]);

      setState({
        stats,
        isRunning: status,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to fetch mining stats:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchStats();

    // Set up polling interval
    const interval = setInterval(fetchStats, pollingInterval);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, pollingInterval, fetchStats]);

  return {
    ...state,
    refresh: fetchStats,
  };
}
