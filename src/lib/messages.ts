import type { PageMetadata } from './categories';

export type WebTimeStatus =
  | { type: 'BLOCKED' }
  | { type: 'FOCUS_BLOCKED' }
  | { type: 'WARNING'; timeLeftMinutes: number }
  | null;

export interface GetSiteTimeResponse {
  seconds: number;
  domain: string;
}

export type RuntimeMessage =
  | { type: 'GET_STATUS' }
  | { type: 'GET_SITE_TIME' }
  | { type: 'CLASSIFY_PAGE'; metadata: PageMetadata };
