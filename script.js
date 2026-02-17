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

// Notification Bell (toggle demo between bell1/bell2)
const notificationBtn = document.querySelector('.notification-bell');
const notificationImg = notificationBtn.querySelector('img');
let notificationCount = 0; // demo count

function updateNotificationIcon() {
    const emptySrc = notificationImg.dataset.bellEmpty;
    const activeSrc = notificationImg.dataset.bellActive;
    notificationImg.src = notificationCount > 0 ? activeSrc : emptySrc;
    if (notificationCount > 0) {
        notificationBtn.classList.add('has-notifications');
    } else {
        notificationBtn.classList.remove('has-notifications');
    }
}

// Если картинка не найдена — подставим data-атрибут или внешнюю заглушку
notificationImg.addEventListener('error', () => {
    const fallback = notificationImg.dataset.bellEmpty || 'https://placehold.co/24';
    if (notificationImg.src !== fallback) {
        console.warn('Notification icon failed to load, using fallback:', fallback);
        notificationImg.src = fallback;
    }
});

notificationBtn.addEventListener('click', () => {
    // Для демонстрации — переключаем между состояниями "есть уведомления" и "нет"
    notificationCount = notificationCount > 0 ? 0 : 3;
    updateNotificationIcon();
    console.log('Notifications clicked, count=', notificationCount);
});

// expose helper for other code (optional)
window.setNotificationCount = (n) => {
    notificationCount = Math.max(0, Number(n) || 0);
    updateNotificationIcon();
};

// Модальное окно настроек
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.querySelector('.settings-close');
const mascotMenu = document.getElementById('mascot-menu');

// Открыть настройки по клику на кнопку в меню маскота
mascotMenu.addEventListener('click', (e) => {
    if (e.target.textContent.trim() === 'Настройки') {
        settingsModal.classList.remove('hidden');
        mascotMenu.classList.add('hidden');
    }
});

// Закрыть настройки по клику на крестик
settingsClose.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// Закрыть настройки по клику вне окна (на фон)
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});
// Dev Menu Logic
const devMenuModal = document.getElementById('dev-menu-modal');
const devMenuClose = document.querySelector('.dev-menu-close');
const devMenuItems = document.querySelectorAll('.dev-menu-item');
const devMenuBody = document.getElementById('dev-menu-body');

// Открыть меню разработчика
document.querySelector('.dev-toggle').addEventListener('click', () => {
    devMenuModal.classList.remove('hidden');
});

// Закрыть меню по крестику
devMenuClose.addEventListener('click', () => {
    devMenuModal.classList.add('hidden');
});

// Закрыть меню по клику на фон (вне контейнера)
devMenuModal.addEventListener('click', (e) => {
    if (e.target === devMenuModal) {
        devMenuModal.classList.add('hidden');
    }
});

// Переключение между пунктами меню
devMenuItems.forEach((item) => {
    item.addEventListener('click', () => {
        // Убрать активный класс со всех пунктов
        devMenuItems.forEach((btn) => {
            btn.classList.remove('active');
        });
        
        // Добавить активный класс текущему пункту
        item.classList.add('active');
        
        // Обновить содержимое
        const itemNumber = item.getAttribute('data-item');
        devMenuBody.innerHTML = `<p>тут будет пункт ${itemNumber}</p>`;
    });
});