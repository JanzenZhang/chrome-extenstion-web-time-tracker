export function getSiteFaviconUrl(domain: string): string {
  return `https://${domain}/favicon.ico`;
}

export function getGoogleFaviconUrl(domain: string, size: number): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
