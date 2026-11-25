// Orquestador Principal de Barrio Chorus: RPG Calendario y Vida Social
// Integra máquina de estados, calendario, vida social, exploración del Coro y combate coral

import { storage } from './storage/sqlite.js';
import { CalendarManager } from './calendar.js';
import { GameStateMachine, GameStates } from './stateMachine.js';
import { ThreadsGraph } from './social/threadsGraph.js';
import { DialogueSystem } from './social/dialogue.js';
import { JOBS_CATALOG, executeJob } from './social/jobs.js';
import { DungeonGenerator } from './dungeon/generator.js';
import { ChoralCombatEngine } from './combat/choralTurns.js';
import { DiegeticMenuManager } from './ui/menuDiegetic.js';
import { PhoneThreadsUI } from './ui/phoneThreads.js';

export class BarrioChorusApp {
  constructor() {
    this.storage = storage;
    this.state = null;
    this.charactersData = null;
    this.dialoguesData = null;
    this.voicesData = null;

    this.calendarManager = null;
    this.stateMachine = null;
    this.threadsGraph = null;
    this.dialogueSystem = null;
    this.activeCombatEngine = null;
    this.currentDungeonFloor = null;
    this.currentFloorIndex = 1;
  }

  async init() {
    console.log('[BarrioChorus] Inicializando motor de juego...');

    // 1. Cargar persistencia (SQLite WASM / LocalStorage fallback)
    this.state = await this.storage.init();

    // 2. Cargar datos declarativos JSON
    const [charRes, diaRes, voiRes] = await Promise.all([
      fetch('src/data/characters.json').then(r => r.json()),
      fetch('src/data/dialogues.json').then(r => r.json()),
      fetch('src/data/voices.json').then(r => r.json())
    ]);

    this.charactersData = charRes;
    this.dialoguesData = diaRes;
    this.voicesData = voiRes;

    // 3. Inicializar subsistemas
    this.calendarManager = new CalendarManager(this.state);
    this.threadsGraph = new ThreadsGraph(this.charactersData, this.state.socialLinks);
    this.dialogueSystem = new DialogueSystem(this.dialoguesData, this.state, this.onDialogueCompleted.bind(this));

    // 4. Inicializar Navegación Diegética de smartphone
    this.menuManager = new DiegeticMenuManager(document.getElementById('diegeticNav'), this.onTabChanged.bind(this));
    this.menuManager.init();

    this.phoneUI = new PhoneThreadsUI(document.getElementById('phoneContentArea'), this.state);

    // 5. Máquina de estados
    this.stateMachine = new GameStateMachine(this.determineInitialState(), this.handleStateTransition.bind(this));

    // 6. Configurar listeners de interfaz
    this.setupGlobalControls();

    // 7. Primera actualización visual
    this.updateGlobalHeader();
    this.updateHeroSidebar();
    this.renderCurrentState();
  }

  determineInitialState() {
    if (this.state.bossBeaten) return GameStates.VICTORY;
    if (this.state.playerHp <= 0) return GameStates.GAME_OVER;

    switch (this.state.currentTimeSlot) {
      case 'day': return GameStates.DAY_LIFE;
      case 'afternoon': return GameStates.AFTERNOON_SOCIAL;
      case 'night': return GameStates.NIGHT_CORO;
      case 'summary': return GameStates.SUMMARY;
      default: return GameStates.DAY_LIFE;
    }
  }

