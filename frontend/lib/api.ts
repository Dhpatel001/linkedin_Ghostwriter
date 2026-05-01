import axios from 'axios';
import { getPublicApiBaseUrl } from '@/lib/auth';

const api = axios.create({
    baseURL: getPublicApiBaseUrl() ?? undefined,
    withCredentials: true, // sends httpOnly cookie automatically — never remove this
    timeout: 15000,
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;
        const code = err.response?.data?.code;
        if (status === 401) {
            // Session expired — send to login, not home
            if (typeof window !== 'undefined') {
                window.location.href = '/login?error=session_expired';
            }
        }
        if (
            status === 402 ||
            (status === 403 && ['SUBSCRIPTION_REQUIRED', 'PLAN_RESTRICTED'].includes(code))
        ) {
            // Subscription or plan restriction — send users to billing
            if (typeof window !== 'undefined') {
                window.location.href = '/billing?reason=trial_ended';
            }
        }
        return Promise.reject(err);
    }
);

export default api;
