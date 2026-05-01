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
                    // Auth/subscription redirects are handled by the axios interceptor.
                    const status = error?.response?.status;
                    const code = error?.response?.data?.code;
                    const isHandledSubscriptionError =
                        status === 403 &&
                        ['SUBSCRIPTION_REQUIRED', 'PLAN_RESTRICTED'].includes(code);

                    if (status !== 401 && status !== 402 && !isHandledSubscriptionError) {
                        console.error('[swr]', error?.message ?? error);
                    }
                },
            }}
        >
            {children}
        </SWRConfig>
    );
}
