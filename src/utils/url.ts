export function buildActivationUrl(token: string): string {
  const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:5173";
  return `${baseUrl}/activate?token=${token}`;
}