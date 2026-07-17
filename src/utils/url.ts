let cachedBaseUrl: string | null = null;

export function setBaseUrl(url: string) {
  cachedBaseUrl = url;
}

export function isBaseUrlSet(): boolean {
  return cachedBaseUrl !== null;
}

export function buildActivationUrl(token: string): string {
  const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:5173";
  return `${baseUrl}/activate-account?token=${token}`;
}

export function resolveFileUrl(filePathOrUrl: string | null | undefined): string | null {
  if (!filePathOrUrl) return null;

  // IF PROD 
  if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
    return filePathOrUrl;
  }

  // IF DEV 
  const baseUrl = cachedBaseUrl || process.env.BACKEND_BASE_URL || `http://localhost:${process.env.APP_PORT || 8000}`;

  // CLEAN UP IF THERE'S STILL SOME /
  const cleanPath = filePathOrUrl.startsWith('/') ? filePathOrUrl.slice(1) : filePathOrUrl;
  return `${baseUrl}/${cleanPath}`;
}

export function buildResetPasswordUrl(token: string): string {
  const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:5173";
  return `${baseUrl}/reset-password?token=${token}`;
}