/** Converts any caught Convex error into a lowercase string for simple `.includes()` checks. */
export function toErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }
  if (typeof error === 'string') {
    return error.toLowerCase();
  }
  return '';
}

export function isNetworkError(error: unknown): boolean {
  const errorText = toErrorText(error);
  return (
    errorText.includes('failed to fetch') ||
    errorText.includes('networkerror') ||
    errorText.includes('network error') ||
    errorText.includes('load failed')
  );
}
