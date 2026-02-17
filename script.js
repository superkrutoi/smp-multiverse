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

// Меню маскота — открыть/скрыть по клику на маскота (кнопки в меню не закрывают)
const mascotEl = document.getElementById('mascot');
mascotEl.addEventListener('click', (e) => {
    // если клик был внутри самого меню — не закрываем/не открываем
    if (e.target.closest('#mascot-menu')) return;

    // клик по картинке или по контейнеру маскота открывает меню
    if (e.target.closest('.mascot-img') || e.target === mascotEl) {
        mascotMenu.classList.toggle('hidden');
    }
});

// Закрывать меню маскота при клике вне него
document.addEventListener('click', (e) => {
    if (!mascotEl.contains(e.target) && !mascotMenu.contains(e.target)) {
        if (!mascotMenu.classList.contains('hidden')) {
            mascotMenu.classList.add('hidden');
        }
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

// Рендер содержимого для пунктов меню разработчика
function renderDevMenuItem(itemNumber) {
    if (String(itemNumber) === '1') {
        // Управление — поисковая строка сверху + список настроек
        devMenuBody.innerHTML = `
            <div class="dev-settings-container">
                <input id="dev-search" class="dev-search" type="search" placeholder="Поиск настроек..." aria-label="Поиск настроек" />
                <div id="dev-settings-list" class="dev-settings-list">
                    <!-- элементы списка будут вставлены JS -->
                </div>
            </div>
        `;

        const settings = [
            { id: 'ui-dark', name: 'Тёмная тема', type: 'checkbox', checked: true },
            { id: 'show-tooltips', name: 'Показывать подсказки', type: 'checkbox', checked: true },
            { id: 'compact-mode', name: 'Компактный режим', type: 'checkbox', checked: false },
            { id: 'map-animations', name: 'Анимация карты', type: 'checkbox', checked: true },
            { id: 'enable-sounds', name: 'Звуковые уведомления', type: 'checkbox', checked: false }
        ];

        const listEl = document.getElementById('dev-settings-list');
        function renderList(filter = '') {
            const q = filter.trim().toLowerCase();
            // render as: <label><span>text</span><input/></label> so checkbox appears on the right
            listEl.innerHTML = settings
                .filter(s => s.name.toLowerCase().includes(q))
                .map(s => `
                    <label class="dev-setting-item" data-name="${s.name}">
                        <span>${s.name}</span>
                        <input type="${s.type}" id="${s.id}" ${s.checked ? 'checked' : ''} />
                    </label>
                `).join('');
        }

        renderList();

        const searchInput = document.getElementById('dev-search');
        searchInput.addEventListener('input', (e) => renderList(e.target.value));

        // Обработчики для переключения (демо): сохраняем в localStorage
        listEl.addEventListener('change', (e) => {
            const input = e.target;
            if (input && input.id) {
                localStorage.setItem('dev.setting.' + input.id, input.checked);
            }
        });
        return;
    }

    // Хардкодный fallback для других пунктов — пока плейсхолдер
    devMenuBody.innerHTML = `<p>тут будет пункт ${itemNumber}</p>`;
}

// Переключение между пунктами меню
devMenuItems.forEach((item) => {
    item.addEventListener('click', () => {
        devMenuItems.forEach((btn) => btn.classList.remove('active'));
        item.classList.add('active');
        const itemNumber = item.getAttribute('data-item');
        renderDevMenuItem(itemNumber);
    });
});

// При загрузке — отрисовать контент для активного пункта
const activeItem = document.querySelector('.dev-menu-item.active');
if (activeItem) {
    renderDevMenuItem(activeItem.getAttribute('data-item'));
}