function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '';
}

/**
 * Strips Convex request-ID wrappers and returns the server-thrown message.
 */
export function extractConvexErrorMessage(error: unknown): string {
  const raw = getRawErrorMessage(error);
  if (!raw) {
    return '';
  }

  const uncaughtMatch = raw.match(
    /Uncaught Error:\s*([\s\S]*?)(?:\n\s+at |\nCalled by client|$)/,
  );
  if (uncaughtMatch?.[1]) {
    return uncaughtMatch[1].trim();
  }

  const serverErrorMatch = raw.match(
    /Server Error[\s\S]*?Error:\s*([\s\S]*?)(?:\n\s+at |\nCalled by client|$)/,
  );
  if (serverErrorMatch?.[1]) {
    return serverErrorMatch[1].trim();
  }

  if (raw.includes('[CONVEX')) {
    return '';
  }

  return raw.trim();
}

export function isNetworkError(error: unknown): boolean {
  const raw = getRawErrorMessage(error).toLowerCase();
  return (
    raw.includes('failed to fetch') ||
    raw.includes('networkerror') ||
    raw.includes('network error') ||
    raw.includes('load failed') ||
    raw.includes('err_internet_disconnected') ||
    raw.includes('unable to connect')
  );
}
