// Motor de diálogo con árboles ramificados y chequeos de estadísticas (Coraje, Empatía, Ritmo)

export class DialogueSystem {
  constructor(dialoguesData, gameState, onDialogueFinish) {
    this.dialogues = dialoguesData.dialogues;
    this.gameState = gameState;
    this.onDialogueFinish = onDialogueFinish;
    this.activeDialogue = null;
  }

  getAvailableDialogue(characterId) {
    const list = this.dialogues[characterId];
    if (!list || list.length === 0) return null;

    const charLevel = this.gameState.socialLinks[characterId]?.level || 1;
    // Encuentra un diálogo adecuado para el rango
    const match = list.find(d => d.minLevel <= charLevel);
    return match || list[0];
  }

  startDialogue(characterId, containerEl) {
    const dialogue = this.getAvailableDialogue(characterId);
    if (!dialogue) {
      containerEl.innerHTML = `<p class="dialogue-fallback">Este vecino está ocupado en sus tareas cotidianas hoy.</p>`;
      return;
    }

    this.activeDialogue = dialogue;
    this.renderDialogueStep(containerEl, dialogue);
  }

  renderDialogueStep(containerEl, dialogue) {
    const optionsHtml = dialogue.options.map((opt, idx) => {
      const currentStatVal = this.gameState.stats[opt.statRequired] || 0;
      const canPick = currentStatVal >= opt.statVal;
      const statLabel = opt.statRequired.toUpperCase();

      return `
        <button class="dialogue-option-btn ${canPick ? 'ready' : 'locked'}" data-opt-idx="${idx}" ${canPick ? '' : 'disabled'}>
          <div class="opt-header">
            <span class="opt-tag">[${statLabel} ${opt.statVal}]</span>
            <span class="opt-status">${canPick ? '✓ Apto' : '✗ Requiere más ' + statLabel}</span>
          </div>
          <p class="opt-text">"${opt.label}"</p>
        </button>
      `;
    }).join('');

    containerEl.innerHTML = `
      <div class="dialogue-box glass-panel">
        <div class="dialogue-header">
          <span class="speaker-badge">${dialogue.speaker}</span>
          <span class="dialogue-title">${dialogue.title}</span>
        </div>
        <div class="dialogue-speech">
          <p class="speech-text">"${dialogue.text}"</p>
        </div>
        <div class="dialogue-options-list">
          ${optionsHtml}
        </div>
      </div>
    `;

    // Conectar eventos de clic
    containerEl.querySelectorAll('.dialogue-option-btn.ready').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-opt-idx'), 10);
        this.selectOption(containerEl, dialogue, idx);
      });
    });
  }

  selectOption(containerEl, dialogue, optionIndex) {
    const option = dialogue.options[optionIndex];
    if (!option) return;

    // Aplicar recompensas de estadísticas
    if (option.gainStat) {
      Object.entries(option.gainStat).forEach(([st, val]) => {
        this.gameState.stats[st] = (this.gameState.stats[st] || 0) + val;
      });
    }

    containerEl.innerHTML = `
      <div class="dialogue-box glass-panel highlight-response">
        <div class="dialogue-header">
          <span class="speaker-badge">${dialogue.speaker}</span>
        </div>
        <div class="dialogue-speech">
          <p class="speech-text">"${option.response}"</p>
        </div>
        <div class="dialogue-rewards">
          <span class="reward-pill">+${option.gainAffinity} Afinidad de Hilo</span>
          ${Object.entries(option.gainStat || {}).map(([s, v]) => `<span class="reward-pill stat">+${v} ${s.toUpperCase()}</span>`).join(' ')}
        </div>
        <button id="finishDialogueBtn" class="primary-btn">Cerrar Conversación y Guardar Vínculo</button>
      </div>
    `;

    const finishBtn = containerEl.querySelector('#finishDialogueBtn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        if (this.onDialogueFinish) {
          this.onDialogueFinish(dialogue, option);
        }
      });
    }
  }
}
