// Элементы
const sidebar = document.getElementById('sidebar');
const mapArea = document.getElementById('map-area');
const hideBtn = document.getElementById('hide-sidebar');
const showBtn = document.getElementById('show-sidebar');

// Инициализация: сайдбар видна по умолчанию, кнопка возврата скрыта
sidebar.classList.remove('hidden');
showBtn.classList.add('hidden');

// Скрытие панели
hideBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    mapArea.classList.add('expanded');
    showBtn.classList.remove('hidden');
});

// Показ панели обратно
showBtn.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    mapArea.classList.remove('expanded');
    showBtn.classList.add('hidden');
});

// Меню маскота
document.getElementById('mascot').addEventListener('click', (e) => {
    if (e.target.closest('.mascot-icon')) {
        document.getElementById('mascot-menu').classList.toggle('hidden');
    }
});

// Dev Tools Toggle
document.getElementById('dev-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dev-active');
    console.log('Dev Mode:', document.body.classList.contains('dev-active') ? 'ON' : 'OFF');
});

// Notification Bell
document.getElementById('notification-bell').addEventListener('click', () => {
    console.log('Notifications clicked');
    // TODO: Добавить логику toast-уведомлений
});
