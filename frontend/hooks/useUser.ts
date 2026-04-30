import useSWR from 'swr';
import api from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────── */
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired' | 'none';
export type SubscriptionTier = 'starter' | 'pro' | 'scale' | 'global' | null;

export interface UserSettings {
    autoGenerate: boolean;
    emailNotifications: boolean;
    postsPerWeek: number;
    timezone: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    profileImageUrl?: string;
    headline?: string;
    subscriptionStatus: SubscriptionStatus;
    subscriptionTier: SubscriptionTier;
    trialStartedAt?: string;
    trialEndsAt?: string;
    lastPaymentAt?: string;
    onboardingCompleted: boolean;
    settings: UserSettings;
    createdAt: string;
    lastActiveAt: string;
}

/* ─── Plan capability map ────────────────────────────────────── */
export const PLAN_LIMITS: Record<string, {
    postsPerWeek: number;
    performanceTracker: boolean;
    label: string;
    price: string;
}> = {
    trial: { postsPerWeek: 3, performanceTracker: false, label: 'Free Trial', price: '₹0' },
    starter: { postsPerWeek: 2, performanceTracker: false, label: 'Starter', price: '₹999/mo' },
    pro: { postsPerWeek: 3, performanceTracker: true, label: 'Pro', price: '₹1,999/mo' },
    scale: { postsPerWeek: 5, performanceTracker: true, label: 'Scale', price: '₹4,999/mo' },
    global: { postsPerWeek: 3, performanceTracker: true, label: 'Global', price: '$29/mo' },
    none: { postsPerWeek: 0, performanceTracker: false, label: 'No plan', price: '—' },
};

/* ─── Derived helpers ────────────────────────────────────────── */
export function getPlanKey(user: User | undefined): string {
    if (!user) return 'none';
    if (user.subscriptionStatus === 'trial') return 'trial';
    return user.subscriptionTier ?? 'none';
}

export function canUsePerformanceTracker(user: User | undefined): boolean {
    return PLAN_LIMITS[getPlanKey(user)]?.performanceTracker ?? false;
}

export function getPostsPerWeek(user: User | undefined): number {
    return PLAN_LIMITS[getPlanKey(user)]?.postsPerWeek ?? 0;
}

export function getTrialDaysLeft(user: User | undefined): number | null {
    if (!user || user.subscriptionStatus !== 'trial' || !user.trialEndsAt) return null;
    return Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86400000));
}

export function isSubscribed(user: User | undefined): boolean {
    return user?.subscriptionStatus === 'active';
}

export function isOnTrial(user: User | undefined): boolean {
    return user?.subscriptionStatus === 'trial';
}

export function isExpired(user: User | undefined): boolean {
    return (
        user?.subscriptionStatus === 'expired' ||
        user?.subscriptionStatus === 'cancelled' ||
        user?.subscriptionStatus === 'none'
    );
}

export function hasAccess(user: User | undefined): boolean {
    return isSubscribed(user) || isOnTrial(user);
}

/* ─── Hook ───────────────────────────────────────────────────── */
const fetcher = (url: string) => api.get(url).then((r) => r.data.data);

export function useUser() {
    const { data, error, isLoading, mutate } = useSWR<User>(
        '/api/auth/me',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,  // dedupe for 60s — user data rarely changes
            shouldRetryOnError: false, // don't retry 401s
        }
    );

    return {
        user: data,
        isLoading,
        isError: !!error,
        mutate,
        // Derived
        planKey: getPlanKey(data),
        canUsePerformanceTracker: canUsePerformanceTracker(data),
        postsPerWeek: getPostsPerWeek(data),
        trialDaysLeft: getTrialDaysLeft(data),
        isSubscribed: isSubscribed(data),
        isOnTrial: isOnTrial(data),
        isExpired: isExpired(data),
        hasAccess: hasAccess(data),
    };
}