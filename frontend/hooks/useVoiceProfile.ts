import useSWR from 'swr';
import api from '@/lib/api';

export interface VoiceProfile {
    voiceDescription: string;
    toneTags: string[];
    openingStyle: 'question' | 'bold-claim' | 'story' | 'stat' | 'observation';
    sentenceLength: 'short' | 'medium' | 'long';
    avgWordCount: number;
    usesEmoji: boolean;
    usesBulletPoints: boolean;
    signaturePatterns?: string[];
    avoidPatterns?: string[];
    topicBuckets: string[];
    avgVoiceScore?: number;
    totalPostsRated: number;
    analysisVersion?: number;
    lastUpdated?: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data.data);

export function useVoiceProfile() {
    const { data, error, isLoading, mutate } = useSWR<VoiceProfile>(
        '/api/voice/profile',
        fetcher,
        {
            revalidateOnFocus: false, // voice profile doesn't change often
        }
    );

    return {
        profile: data,
        isLoading,
        isError: !!error,
        mutate,
    };
}
