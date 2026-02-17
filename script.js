// Элементы
const sidebar = document.getElementById('sidebar');
const mapArea = document.getElementById('map-area');
const hideBtn = document.getElementById('hide-sidebar');
const showBtn = document.getElementById('show-sidebar');

// Скрытие панели
hideBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    mapArea.classList.add('expanded');
    showBtn.classList.remove('hidden'); // ← показываем кнопку возврата
});

// Показ панели обратно
showBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    mapArea.classList.remove('expanded');
    showBtn.classList.add('hidden'); // ← прячем кнопку
});

// Открыть меню маскота (оставляем как было)
document.getElementById('mascot').addEventListener('click', (e) => {
    if (e.target.closest('.mascot-icon')) {
        document.getElementById('mascot-menu').classList.toggle('hidden');
    }
});
