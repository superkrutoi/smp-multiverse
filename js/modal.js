export function setupModal({
    modal,
    closeButton,
    onOpen,
    onClose
}) {
    function open() {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        if (typeof onOpen === 'function') {
            onOpen();
        }
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
