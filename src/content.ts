(() => {
    let currentStatus: any = null;
    let overlayElement: HTMLDivElement | null = null;
    let timeWidgetElement: HTMLDivElement | null = null;
    let widgetDismissed = false;

    function formatTimeShort(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

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

            overlayElement.style.cssText = `
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 2147483647;
          display: flex;
          align-items: center;
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

            ensureAnimationStyles();

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

    function ensureAnimationStyles() {
        if (!document.getElementById('webtime-styles')) {
            const style = document.createElement('style');
            style.id = 'webtime-styles';
            style.innerHTML = `
                @keyframes webtime-slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes webtime-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }`;
            document.head.appendChild(style);
        }
    }

    // --- Floating Time Widget ---
    let widgetDomainSpan: HTMLSpanElement | null = null;
    let widgetTimeSpan: HTMLSpanElement | null = null;

    function renderTimeWidget(seconds: number, domain: string) {
        // Don't show widget if dismissed, or if there's a blocking overlay
        if (widgetDismissed) return;
        if (currentStatus && (currentStatus.type === 'BLOCKED' || currentStatus.type === 'FOCUS_BLOCKED')) {
            if (timeWidgetElement) {
                timeWidgetElement.remove();
                timeWidgetElement = null;
                widgetDomainSpan = null;
                widgetTimeSpan = null;
            }
            return;
        }

        // Position: bottom-right, above potential warning overlay
        const bottomOffset = (currentStatus && currentStatus.type === 'WARNING') ? 100 : 20;

        if (!timeWidgetElement) {
            // Build DOM structure once
            timeWidgetElement = document.createElement('div');
            timeWidgetElement.id = 'webtime-time-widget';
            ensureAnimationStyles();

            timeWidgetElement.style.cssText = `
              position: fixed;
              bottom: ${bottomOffset}px;
              right: 20px;
              z-index: 2147483646;
              background-color: rgba(17, 24, 39, 0.85);
              color: white;
              border: 1px solid rgba(55, 65, 81, 0.6);
              border-radius: 0.5rem;
              padding: 0.5rem 0.75rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 0.8rem;
              backdrop-filter: blur(8px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              animation: webtime-fade-in 0.3s ease-out;
              cursor: default;
              user-select: none;
              opacity: 0.85;
              transition: opacity 0.2s;
            `;

            const icon = document.createElement('img');
            icon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
            icon.width = 14;
            icon.height = 14;
            icon.style.cssText = 'border-radius: 2px; flex-shrink: 0;';
            icon.onerror = () => { icon.style.display = 'none'; };

            widgetDomainSpan = document.createElement('span');
            widgetDomainSpan.style.color = '#d1d5db';

            widgetTimeSpan = document.createElement('span');
            widgetTimeSpan.style.cssText = 'font-weight: 600; color: #60a5fa;';

            const closeBtn = document.createElement('span');
            closeBtn.title = '关闭';
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = `
              margin-left: 0.25rem; cursor: pointer; color: #6b7280;
              font-size: 0.75rem; line-height: 1; padding: 2px; transition: color 0.15s;
            `;
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                widgetDismissed = true;
                if (timeWidgetElement) {
                    timeWidgetElement.remove();
                    timeWidgetElement = null;
                    widgetDomainSpan = null;
                    widgetTimeSpan = null;
                }
            });

            timeWidgetElement.append(icon, widgetDomainSpan, widgetTimeSpan, closeBtn);

            timeWidgetElement.addEventListener('mouseenter', () => {
                if (timeWidgetElement) timeWidgetElement.style.opacity = '1';
            });
            timeWidgetElement.addEventListener('mouseleave', () => {
                if (timeWidgetElement) timeWidgetElement.style.opacity = '0.85';
            });

            document.body.appendChild(timeWidgetElement);
        } else {
            // Only update position if needed
            timeWidgetElement.style.bottom = `${bottomOffset}px`;
        }

        // Update text content only (no DOM rebuild)
        if (widgetDomainSpan) widgetDomainSpan.textContent = domain;
        if (widgetTimeSpan) widgetTimeSpan.textContent = formatTimeShort(seconds);
    }

    let pollInterval: any = null;

    function fetchStatus() {
        try {
            chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
                if (chrome.runtime.lastError) return;
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

    function fetchSiteTime() {
        if (widgetDismissed) return;
        try {
            chrome.runtime.sendMessage({ type: 'GET_SITE_TIME' }, (response) => {
                if (chrome.runtime.lastError) return;
                if (response && response.domain) {
                    renderTimeWidget(response.seconds, response.domain);
                }
            });
        } catch {
            // Ignore errors gracefully
        }
    }

    function initContentScript() {
        fetchStatus();
        fetchSiteTime();
        pollInterval = setInterval(() => {
            fetchStatus();
            fetchSiteTime();
        }, 30000); // Poll every 30 seconds
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContentScript);
    } else {
        initContentScript();
    }
})();
