/**
 * Map Tools Module
 * 
 * Управление режимами инструментов карты:
 * - Генерация серверов
 * - Перетаскивание
 * - Комментарии
 * 
 * State | API | UI
 */

class MapToolsState {
  constructor() {
    this.mode = 'none'; // none | generate | drag | comment
    this.comments = [];
    this.devMode = false;
    this.hideComments = false;
    this.mapId = 'main';
    this.listeners = [];
  }

  setMode(newMode) {
    if (this.mode === newMode) {
      this.mode = 'none';
    } else {
      this.mode = newMode;
    }
    this.notify();
  }

  setDevMode(enabled) {
    this.devMode = enabled;
    this.notify();
  }

  setHideComments(hidden) {
    this.hideComments = hidden;
    this.notify();
  }

  addComment(comment) {
    this.comments.push(comment);
    this.notify();
  }

  removeComment(id) {
    this.comments = this.comments.filter(c => c.id !== id);
    this.notify();
  }

  setComments(comments) {
    this.comments = comments;
    this.notify();
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this));
  }
}

class MapToolsAPI {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async getComments(mapId) {
    try {
      const res = await fetch(`${this.baseUrl}/maps/${mapId}/comments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error loading comments:', err);
      return [];
    }
  }

  async createComment(mapId, data) {
    try {
      const res = await fetch(`${this.baseUrl}/maps/${mapId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error creating comment:', err);
      return null;
    }
  }

  async deleteComment(commentId) {
    try {
      const res = await fetch(`${this.baseUrl}/comments/${commentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      return false;
    }
  }

  async generateServer(mapId, type = 'random', settings = {}) {
    try {
      const res = await fetch(`${this.baseUrl}/test-servers/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapId, type, settings })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Error generating server:', err);
      return null;
    }
  }
}

class MapToolsUI {
  constructor(mapElement, state, api) {
    this.map = mapElement;
    this.state = state;
    this.api = api;
    this.toolbar = null;
    this.generatePopover = null;
    this.currentCommentPopover = null;

    this.init();
  }

  init() {
    this.createToolbar();
    this.setupMapListeners();
    this.state.subscribe(() => this.render());
  }

  createToolbar() {
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'map-toolbar';
    this.toolbar.style.display = 'none'; // Initially hidden
    this.toolbar.innerHTML = `
      <button class="map-tool-btn" data-mode="generate" title="Сгенерировать сервер">🌐</button>
      <button class="map-tool-btn" data-mode="drag" title="Перетаскивание">🖐</button>
      <button class="map-tool-btn" data-mode="comment" title="Добавить комментарий">💬</button>
    `;

    this.toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.map-tool-btn');
      if (btn) {
        const mode = btn.dataset.mode;
        if (mode === 'generate') {
          this.toggleGeneratePopover();
        } else {
          this.state.setMode(mode);
        }
      }
    });

