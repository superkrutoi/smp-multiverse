(() => {
    const LEAVE_DURATION_MS = 160;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isNavigating = false;

    function markPageReady() {
        if (!document.body) {
            return;
        }

        document.body.classList.add('page-transition-enabled');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.body.classList.add('page-transition-ready');
                document.body.classList.remove('page-transition-leaving');
            });
        });
    }

    function shouldHandleLink(anchor) {
        const href = anchor.getAttribute('href');
        if (!href) {
            return false;
        }

        if (anchor.hasAttribute('download')) {
            return false;
        }

        if (anchor.target && anchor.target !== '_self') {
            return false;
        }

        if (
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('javascript:')
        ) {
            return false;
        }

        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) {
            return false;
        }

        return targetUrl.href !== window.location.href;
    }

    function navigateWithTransition(url) {
        if (!url || isNavigating) {
            return;
        }

        if (prefersReducedMotion) {
            window.location.href = url;
            return;
        }

        isNavigating = true;
        document.body.classList.add('page-transition-leaving');
        document.body.classList.remove('page-transition-ready');

        window.setTimeout(() => {
            window.location.href = url;
        }, LEAVE_DURATION_MS);
    }

    window.navigateWithTransition = navigateWithTransition;

    document.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0) {
            return;
        }

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const anchor = event.target.closest('a[href]');
        if (!anchor || !shouldHandleLink(anchor)) {
            return;
        }

        const nextUrl = new URL(anchor.getAttribute('href'), window.location.href).href;
        event.preventDefault();
        navigateWithTransition(nextUrl);
    });

    window.addEventListener('pageshow', () => {
        isNavigating = false;
        markPageReady();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markPageReady, { once: true });
    } else {
        markPageReady();
    }
})();
