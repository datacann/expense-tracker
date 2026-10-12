export class ReceiptApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ReceiptApiError';
  }
}

type ApiErrorResponse = {
  error?: {
    code?: unknown;
    message?: unknown;
    requestId?: unknown;
  };
};

export const parseReceiptApiError = (body: ApiErrorResponse): ReceiptApiError | null => {
  if (
    typeof body?.error?.code !== 'string' ||
    typeof body.error.message !== 'string'
  ) {
    return null;
  }

  return new ReceiptApiError(body.error.code, body.error.message);
};
