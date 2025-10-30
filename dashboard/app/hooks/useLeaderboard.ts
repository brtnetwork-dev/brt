/**
 * SWR hook for fetching leaderboard data
 */

'use client';

import useSWR from 'swr';
import { GetLeaderboardResponse } from '@/shared/types/api';

const fetcher = async (url: string): Promise<GetLeaderboardResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  return res.json();
};

export function useLeaderboard(refreshInterval: number = 10000) {
  const { data, error, isLoading, mutate } = useSWR<GetLeaderboardResponse>(
    '/api/leaderboard',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    leaderboard: data?.leaderboard || [],
    timestamp: data?.timestamp,
    isLoading,
    isError: error,
    mutate,
  };
}
