import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // We'll inject Tailwind CSS here too

const ContentApp = () => {
    const [status, setStatus] = useState<any>(null);

    useEffect(() => {
        // Poll background script for status
        const fetchStatus = () => {
            chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Extension might be reloaded/unavailable
                    return;
                }
                setStatus(response);
            });
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, []);

    if (!status) return null;

    // Placeholder responses from background
    // status.type === 'BLOCKED' (limit reached)
    // status.type === 'FOCUS_BLOCKED' (pomodoro active)
    // status.type === 'WARNING' (time left <= 5 min)

    if (status.type === 'BLOCKED' || status.type === 'FOCUS_BLOCKED') {
        return (
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-background text-foreground bg-opacity-95 backdrop-blur-sm">
                <div className="text-center space-y-4 p-8 bg-card rounded-xl shadow-2xl border">
                    <h1 className="text-4xl font-bold text-destructive">
                        {status.type === 'FOCUS_BLOCKED' ? '🍅 专注时间' : '🛑 时间耗尽'}
                    </h1>
                    <p className="text-xl">
                        {status.type === 'FOCUS_BLOCKED'
                            ? '当前正处于专注模式，此网站已被拦截。'
                            : '你在这个网站的今日使用时间已达到设定上限。'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">WebTime Tracker Pro 正在保护你的时间。</p>
                </div>
            </div>
        );
    }

    if (status.type === 'WARNING') {
        return (
            <div className="fixed bottom-4 right-4 z-[2147483647] bg-card text-card-foreground border shadow-lg rounded-lg p-4 max-w-sm flex items-start gap-4 animate-in slide-in-from-bottom-5">
                <div className="text-2xl">⚠️</div>
                <div>
                    <h3 className="font-semibold text-sm">时间即将耗尽</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        你在此网站的时间还剩大约 <span className="font-bold text-destructive">{status.timeLeftMinutes}</span> 分钟。
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

// Injection logic
const init = () => {
    const rootElement = document.createElement('div');
    rootElement.id = 'webtime-tracker-root';
    // Ensure we don't interfere with the page styles using a simple reset container if needed
    // For now, attaching to body
    document.body.appendChild(rootElement);

    const root = createRoot(rootElement);

    // Note: Since we are injecting React into host pages, 
    // relying entirely on global Tailwind styles might conflict with host CSS.
    // We'll add a 'webtime-isolated' wrapping class in future if needed.
    root.render(
        <React.StrictMode>
            <div className="dark"> {/* Force dark mode for overlay for now, or match system */}
                <ContentApp />
            </div>
        </React.StrictMode>
    );
};

// Check if document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
