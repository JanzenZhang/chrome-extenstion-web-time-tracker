(() => {
    let currentStatus: any = null;
    let overlayElement: HTMLDivElement | null = null;

    function renderOverlay() {
        if (!currentStatus) {
            if (overlayElement) {
                overlayElement.remove();
                overlayElement = null;
            }
            return;
        }

        if (!overlayElement) {
            overlayElement = document.createElement('div');
            overlayElement.id = 'webtime-tracker-root';
            document.body.appendChild(overlayElement);
        }

        if (currentStatus.type === 'BLOCKED' || currentStatus.type === 'FOCUS_BLOCKED') {
            const title = currentStatus.type === 'FOCUS_BLOCKED' ? '🍅 专注时间' : '🛑 时间耗尽';
            const message = currentStatus.type === 'FOCUS_BLOCKED'
                ? '当前正处于专注模式，此网站已被拦截。'
                : '你在这个网站的今日使用时间已达到设定上限。';

            // Use inline styles to avoid injecting host page with CSS
            overlayElement.style.cssText = `
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(4px);
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
        `;

            overlayElement.innerHTML = `
          <div style="text-align: center; padding: 2rem; background-color: #111827; border-radius: 0.75rem; border: 1px solid #374151; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-width: 90%; width: 500px;">
            <h1 style="font-size: 2.25rem; font-weight: bold; color: #ef4444; margin-bottom: 1rem; margin-top: 0;">${title}</h1>
            <p style="font-size: 1.25rem; margin-bottom: 1.5rem;">${message}</p>
            <p style="font-size: 0.875rem; color: #9ca3af; margin: 0;">WebTime Tracker Pro 正在保护你的时间。</p>
          </div>
        `;
        } else if (currentStatus.type === 'WARNING') {
            overlayElement.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 2147483647;
          background-color: #111827;
          color: white;
          border: 1px solid #374151;
          border-radius: 0.5rem;
          padding: 1rem;
          max-width: 350px;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          animation: webtime-slide-up 0.3s ease-out forwards;
        `;

            // Add animation style to document if not exists
            if (!document.getElementById('webtime-styles')) {
                const style = document.createElement('style');
                style.id = 'webtime-styles';
                style.innerHTML = `
                @keyframes webtime-slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }`;
                document.head.appendChild(style);
            }

            overlayElement.innerHTML = `
                <div style="font-size: 1.5rem; line-height: 1;">⚠️</div>
                <div>
                    <h3 style="font-weight: 600; font-size: 0.875rem; margin: 0 0 0.25rem 0;">时间即将耗尽</h3>
                    <p style="font-size: 0.875rem; color: #9ca3af; margin: 0;">
                        你在此网站的时间还剩大约 <span style="font-weight: bold; color: #ef4444;">${currentStatus.timeLeftMinutes}</span> 分钟。
                    </p>
                </div>
            `;
        }
    }

    let pollInterval: any = null;

    function fetchStatus() {
        try {
            chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
                if (chrome.runtime.lastError) {
                    // Ignore typical disconnected errors
                    return;
                }
                currentStatus = response;
                renderOverlay();
            });
        } catch (error: any) {
            if (error?.message?.includes('Extension context invalidated')) {
                console.warn('[WebTime Tracker] Extension context invalidated. Stopping background polls.');
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
            }
        }
    }

    function initContentScript() {
        fetchStatus();
        pollInterval = setInterval(fetchStatus, 30000); // Poll every 30 seconds
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContentScript);
    } else {
        initContentScript();
    }
})();
