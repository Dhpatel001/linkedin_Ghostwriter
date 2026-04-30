'use client';

import { SWRConfig } from 'swr';
import api from '@/lib/api';

const globalFetcher = (url: string) => api.get(url).then((r) => r.data.data);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                fetcher: globalFetcher,
                revalidateOnFocus: true,
                revalidateOnReconnect: true,
                errorRetryCount: 2,
                errorRetryInterval: 5000,
                dedupingInterval: 2000,
                onError: (error) => {
                    // 401/402 are handled by the axios interceptor — don't log them
                    const status = error?.response?.status;
                    if (status !== 401 && status !== 402) {
                        console.error('[swr]', error?.message ?? error);
                    }
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}