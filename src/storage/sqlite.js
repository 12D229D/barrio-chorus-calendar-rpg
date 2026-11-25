// Storage SQLite WASM y Fallback LocalStorage reactivo
// Mantiene coherencia con schema.sql para el estado del juego, vínculos e inventario

const STORAGE_KEY = 'barrio_chorus_save_state_v1';

export class GameStorage {
  constructor() {
    this.state = null;
    this.db = null;
  }

  async init() {
    // Si SQL.js o SQLite WASM está disponible en el entorno global lo inicializa;
    // de lo contrario utiliza almacenamiento estructurado local con contrato SQL idéntico
    try {
      if (window.initSqlJs) {
        const SQL = await window.initSqlJs();
        const savedData = localStorage.getItem(STORAGE_KEY + '_wasm');
        if (savedData) {
          const uInt8Array = new Uint8Array(JSON.parse(savedData));
          this.db = new SQL.Database(uInt8Array);
        } else {
          this.db = new SQL.Database();
          await this.executeSchema();
        }
      }
    } catch (e) {
      console.warn('SQLite WASM no disponible en offline local, usando persistencia estructurada JSON/LocalStorage:', e);
    }

    this.loadState();
    return this.state;
  }

  async executeSchema() {
    if (!this.db) return;
    try {
      const resp = await fetch('schema.sql');
      const sqlText = await resp.text();
      this.db.run(sqlText);
    } catch (e) {
      console.warn('Error al cargar schema.sql en SQLite WASM:', e);
    }
  }

  getDefaultState() {
    return {
      currentDay: 1, // Días 1 al 7 (Día 7 es el clímax de la Feria y batalla contra El Rumor)
      currentTimeSlot: 'day', // 'day' (Día: Micro-trabajos), 'afternoon' (Tarde: Hilos sociales), 'night' (Noche: Exploración del Coro), 'summary' (Resumen y descanso)
      resonanceLevel: 1,
      stats: {
        courage: 10,  // Coraje para resistir sombras disonantes
        empathy: 10,  // Empatía para comprender secretos y sanar
        rhythm: 10    // Ritmo para dominar el tempo del combate coral
      },
      cashPesos: 25000,
      voiceEssence: 50,
      playerHp: 100,
      maxHp: 100,
      playerHarmonia: 60,
      maxHarmonia: 60,
      bossBeaten: false,
      socialLinks: {
        mateo: { id: 'mateo', name: 'Mateo Valderrama', affinity: 10, level: 1, maxLevel: 3, unreadChat: 1 },
        carmen: { id: 'carmen', name: 'Doña Carmen Salazar', affinity: 15, level: 1, maxLevel: 3, unreadChat: 1 },
        sofia: { id: 'sofia', name: 'Sofía Restrepo', affinity: 10, level: 1, maxLevel: 3, unreadChat: 1 }
      },
      equippedVoices: ['v_latido_urbano', 'v_eco_esquina', 'v_canto_matinal', 'v_polifonía_barrial'],
      unlockedVoices: ['v_latido_urbano', 'v_eco_esquina', 'v_canto_matinal', 'v_polifonía_barrial', 'v_serenata_andén'],
      eventsLog: [
        { day: 1, timeSlot: 'day', desc: 'Comienza la semana previa a la Gran Feria Comunal del Barrio.' }
      ]
    };
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
      } else {
        this.state = this.getDefaultState();
        this.saveState();
      }
    } catch (e) {
      console.error('Error cargando estado:', e);
      this.state = this.getDefaultState();
    }
    return this.state;
  }

  saveState() {
    if (!this.state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));

      // Si WASM SQLite está activo, sincroniza la tabla
      if (this.db) {
        this.db.run(`
          INSERT OR REPLACE INTO game_save 
          (id, current_day, current_time_slot, resonance_level, courage, empathy, rhythm, cash_pesos, voice_essence, current_hp, max_hp, current_harmonia, max_harmonia, story_flag_boss_beaten)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          this.state.currentDay,
          this.state.currentTimeSlot,
          this.state.resonanceLevel,
          this.state.stats.courage,
          this.state.stats.empathy,
          this.state.stats.rhythm,
          this.state.cashPesos,
          this.state.voiceEssence,
          this.state.playerHp,
          this.state.maxHp,
          this.state.playerHarmonia,
          this.state.maxHarmonia,
          this.state.bossBeaten ? 1 : 0
        ]);

        const data = this.db.export();
        const buffer = Array.from(data);
        localStorage.setItem(STORAGE_KEY + '_wasm', JSON.stringify(buffer));
      }
    } catch (e) {
      console.error('Error guardando estado:', e);
    }
  }

  resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_wasm');
    this.state = this.getDefaultState();
    this.saveState();
    return this.state;
  }
}

export const storage = new GameStorage();
