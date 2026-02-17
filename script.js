const sidebar = document.getElementById('sidebar');
const mapArea = document.getElementById('map-area');
const hideSidebarButton = document.getElementById('hide-sidebar');
const showSidebarButton = document.getElementById('show-sidebar');
const mascot = document.getElementById('mascot');
const mascotMenu = document.getElementById('mascot-menu');

function setSidebarState(isOpen) {
    sidebar.classList.toggle('is-collapsed', !isOpen);
    mapArea.classList.toggle('is-fullwidth', !isOpen);
    showSidebarButton.classList.toggle('is-visible', !isOpen);
}

hideSidebarButton.addEventListener('click', () => {
    setSidebarState(false);
});

showSidebarButton.addEventListener('click', () => {
    setSidebarState(true);
});

mascot.addEventListener('click', (event) => {
    if (event.target.closest('.mascot-icon')) {
        mascotMenu.classList.toggle('hidden');
    }
});

setSidebarState(true);
