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

  let cleaned = raw.replace(/\s*Called by client\s*$/i, '').trim();

  const uncaughtMatch = cleaned.match(/Uncaught Error:\s*([\s\S]*?)(?:\n\s+at\s|\s*$)/);
  if (uncaughtMatch?.[1]?.trim()) {
    return uncaughtMatch[1].trim();
  }

  const withoutConvexPrefix = cleaned
    .replace(/^\[CONVEX\s+[QMA?]\([^)]*\)\]\s*/i, '')
    .replace(/\[Request ID:\s*[^\]]+\]\s*/gi, '')
    .trim();

  const withoutServerErrorLabel = withoutConvexPrefix
    .replace(/^Server Error\s*/i, '')
    .trim();

  if (withoutServerErrorLabel) {
    return withoutServerErrorLabel;
  }

  return cleaned.trim();
}

/** Lowercased text used to classify Convex failures into user-facing field errors. */
export function getSearchableErrorText(error: unknown): string {
  const extracted = extractConvexErrorMessage(error);
  const raw = getRawErrorMessage(error);
  return `${extracted} ${raw}`.toLowerCase();
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
