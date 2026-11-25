// Menú diegético estilo Smartphone Urbano
// Permite alternar entre la Agenda Semanal, el Mapa de Hilos de Barrio, el Teléfono y el Diapasón de Voces

export class DiegeticMenuManager {
  constructor(phoneContainer, onTabChange) {
    this.phoneContainer = phoneContainer;
    this.onTabChange = onTabChange;
    this.activeTab = 'calendar'; // 'calendar', 'threads', 'messages', 'voices'
  }

  init() {
    this.renderTabsNav();
  }

  renderTabsNav() {
    const navEl = document.getElementById('diegeticNav');
    if (!navEl) return;

    navEl.innerHTML = `
      <div class="diegetic-nav-bar">
        <button class="d-nav-btn ${this.activeTab === 'calendar' ? 'active' : ''}" data-tab="calendar">
          <span class="icon">📅</span>
          <span class="label">Agenda</span>
        </button>
        <button class="d-nav-btn ${this.activeTab === 'threads' ? 'active' : ''}" data-tab="threads">
          <span class="icon">🧶</span>
          <span class="label">Hilos de Barrio</span>
        </button>
        <button class="d-nav-btn ${this.activeTab === 'messages' ? 'active' : ''}" data-tab="messages">
          <span class="icon">💬</span>
          <span class="label">Mensajes</span>
        </button>
        <button class="d-nav-btn ${this.activeTab === 'voices' ? 'active' : ''}" data-tab="voices">
          <span class="icon">🎶</span>
          <span class="label">Diapasón</span>
        </button>
      </div>
    `;

    navEl.querySelectorAll('.d-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.activeTab = tab;
        this.renderTabsNav();
        if (this.onTabChange) {
          this.onTabChange(tab);
        }
      });
    });
  }
}