    this.map.parentElement.appendChild(this.toolbar);
  }

  toggleGeneratePopover() {
    if (this.generatePopover && this.generatePopover.parentElement) {
      this.generatePopover.remove();
      this.generatePopover = null;
      return;
    }

    this.generatePopover = document.createElement('div');
    this.generatePopover.className = 'map-popover';
    this.generatePopover.innerHTML = `
      <div class="popover-content">
        <button class="popover-btn" data-action="random">🎲 Случайный</button>
        <button class="popover-btn" data-action="custom">⚙ Настроить</button>
      </div>
    `;

    this.generatePopover.addEventListener('click', (e) => {
      const btn = e.target.closest('.popover-btn');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'random') {
          this.generateRandomServer();
        } else if (action === 'custom') {
          this.state.setMode('generate');
        }
        this.generatePopover?.remove();
        this.generatePopover = null;
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.generatePopover?.contains(e.target) && 
          !e.target.closest('[data-mode="generate"]')) {
        this.generatePopover?.remove();
        this.generatePopover = null;
      }
    }, { once: true });

    this.map.parentElement.appendChild(this.generatePopover);

    // Position popover above toolbar button
    const generateBtn = this.toolbar?.querySelector('[data-mode="generate"]');
    if (generateBtn) {
      const rect = generateBtn.getBoundingClientRect();
      this.generatePopover.style.left = `${rect.left}px`;
      this.generatePopover.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    }
  }

  async generateRandomServer() {
    const server = await this.api.generateServer(this.state.mapId, 'random');
    if (server && window.servers) {
      window.servers.push(server);
      if (typeof window.updateMapMarkers === 'function') {
        window.updateMapMarkers();
      }
    }
  }

  setupMapListeners() {
    this.map.addEventListener('click', (e) => {
      if (this.state.mode === 'comment') {
        this.handleCommentClick(e);
      }
    });

    if (this.state.mode === 'drag') {
      this.map.classList.add('drag-mode');
    }
  }

  async handleCommentClick(e) {
    const rect = this.map.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const text = prompt('Введите комментарий:');
    if (!text) return;

    const comment = await this.api.createComment(this.state.mapId, { x, y, text });
    if (comment) {
      this.state.addComment(comment);
    }
  }

  render() {
    // Show/hide toolbar based on dev mode
    if (this.toolbar) {
      this.toolbar.style.display = this.state.devMode ? 'flex' : 'none';
    }

    // Update toolbar buttons
    document.querySelectorAll('.map-tool-btn').forEach(btn => {
      const mode = btn.dataset.mode;
      if (mode === 'generate') return; // Skip generate, it's a popover trigger
      btn.classList.toggle('active', this.state.mode === mode);
    });

    // Update map classes
    this.map.classList.remove('drag-mode', 'comment-mode');
    if (this.state.mode === 'drag') this.map.classList.add('drag-mode');
    if (this.state.mode === 'comment') this.map.classList.add('comment-mode');

    // Render comments
    if (this.state.devMode && !this.state.hideComments) {
      this.renderComments();
    } else {
      document.querySelectorAll('.map-comment').forEach(el => el.remove());
    }
  }

  renderComments() {
    // Clear old comments
    document.querySelectorAll('.map-comment').forEach(el => el.remove());

    // Render new comments
    this.state.comments.forEach(comment => {
      const el = document.createElement('div');
      el.className = 'map-comment';
      el.style.left = comment.x + 'px';
      el.style.top = comment.y + 'px';

      const avatar = comment.user?.avatar || '/assets/Lucid_V1.2_icons/PNG/Flat/32/Person.png';
      el.innerHTML = `
        <img src="${avatar}" class="comment-avatar" alt="avatar">
        <img src="/assets/Lucid_V1.2_icons/PNG/Flat/32/Message-Three-Dots.png" class="comment-icon" alt="msg">
      `;

      el.title = `${comment.user?.name || 'Unknown'}: ${comment.text}`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showCommentPopover(comment, el);
      });

      this.map.appendChild(el);
    });
  }

  showCommentPopover(comment, element) {
    if (this.currentCommentPopover) {
      this.currentCommentPopover.remove();
    }

    const popover = document.createElement('div');
    popover.className = 'comment-popover';
    popover.innerHTML = `
      <div class="comment-popover-header">
        <img src="${comment.user?.avatar || '/assets/Lucid_V1.2_icons/PNG/Flat/32/Person.png'}" class="popover-avatar" alt="">
        <div>
          <div class="popover-username">${comment.user?.name || 'Unknown'}</div>
          <div class="popover-time">${new Date(comment.created_at).toLocaleString('ru-RU')}</div>
        </div>
      </div>
      <div class="comment-popover-text">${comment.text}</div>
      <div class="comment-popover-actions">
        <button class="popover-delete-btn" data-id="${comment.id}">Удалить</button>
      </div>
    `;

    popover.querySelector('.popover-delete-btn').addEventListener('click', async () => {
      const deleted = await this.api.deleteComment(comment.id);
      if (deleted) {
        this.state.removeComment(comment.id);
      }
      popover.remove();
    });

    document.body.appendChild(popover);
    this.currentCommentPopover = popover;

    // Position popover
    const rect = element.getBoundingClientRect();
    popover.style.left = (rect.left + rect.width / 2 - 80) + 'px';
    popover.style.top = (rect.top - popover.offsetHeight - 10) + 'px';

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !element.contains(e.target)) {
          popover.remove();
        }
      }, { once: true });
    }, 0);
  }

  async loadComments() {
    const comments = await this.api.getComments(this.state.mapId);
    this.state.setComments(comments);
  }
}

// Export for use in main script
window.MapToolsState = MapToolsState;
window.MapToolsAPI = MapToolsAPI;
window.MapToolsUI = MapToolsUI;
