import React from 'react';

interface FaviconProps {
    domain: string;
    size?: number;
    className?: string;
}

/** Display a website's favicon via Google's favicon service */
const Favicon: React.FC<FaviconProps> = ({ domain, size = 16, className = '' }) => (
    <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={`inline-block shrink-0 rounded-sm ${className}`}
        onError={(e) => {
            // Hide broken images
            (e.target as HTMLImageElement).style.display = 'none';
        }}
    />
);

export default Favicon;
