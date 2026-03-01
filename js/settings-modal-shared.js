(function mountSharedSettingsModal() {
    const iconBasePrefix = window.location.pathname.includes('/pages/') ? '../' : '';

    const modalMarkup = `
<div id="settings-modal" class="settings-modal hidden" aria-hidden="true">
    <div class="settings-content">
        <div class="settings-header">
            <h2>Настройки</h2>
            <button class="settings-close" aria-label="Закрыть настройки">✕</button>
        </div>
        <div class="settings-body">
            <div class="settings-layout">
                <div class="settings-tabs-rail" role="tablist" aria-orientation="vertical">
                    <button
                        id="settings-tab-main"
                        class="settings-tab-button"
                        type="button"
                        data-tab="main"
                        role="tab"
                        aria-selected="false"
                        aria-label="Основные настройки"
                    >
                        <img src="${iconBasePrefix}assets/Lucid_V1.2_icons/PNG/Flat/16/Grid.png" alt="Основные" class="settings-tab-icon" />
                    </button>
                    <button
                        id="settings-tab-audio"
                        class="settings-tab-button"
                        type="button"
                        data-tab="audio"
                        role="tab"
                        aria-selected="false"
                        aria-label="Настройки звука"
                    >
                        <img src="${iconBasePrefix}assets/Lucid_V1.2_icons/PNG/Flat/16/Speaker-0.png" alt="Звук" class="settings-tab-icon" />
                    </button>
                </div>
                <div class="settings-panels">
                    <section
                        id="settings-tab-main-content"
                        class="settings-panel hidden"
                        data-tab-panel="main"
                        role="tabpanel"
                        aria-labelledby="settings-tab-main"
                        aria-hidden="true"
                    >
                        <h3 class="settings-section-title">Основные</h3>
                        <div class="planet-detail-preview-block" aria-label="Предпросмотр детализации планеты">
                            <div class="planet-detail-preview-layout">
                                <div class="detail-level-control-group">
                                    <span class="detail-level-control-title">Детализация</span>
                                    <div id="site-planet-detail-level" class="detail-level-buttons" role="group" aria-label="Уровень детализации планет и объектов">
                                        <button type="button" class="detail-level-btn" data-detail-level="1" data-tooltip="16×16">1</button>
                                        <button type="button" class="detail-level-btn" data-detail-level="2" data-tooltip="32×32">2</button>
                                        <button type="button" class="detail-level-btn" data-detail-level="3" data-tooltip="64×64">3</button>
                                        <button type="button" class="detail-level-btn" data-detail-level="4" data-tooltip="128×128">4</button>
                                    </div>
                                    <div id="site-planet-detail-tooltip" class="detail-level-tooltip" aria-hidden="true"></div>
                                </div>
                                <div class="planet-detail-preview-card">
                                    <div id="site-planet-detail-preview-cube" class="planet-detail-preview-cube" aria-hidden="true">
                                        <canvas class="planet-detail-preview-face face-front" data-face="front" width="32" height="32"></canvas>
                                        <canvas class="planet-detail-preview-face face-back" data-face="back" width="32" height="32"></canvas>
                                        <canvas class="planet-detail-preview-face face-left" data-face="left" width="32" height="32"></canvas>
                                        <canvas class="planet-detail-preview-face face-right" data-face="right" width="32" height="32"></canvas>
                                        <canvas class="planet-detail-preview-face face-top" data-face="top" width="32" height="32"></canvas>
                                        <canvas class="planet-detail-preview-face face-bottom" data-face="bottom" width="32" height="32"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p class="settings-help">Мы рекомендуем использовать уровень 2 (32×32).</p>
                        <div class="settings-actions">
                            <div class="settings-actions-inner">
                                <button id="settings-fullscreen-toggle" type="button" class="settings-fullscreen-button">
                                    Открыть сайт на весь экран
                                </button>
                                <p class="settings-help settings-fullscreen-hotkey">Горячая клавиша: Alt + Enter</p>
                            </div>
                        </div>
                    </section>
                    <section
                        id="settings-tab-audio-content"
                        class="settings-panel hidden"
                        data-tab-panel="audio"
                        role="tabpanel"
                        aria-labelledby="settings-tab-audio"
                        aria-hidden="true"
                    >
                        <h3 class="settings-section-title">Звук</h3>
                        <div class="settings-field-group">
                            <div class="settings-field">
                                <label
                                    for="settings-volume-master"
                                    class="settings-field-label"
                                    title="Регулирует общую громкость всего на сайте"
                                >
                                    Общая громкость
                                </label>
                                <input
                                    id="settings-volume-master"
                                    class="settings-volume-slider sound-progress"
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                            </div>
                            <div class="settings-field">
                                <label
                                    for="settings-volume-sfx"
                                    class="settings-field-label"
                                    title="Регулирует громкость звуковых эффектов уведомлений, звуков кнопок и т.п."
                                >
                                    Эффекты
                                </label>
                                <input
                                    id="settings-volume-sfx"
                                    class="settings-volume-slider sound-progress"
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                            </div>
                            <div class="settings-field">
                                <label
                                    for="settings-volume-music"
                                    class="settings-field-label"
                                    title="Регулирует громкость музыки"
                                >
                                    Музыка
                                </label>
                                <input
                                    id="settings-volume-music"
                                    class="settings-volume-slider sound-progress"
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
</div>`;

    const existing = document.getElementById('settings-modal');
    if (existing) {
        existing.outerHTML = modalMarkup;
        return;
    }

    document.body.insertAdjacentHTML('beforeend', modalMarkup);
})();
