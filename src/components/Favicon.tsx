import React from 'react';
import { getGoogleFaviconUrl, getSiteFaviconUrl } from '@/lib/favicon';

interface FaviconProps {
    domain: string;
    size?: number;
    className?: string;
}

/** Display a website's favicon from its own origin */
const Favicon: React.FC<FaviconProps> = ({ domain, size = 16, className = '' }) => (
    <img
        src={getSiteFaviconUrl(domain)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={`inline-block shrink-0 rounded-sm ${className}`}
        onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.dataset.fallback !== 'google') {
                img.dataset.fallback = 'google';
                img.src = getGoogleFaviconUrl(domain, size);
                return;
            }
            // Hide broken images after fallback also fails
            img.style.display = 'none';
        }}
    />
);

export default Favicon;
