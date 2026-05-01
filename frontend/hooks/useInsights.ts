import useSWR from 'swr';
import api from '@/lib/api';

export interface TopicInsight {
  topic: string;
  count: number;
  avgImpressions: number;
  avgEngagement: number;
}

export interface PerformanceInsights {
  summary: string;
  topTopics: TopicInsight[];
  recommendations: string[];
}

const fetcher = (url: string) => api.get(url).then((r) => r.data.data as PerformanceInsights);

export function useInsights() {
  const { data, error, isLoading, mutate } = useSWR<PerformanceInsights>(
    '/api/posts/insights',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    insights: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}
