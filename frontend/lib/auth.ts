const DEV_API_BASE_URL = 'http://localhost:5000';

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function getSafeNextPath(value?: string | null): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export function getPublicApiBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return trimTrailingSlashes(configured);

  if (process.env.NODE_ENV !== 'production') {
    return DEV_API_BASE_URL;
  }

  return null;
}

export function getLinkedInConfigError(): string | null {
  if (getPublicApiBaseUrl()) return null;

  return 'LinkedIn sign-in is not configured yet. Set NEXT_PUBLIC_API_URL in the frontend environment.';
}

export interface LinkedInAuthOptions {
  intent?: string | null;
  next?: string | null;
  tier?: string | null;
}

function appendAuthQuery(
  searchParams: URLSearchParams,
  { intent, next, tier }: LinkedInAuthOptions
) {
  if (intent) searchParams.set('intent', intent);
  if (tier) searchParams.set('tier', tier);

  const safeNext = getSafeNextPath(next);
  if (safeNext) searchParams.set('next', safeNext);
}

export function buildLinkedInEntryPath(options: LinkedInAuthOptions = {}): string {
  const searchParams = new URLSearchParams();
  appendAuthQuery(searchParams, options);

  return searchParams.size ? `/linkedin?${searchParams.toString()}` : '/linkedin';
}

export function buildLinkedInAuthUrl(
  options: LinkedInAuthOptions = {}
): string | null {
  const baseUrl = getPublicApiBaseUrl();
  if (!baseUrl) return null;

  const authUrl = new URL('api/auth/linkedin', `${baseUrl}/`);
  appendAuthQuery(authUrl.searchParams, options);

  return authUrl.toString();
}
