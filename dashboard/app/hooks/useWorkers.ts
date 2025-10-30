/**
 * SWR hook for fetching workers data
 */

'use client';

import useSWR from 'swr';
import { GetWorkersResponse } from '@/shared/types/api';

const fetcher = async (url: string): Promise<GetWorkersResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch workers');
  }
  return res.json();
};

export function useWorkers(refreshInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR<GetWorkersResponse>(
    '/api/proxy/workers',
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    workers: data?.workers || [],
    timestamp: data?.timestamp,
    isLoading,
    isError: error,
    mutate,
  };
}
