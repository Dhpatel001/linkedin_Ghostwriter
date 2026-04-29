import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // sends httpOnly cookie automatically — never remove this
    timeout: 15000,
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err.response?.status;
        if (status === 401) {
            // Session expired — send to login, not home
            if (typeof window !== 'undefined') {
                window.location.href = '/login?error=session_expired';
            }
        }
        if (status === 402) {
            // Trial ended or subscription required
            if (typeof window !== 'undefined') {
                window.location.href = '/billing?reason=trial_ended';
            }
        }
        return Promise.reject(err);
    }
);

export default api;