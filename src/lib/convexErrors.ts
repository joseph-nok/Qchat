import { ConvexError } from 'convex/values';

const CONVEX_ERROR_SYMBOL = Symbol.for('ConvexError');

function isConvexThrownError(error: unknown): boolean {
  if (error instanceof ConvexError) {
    return true;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<symbol, unknown>)[CONVEX_ERROR_SYMBOL] === true
  );
}

function extractRawMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return '';
}

/** Reads a structured Convex application error code when the backend throws ConvexError. */
export function getConvexErrorCode(error: unknown): string {
  if (!isConvexThrownError(error)) {
    return '';
  }

  const convexError = error as ConvexError<string | { code?: string }>;

  if (typeof convexError.data === 'string') {
    return convexError.data;
  }

  if (convexError.data && typeof convexError.data === 'object' && 'code' in convexError.data) {
    const code = convexError.data.code;
    return typeof code === 'string' ? code : '';
  }

  return '';
}

/** Converts any caught Convex error into a lowercase string for simple `.includes()` checks. */
export function toErrorText(error: unknown): string {
  const raw = extractRawMessage(error);
  if (!raw) {
    return '';
  }

  const lower = raw.toLowerCase();
  const marker = 'uncaught error:';
  const markerIndex = lower.indexOf(marker);

  if (markerIndex !== -1) {
    let extracted = raw.slice(markerIndex + marker.length).trim();
    const stackIndex = extracted.indexOf('\n    at ');
    if (stackIndex !== -1) {
      extracted = extracted.slice(0, stackIndex).trim();
    }
    const newlineIndex = extracted.indexOf('\n');
    if (newlineIndex !== -1) {
      extracted = extracted.slice(0, newlineIndex).trim();
    }
    if (extracted) {
      return extracted.toLowerCase();
    }
  }

  return lower;
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
