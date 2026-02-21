import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Clean a user-input domain string: strip protocol, www prefix, and trailing paths */
export const cleanDomainInput = (input: string): string => {
  let clean = input.trim();
  try {
    if (clean.includes('http://') || clean.includes('https://')) {
      clean = new URL(clean).hostname;
    } else if (clean.includes('/')) {
      clean = clean.split('/')[0];
    }
  } catch (e) {
    // ignore
  }
  if (clean.startsWith('www.')) {
    clean = clean.substring(4);
  }
  return clean;
};
