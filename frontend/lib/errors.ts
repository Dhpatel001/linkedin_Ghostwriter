interface ApiErrorShape {
  response?: {
    data?: {
      error?: unknown;
    };
  };
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiErrorShape | null;
  const apiMessage = apiError?.response?.data?.error;

  if (typeof apiMessage === 'string' && apiMessage.trim()) {
    return apiMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
