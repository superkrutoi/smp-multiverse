export function setupModal({
    modal,
    closeButton,
    onOpen,
    onClose
}) {
    function focusFirstElement() {
        if (!modal) {
            return;
        }

        const root = modal.querySelector('[role="dialog"], [role="alertdialog"]') || modal;
        const focusableSelector = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled]):not([type="hidden"])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');

        const firstFocusable = root.querySelector(focusableSelector);

        if (firstFocusable && typeof firstFocusable.focus === 'function') {
            firstFocusable.focus();
            return;
        }

        if (root && typeof root.focus === 'function') {
            root.focus();
        }
    }

    function open() {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        if (typeof onOpen === 'function') {
            onOpen();
        }
        focusFirstElement();
    }

    function close() {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (typeof onClose === 'function') {
            onClose();
        }
    }

    if (closeButton) {
        closeButton.addEventListener('click', close);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            close();
        }
    });

    return { open, close };
}
