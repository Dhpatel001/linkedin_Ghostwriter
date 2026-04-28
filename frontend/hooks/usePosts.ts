import useSWR from 'swr';
import api from '@/app/fonts/lib/api';

export type PostStatus = 'pending' | 'approved' | 'discarded' | 'posted';

export interface Post {
    _id: string;
    content: string;
    editedContent?: string;
    topic: string;
    hook: string;
    status: PostStatus;
    voiceScore?: number;
    generatedAt: string;
    approvedAt?: string;
    postedAt?: string;
    performance?: {
        impressions?: number;
        likes?: number;
        comments?: number;
        shares?: number;
    };
}

export interface PostsResponse {
    posts: Post[];
    total: number;
    page: number;
    pages: number;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data.data);

export function usePosts(status?: PostStatus) {
    const key = status ? `/api/posts?status=${status}` : '/api/posts';

    const { data, error, isLoading, mutate } = useSWR<Post[]>(key, fetcher, {
        refreshInterval: 30000, // refresh every 30s
        revalidateOnFocus: true,
        // Return empty array shape while loading so components never get undefined
        fallbackData: [],
    });

    return {
        posts: data ?? [],
        isLoading,
        isError: !!error,
        mutate,
    };
}

/**
 * Fetches counts for each status tab — used by the dashboard tab badges.
 */
export function usePostCounts() {
    const { posts: pending } = usePosts('pending');
    const { posts: approved } = usePosts('approved');
    const { posts: posted } = usePosts('posted');

    return {
        pending: pending.length,
        approved: approved.length,
        posted: posted.length,
    };
}