  setupGlobalControls() {
    const advanceBtn = document.getElementById('advanceTimeBtn');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => {
        this.advanceSlot();
      });
    }

    const resetBtn = document.getElementById('resetGameBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('¿Deseas reiniciar la semana y borrar tu progreso actual?')) {
          this.state = this.storage.resetGame();
          location.reload();
        }
      });
    }
  }

  onTabChanged(tab) {
    const phoneArea = document.getElementById('phoneContentArea');
    if (!phoneArea) return;

    if (tab === 'messages') {
      this.phoneUI.render();
    } else if (tab === 'threads') {
      phoneArea.innerHTML = `
        <div class="glass-panel" style="margin: 0.5rem;">
          <h3 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--choral-cyan);">Red de Hilos de Barrio</h3>
          <div id="phoneThreadsSvgWrap"></div>
          <p style="font-size: 0.72rem; color: var(--text-dim); margin-top: 0.5rem;">La conexión entre vecinos amplifica la afinidad y la armonía coral compartida.</p>
        </div>
      `;
      this.threadsGraph.renderGraphSvg('phoneThreadsSvgWrap');
    } else if (tab === 'calendar') {
      const dayData = this.calendarManager.getCurrentDayData();
      phoneArea.innerHTML = `
        <div class="glass-panel" style="margin: 0.5rem; font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="font-weight: 700; color: var(--streetlamp-amber); font-size: 0.95rem;">📅 Agenda: Día ${dayData.dayNumber} - ${dayData.weekday}</div>
          <div><strong>Clima:</strong> ${dayData.weather}</div>
          <div><strong>Ambiente del Barrio:</strong> ${dayData.neighborhoodMood}</div>
          <div style="border-top: 1px solid var(--glass-border); padding-top: 0.4rem;"><strong>Suceso Central:</strong> ${dayData.dayEvent}</div>
          <div><strong>Disonancia Nocturna:</strong> ${dayData.nightDissonance}</div>
        </div>
      `;
    } else if (tab === 'voices') {
      const equipped = this.voicesData.voices.filter(v => this.state.equippedVoices.includes(v.id));
      phoneArea.innerHTML = `
        <div class="glass-panel" style="margin: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
          <h3 style="font-size: 0.9rem; color: var(--streetlamp-amber);">🎶 Diapasón de Voces Afinadas</h3>
          ${equipped.map(v => `
            <div style="background: var(--bg-surface); border: 1px solid var(--glass-border); padding: 0.5rem; border-radius: 6px; font-size: 0.75rem;">
              <div style="display: flex; justify-content: space-between;">
                <strong>${v.name}</strong>
                <span style="color: var(--choral-cyan);">${v.timbre} (${v.cost} Armonía)</span>
              </div>
              <div style="color: var(--text-muted); margin-top: 0.2rem;">${v.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  handleStateTransition(newState, prevState, payload) {
    this.renderCurrentState();
    this.updateGlobalHeader();
    this.updateHeroSidebar();
    this.storage.saveState();
  }

  renderCurrentState() {
    const stageEl = document.getElementById('mainStage');
    if (!stageEl) return;

    const state = this.stateMachine.getState();

    switch (state) {
      case GameStates.DAY_LIFE:
        this.renderDayLife(stageEl);
        break;
      case GameStates.AFTERNOON_SOCIAL:
        this.renderAfternoonSocial(stageEl);
        break;
      case GameStates.NIGHT_CORO:
        this.renderNightCoro(stageEl);
        break;
      case GameStates.COMBAT:
        this.renderCombat(stageEl);
        break;
      case GameStates.SUMMARY:
        this.renderSummary(stageEl);
        break;
      case GameStates.VICTORY:
        this.renderVictory(stageEl);
        break;
      case GameStates.GAME_OVER:
        this.renderGameOver(stageEl);
        break;
    }
  }

  renderDayLife(stageEl) {
    const dayData = this.calendarManager.getCurrentDayData();
    stageEl.innerHTML = `
      <div class="stage-card glass-panel">
        <div class="stage-banner">
          <div>
            <h2>☀️ Vida Matutina en el Barrio</h2>
            <p class="tagline">Día ${dayData.dayNumber}: ${dayData.title} — ${dayData.weekday}</p>
          </div>
          <span class="badge">Franja: Mañana</span>
        </div>

        <div style="margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-muted);">
          El sol despunta sobre las tejas de arcilla. Los vecinos abren sus locales y preparan la calle para la Gran Feria. Selecciona un trabajo o aporte para ganar sustento y afinar tu carácter:
        </div>

        <div class="jobs-grid">
          ${JOBS_CATALOG.map(job => `
            <div class="job-card">
              <div class="job-card-header">
                <span class="job-icon">${job.icon}</span>
                <div>
                  <h4 class="job-title">${job.title}</h4>
                  <span class="job-location">${job.location}</span>
                </div>
              </div>
              <p class="job-desc">${job.desc}</p>
              <div class="job-footer">
                <span class="job-payout">+$${job.payout.toLocaleString()} COP</span>
                <button class="btn-action apply-job-btn" data-job="${job.id}">Trabajar</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    stageEl.querySelectorAll('.apply-job-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const jobId = btn.getAttribute('data-job');
        const res = executeJob(jobId, this.state);
        alert(`¡Trabajo completado con éxito!\n\nGanaste: $${res.earnedCash.toLocaleString()} COP\nEsencia de Voz: +${res.earnedEssence}\nEstadísticas mejoradas: ${JSON.stringify(res.statGains)}`);
        
        // Avanza a la tarde
        this.advanceSlot();
      });
    });
  }

  renderAfternoonSocial(stageEl) {
    stageEl.innerHTML = `
      <div class="stage-card glass-panel">
        <div class="stage-banner">
          <div>
            <h2>🌇 Tarde: Encuentro y Vínculos Barriales</h2>
            <p class="tagline">El sol cae en tonos ocres. Los vecinos descansan y comparten confidencias.</p>
          </div>
          <span class="badge">Franja: Tarde</span>
        </div>

        <div style="display: grid; grid-template-columns: 280px 1fr; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <h4 style="font-size: 0.85rem; color: var(--choral-cyan);">Vecinos Disponibles:</h4>
            ${this.charactersData.characters.map(c => {
              const link = this.state.socialLinks[c.id] || { level: 1, affinity: 0 };
              return `
                <button class="select-char-btn glass-panel" data-char="${c.id}" style="cursor: pointer; text-align: left; border-left: 4px solid ${c.color};">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">${c.avatar}</span>
                    <div>
                      <div style="font-weight: 700; font-size: 0.85rem;">${c.name}</div>
                      <div style="font-size: 0.7rem; color: var(--text-dim);">${c.role}</div>
                      <div style="font-size: 0.72rem; color: var(--streetlamp-amber); margin-top: 0.2rem;">Rango ${link.level} (${link.affinity} pts)</div>
                    </div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <div id="dialogueContainerArea" style="min-height: 320px;">
            <div class="glass-panel" style="height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; color: var(--text-dim);">
              <p>Selecciona a un vecino a la izquierda para fortalecer su Hilo de Barrio.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    stageEl.querySelectorAll('.select-char-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const charId = btn.getAttribute('data-char');
        const container = stageEl.querySelector('#dialogueContainerArea');
        this.dialogueSystem.startDialogue(charId, container);
      });
    });
  }

  onDialogueCompleted(dialogue, pickedOption) {
    // Fortalecer el hilo del personaje seleccionado y propagar sinergia
    const speakerChar = this.charactersData.characters.find(c => c.name === dialogue.speaker);
    const targetId = speakerChar ? speakerChar.id : 'carmen';

    const result = this.threadsGraph.addAffinity(targetId, pickedOption.gainAffinity);

    let msg = `✨ Fortaleciste tu vínculo con ${dialogue.speaker} (+${result.primaryGain} afinidad).`;
    if (result.leveledUp) {
      msg += `\n\n🎉 ¡Rango de Hilo aumentado al Nivel ${this.state.socialLinks[targetId].level}!\nBeneficio: ${result.newPerk.perk}`;
    }
    if (result.echoGains.length > 0) {
      msg += `\n\n🧶 Resonancia comunitaria propagada:`;
      result.echoGains.forEach(eg => {
        msg += `\n- ${eg.name}: +${eg.amount} afinidad (${eg.reason})`;
      });
    }

    alert(msg);
    // Avanzar a la noche
    this.advanceSlot();
  }

  renderNightCoro(stageEl) {
    const isBossNight = this.state.currentDay >= 7;
    const dungeonGen = new DungeonGenerator(this.state.currentDay, this.threadsGraph.calculateTeamHarmony());
    this.currentDungeonFloor = dungeonGen.generateFloor(this.currentFloorIndex);

    stageEl.innerHTML = `
      <div class="stage-card glass-panel" style="background: radial-gradient(circle at 50% 20%, hsla(270, 60%, 15%, 0.8), hsl(260, 30%, 10%));">
        <div class="stage-banner" style="border-left: 4px solid var(--choral-cyan);">
          <div>
            <h2>🌙 El Coro: ${this.currentDungeonFloor.title}</h2>
            <p class="tagline">${this.currentDungeonFloor.theme}</p>
          </div>
          <span class="badge" style="color: var(--choral-cyan);">${isBossNight ? '¡Clímax Semanal!' : 'Exploración Onírica'}</span>
        </div>

        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
          Al cerrar los ojos, entras en la dimensión acústica donde los miedos y murmullos vecinales toman forma sombría. La armonía de tus amigos es tu único escudo.
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${this.currentDungeonFloor.nodes.map(node => `
            <div class="glass-panel" style="display: flex; justify-content: space-between; align-items: center; padding: 0.9rem;">
              <div>
                <h4 style="font-size: 0.9rem; color: #fff;">${node.title}</h4>
                <p style="font-size: 0.75rem; color: var(--text-dim); margin-top: 0.2rem;">
                  ${node.type === 'boss' ? '👹 ¡El Rumor Gigante que desestabiliza la Gran Feria!' : (node.type === 'fountain' ? '☕ Remanso que sana y alivia el estrés' : '👤 Sombra Disonante')}
                </p>
              </div>
              <button class="btn-action enter-node-btn" data-node-id="${node.id}">
                ${node.type === 'fountain' ? 'Beber y Sanar' : 'Entrar en Resonancia'}
              </button>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 1.5rem; display: flex; justify-content: flex-end;">
          <button id="finishNightBtn" class="secondary-btn">Concluir Noche y Volver a Casa</button>
        </div>
      </div>
    `;

    stageEl.querySelectorAll('.enter-node-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.getAttribute('data-node-id');
        const node = this.currentDungeonFloor.nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (node.type === 'fountain') {
          this.state.playerHp = this.state.maxHp;
          this.state.playerHarmonia = this.state.maxHarmonia;
          alert('¡Bebiste agua de panela tibia con limón! Tu Vitalidad y Armonía se han restaurado al máximo.');
          this.updateHeroSidebar();
        } else {
          // Iniciar combate coral
          this.startCombat(node.enemy);
        }
      });
    });

    const finishBtn = stageEl.querySelector('#finishNightBtn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.advanceSlot();
      });
    }
  }

  startCombat(enemyData) {
    const equipped = this.voicesData.voices.filter(v => this.state.equippedVoices.includes(v.id));
    const playerData = {
      hp: this.state.playerHp,
      maxHp: this.state.maxHp,
      harmonia: this.state.playerHarmonia,
      maxHarmonia: this.state.maxHarmonia,
      stats: this.state.stats
    };

    this.activeCombatEngine = new ChoralCombatEngine(playerData, enemyData, equipped, (res) => {
      this.state.playerHp = playerData.hp;
      this.state.playerHarmonia = playerData.harmonia;

      if (res.victory) {
        if (enemyData.isBoss) {
          this.state.bossBeaten = true;
          this.stateMachine.transitionTo(GameStates.VICTORY);
          return;
        }
        alert(`¡Victoria Coral! Has disipado a ${enemyData.name}. Tu equipo recupera la calma.`);
        this.stateMachine.transitionTo(GameStates.NIGHT_CORO);
      } else {
        this.stateMachine.transitionTo(GameStates.GAME_OVER);
      }
    });

    this.stateMachine.transitionTo(GameStates.COMBAT);
  }

  renderCombat(stageEl) {
    if (!this.activeCombatEngine) return;

    const eng = this.activeCombatEngine;
    const enemy = eng.enemy;
    const player = eng.player;

    const playerHpPercent = Math.round((player.hp / player.maxHp) * 100);
    const enemyHpPercent = Math.round((enemy.hp / enemy.maxHp) * 100);
    const playerHarPercent = Math.round((player.harmonia / player.maxHarmonia) * 100);

    stageEl.innerHTML = `
      <div class="stage-card glass-panel combat-arena">
        <div class="stage-banner" style="border-left: 4px solid var(--streetlamp-amber);">
          <div>
            <h2>🎵 Combate Coral por Turnos</h2>
            <p class="tagline">Armoniza tus voces para neutralizar la disonancia del Coro.</p>
          </div>
          <span class="badge">${enemy.isBoss ? '¡JEFE DE LA SEMANA!' : 'Sombra Emocional'}</span>
        </div>

        <div class="combat-top-row">
          <!-- Combatiente: Protagonista -->
          <div class="combatant-card">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem;">
              <span>Tú (Voz Comunal)</span>
              <span>${player.hp} / ${player.maxHp} HP</span>
            </div>
            <div class="gauge-bar-wrap">
              <div class="gauge-fill gauge-hp" style="width: ${playerHpPercent}%;"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--choral-cyan); margin-top: 0.2rem;">
              <span>Armonía</span>
              <span>${player.harmonia} / ${player.maxHarmonia}</span>
            </div>
            <div class="gauge-bar-wrap">
              <div class="gauge-fill gauge-harmonia" style="width: ${playerHarPercent}%;"></div>
            </div>
            ${eng.playerShield > 0 ? `<div style="font-size: 0.72rem; color: #72f7a0;">🛡️ Escudo activo: ${eng.playerShield} pts</div>` : ''}
          </div>

          <!-- Dial Central de Tempo -->
          <div class="tempo-dial-wrap">
            <span class="tempo-label">DIAL DE TEMPO</span>
            <div class="tempo-track">
              <div class="tempo-needle" style="left: ${eng.tempoGauge}%;"></div>
            </div>
            <span style="font-size: 0.65rem; color: var(--text-dim);">${eng.tempoGauge > 50 ? 'Ventaja: Jugador' : 'Ventaja: Sombra'}</span>
          </div>

          <!-- Combatiente: Sombra / Jefe -->
          <div class="combatant-card ${enemy.isBoss ? 'boss' : ''}">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem;">
              <span>${enemy.name}</span>
              <span>${enemy.hp} / ${enemy.maxHp} HP</span>
            </div>
            <div class="gauge-bar-wrap">
              <div class="gauge-fill gauge-hp" style="width: ${enemyHpPercent}%;"></div>
            </div>
            <div style="font-size: 0.72rem; color: var(--streetlamp-amber); margin-top: 0.3rem;">
              Vulnerable a: <strong>[Voz ${enemy.timbreWeakness}]</strong>
            </div>
          </div>
        </div>

        <!-- Diapasón de Acciones Corales -->
        <div>
          <h4 style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--streetlamp-amber);">Afinar Acorde:</h4>
          <div class="voices-action-tray">
            ${eng.voices.map(v => {
              const timbreClass = v.timbre.toLowerCase();
              const canAfford = eng.canAffordVoice(v);
              return `
                <button class="voice-card-btn ${timbreClass}" data-voice="${v.id}" ${canAfford ? '' : 'disabled'}>
                  <div class="voice-card-top">
                    <span class="voice-name">${v.name}</span>
                    <span class="voice-timbre-tag">${v.timbre} • ${v.cost} Arm.</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${v.desc}</div>
                  <div class="voice-synergy-tip">${v.synergyDesc}</div>
                </button>
              `;
            }).join('')}
            <button id="breatheFocusBtn" class="voice-card-btn" style="border-left: 4px solid #72f7a0;">
              <div class="voice-card-top">
                <span class="voice-name">Respirar & Concentrarse</span>
                <span class="voice-timbre-tag">0 Arm.</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Toma aire para recuperar Armonía (+25) y levantar un escudo suave (+10).</div>
            </button>
          </div>
        </div>

        <!-- Registro de Turnos -->
        <div>
          <h4 style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 0.3rem;">Eco de la Sala:</h4>
          <div class="combat-log-box">
            ${eng.combatLog.map(msg => `<div>${msg}</div>`).join('')}
          </div>
        </div>
      </div>
    `;

    stageEl.querySelectorAll('.voice-card-btn[data-voice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const vId = btn.getAttribute('data-voice');
        eng.playVoice(vId);
        this.renderCombat(stageEl);
      });
    });

    const breatheBtn = stageEl.querySelector('#breatheFocusBtn');
    if (breatheBtn) {
      breatheBtn.addEventListener('click', () => {
        eng.breatheAndFocus();
        this.renderCombat(stageEl);
      });
    }
  }

  renderSummary(stageEl) {
    const dayData = this.calendarManager.getCurrentDayData();
    stageEl.innerHTML = `
      <div class="stage-card glass-panel" style="text-align: center; max-width: 600px; margin: 0 auto;">
        <h2 style="font-family: var(--font-display); color: var(--streetlamp-amber); margin-bottom: 0.5rem;">🌙 Fin de la Jornada</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Día ${dayData.dayNumber}: ${dayData.title} ha concluido.</p>

        <div class="glass-panel" style="margin: 1.5rem 0; text-align: left; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.6rem;">
          <div>💰 <strong>Pesos COP:</strong> $${this.state.cashPesos.toLocaleString()}</div>
          <div>✨ <strong>Esencia de Voz:</strong> ${this.state.voiceEssence} pts</div>
          <div>💖 <strong>Vitalidad:</strong> ${this.state.playerHp} / ${this.state.maxHp}</div>
          <div>🎵 <strong>Armonía de Equipo:</strong> ${this.threadsGraph.calculateTeamHarmony()} pts</div>
          <div style="border-top: 1px solid var(--glass-border); padding-top: 0.5rem;">
            <strong>Días restantes para la Gran Feria:</strong> ${Math.max(0, 7 - this.state.currentDay)}
          </div>
        </div>

        <button id="sleepNextDayBtn" class="primary-btn" style="width: 100%; font-size: 1rem; padding: 0.8rem;">
          Dormir y Despertar al Día Siguiente
        </button>
      </div>
    `;

    const sleepBtn = stageEl.querySelector('#sleepNextDayBtn');
    if (sleepBtn) {
      sleepBtn.addEventListener('click', () => {
        this.state.playerHp = this.state.maxHp;
        this.state.playerHarmonia = this.state.maxHarmonia;
        this.advanceSlot();
      });
    }
  }

  renderVictory(stageEl) {
    stageEl.innerHTML = `
      <div class="stage-card glass-panel" style="text-align: center; max-width: 640px; margin: 0 auto; border: 2px solid var(--streetlamp-amber);">
        <h2 style="font-family: var(--font-display); font-size: 2rem; color: var(--streetlamp-amber); margin-bottom: 0.8rem;">🎉 ¡VICTORIA CORAL!</h2>
        <p style="font-size: 1.1rem; color: #fff; line-height: 1.5; margin-bottom: 1.5rem;">
          Has derrotado a <strong>El Rumor Gigante</strong>. La Gran Feria Comunal del Barrio ha comenzado con un estallido de gaitas, bajos acústicos y aroma a pan de horno recién salido.
        </p>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          Los hilos comunitarios entre Mateo, Doña Carmen y Sofía brillan con luz dorada. La verdad y el canto han salvado al vecindario.
        </p>
        <button id="playAgainBtn" class="primary-btn" style="padding: 0.8rem 1.5rem;">Iniciar Nueva Semana</button>
      </div>
    `;

    const btn = stageEl.querySelector('#playAgainBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.state = this.storage.resetGame();
        location.reload();
      });
    }
  }

  renderGameOver(stageEl) {
    stageEl.innerHTML = `
      <div class="stage-card glass-panel" style="text-align: center; max-width: 600px; margin: 0 auto; border: 2px solid var(--dissonance-crimson);">
        <h2 style="font-family: var(--font-display); font-size: 2rem; color: var(--dissonance-crimson); margin-bottom: 0.8rem;">💔 Silencio Disonante</h2>
        <p style="font-size: 1rem; color: #fff; margin-bottom: 1.5rem;">
          Tu voz se quebró ante la presión de las sombras y el desalojo. La duda silenció el canto del barrio.
        </p>
        <button id="retryBtn" class="primary-btn">Intentar de Nuevo</button>
      </div>
    `;

    const retry = stageEl.querySelector('#retryBtn');
    if (retry) {
      retry.addEventListener('click', () => {
        this.state.playerHp = this.state.maxHp;
        this.state.playerHarmonia = this.state.maxHarmonia;
        this.stateMachine.transitionTo(GameStates.DAY_LIFE);
      });
    }
  }

  advanceSlot() {
    this.calendarManager.advanceTimeSlot();
    this.stateMachine.transitionTo(this.determineInitialState());
  }

  updateGlobalHeader() {
    const dayData = this.calendarManager.getCurrentDayData();
    const dayEl = document.getElementById('currentDayDisplay');
    const slotEl = document.getElementById('currentTimeSlotDisplay');

    if (dayEl) dayEl.textContent = `Día ${dayData.dayNumber}: ${dayData.weekday}`;
    if (slotEl) slotEl.textContent = this.calendarManager.getTimeSlotLabel(this.state.currentTimeSlot);
  }

  updateHeroSidebar() {
    const moneyEl = document.getElementById('heroMoneyDisplay');
    const essenceEl = document.getElementById('heroEssenceDisplay');
    const courageEl = document.getElementById('statCourageVal');
    const empathyEl = document.getElementById('statEmpathyVal');
    const rhythmEl = document.getElementById('statRhythmVal');
    const hpBar = document.getElementById('sidebarHpBar');
    const harBar = document.getElementById('sidebarHarBar');
    const hpText = document.getElementById('sidebarHpText');
    const harText = document.getElementById('sidebarHarText');

    if (moneyEl) moneyEl.textContent = `$${(this.state.cashPesos || 0).toLocaleString()} COP`;
    if (essenceEl) essenceEl.textContent = `${this.state.voiceEssence || 0} pts`;
    if (courageEl) courageEl.textContent = this.state.stats.courage || 10;
    if (empathyEl) empathyEl.textContent = this.state.stats.empathy || 10;
    if (rhythmEl) rhythmEl.textContent = this.state.stats.rhythm || 10;

    const hpPct = Math.round((this.state.playerHp / this.state.maxHp) * 100);
    const harPct = Math.round((this.state.playerHarmonia / this.state.maxHarmonia) * 100);

    if (hpBar) hpBar.style.width = `${hpPct}%`;
    if (harBar) harBar.style.width = `${harPct}%`;
    if (hpText) hpText.textContent = `${this.state.playerHp}/${this.state.maxHp}`;
    if (harText) harText.textContent = `${this.state.playerHarmonia}/${this.state.maxHarmonia}`;

    // Renderizar grafo en la barra lateral si el contenedor existe
    this.threadsGraph.renderGraphSvg('sidebarThreadsSvg');
  }
}

// Inicialización automática al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  const app = new BarrioChorusApp();
  app.init().catch(err => console.error('Error al inicializar Barrio Chorus:', err));
  window.barrioChorusApp = app;
});
