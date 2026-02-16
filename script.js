// Скрытие/показ сайдбара
document.getElementById('hide-sidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const mapArea = document.getElementById('map-area');
    sidebar.classList.toggle('hidden');
    mapArea.classList.toggle('expanded');
});

// Меню маскота
document.getElementById('mascot').addEventListener('click', (e) => {
    if (e.target.closest('.mascot-icon')) {
        document.getElementById('mascot-menu').classList.toggle('hidden');
    }
});