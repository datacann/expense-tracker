const normalizeDirectoryUri = (uri: string) => uri.replace(/\\/g, '/').replace(/\/+$/, '');

export const isReceiptCacheFile = (uri: string, receiptsDirectoryUri: string): boolean => {
  const normalizedUri = uri.replace(/\\/g, '/');
  const normalizedDirectory = normalizeDirectoryUri(receiptsDirectoryUri);

  return normalizedUri.startsWith(`${normalizedDirectory}/`) && normalizedUri.length > normalizedDirectory.length + 1;
};
