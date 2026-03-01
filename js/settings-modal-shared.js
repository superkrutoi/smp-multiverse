(function mountSharedSettingsModal() {
    const modalMarkup = `
<div id="settings-modal" class="settings-modal hidden" aria-hidden="true">
    <div class="settings-content">
        <div class="settings-header">
            <h2>Настройки</h2>
            <button class="settings-close" aria-label="Закрыть настройки">✕</button>
        </div>
        <div class="settings-body">
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
            <p class="settings-help">По умолчанию используется уровень 2 (32×32).</p>
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
