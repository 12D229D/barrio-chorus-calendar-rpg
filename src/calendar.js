// Gestor de Progresión de Calendario Semanal
// 7 Días de preparación antes de la inauguración de la Gran Feria Comunal

export const CALENDAR_DAYS = [
  {
    dayNumber: 1,
    weekday: 'Lunes',
    title: 'Amanecer de Acorde Menor',
    weather: 'Llovizna suave',
    neighborhoodMood: 'Tranquilidad cautelosa en las esquinas',
    dayEvent: 'Llegan los primeros camiones con madera para las tarimas de la feria.',
    nightDissonance: 'Baja: Murmullos dispersos en callejones.'
  },
  {
    dayNumber: 2,
    weekday: 'Martes',
    title: 'Harina y Cables Cruzados',
    weather: 'Nublado y fresco',
    neighborhoodMood: 'Los comerciantes discuten sobre el costo de la energía',
    dayEvent: 'Doña Carmen pide ayuda con pedidos extra de colaciones.',
    nightDissonance: 'Moderada: Sombras de recelo merodean las tiendas.'
  },
  {
    dayNumber: 3,
    weekday: 'Miércoles',
    title: 'Vibraciones en la Plazoleta',
    weather: 'Sol canicular',
    neighborhoodMood: 'Los jóvenes ensayan bailes pero los ancianos se quejan del ruido',
    dayEvent: 'Mateo busca una tarima para tocar sin que la policía comunal lo multe.',
    nightDissonance: 'Creciente: Disonancia rítmica en el Coro.'
  },
  {
    dayNumber: 4,
    weekday: 'Jueves',
    title: 'El Espectrograma del Callejón',
    weather: 'Cielo encapotado',
    neighborhoodMood: 'Corre la voz de un plan de desalojo encubierto',
    dayEvent: 'Sofía capta señales electromagnéticas anómalas en el taller.',
    nightDissonance: 'Alta: La niebla emocional cobra forma de bulldozer espectral.'
  },
  {
    dayNumber: 5,
    weekday: 'Viernes',
    title: 'Noche de Serenata y Vigilia',
    weather: 'Viento frío de cordillera',
    neighborhoodMood: 'Tensión palpable: el barrio decide si resiste o se divide',
    dayEvent: 'Reunión de vecinos en la panadería de Doña Carmen.',
    nightDissonance: 'Muy Alta: El suelo del Coro tiembla.'
  },
  {
    dayNumber: 6,
    weekday: 'Sábado',
    title: 'Víspera de la Gran Feria',
    weather: 'Arcoíris tenue al atardecer',
    neighborhoodMood: 'Esperanza tensa y afinación de todos los instrumentos',
    dayEvent: 'Últimos preparativos de la tarima principal de la feria.',
    nightDissonance: 'Crítica: Se oyen los primeros bramidos de "El Rumor Gigante".'
  },
  {
    dayNumber: 7,
    weekday: 'Domingo',
    title: 'El Día de la Feria Comunal',
    weather: 'Sol radiante de carnaval',
    neighborhoodMood: 'Momento de la verdad: el canto comunal o el silencio del barrio',
    dayEvent: '¡Gran inauguración! El Rumor Gigante intenta sabotear la tarima.',
    nightDissonance: '¡Batalla Final en el Núcleo del Coro!'
  }
];

export class CalendarManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  getCurrentDayData() {
    const day = this.gameState.currentDay || 1;
    return CALENDAR_DAYS.find(d => d.dayNumber === day) || CALENDAR_DAYS[0];
  }

  getTimeSlotLabel(slot) {
    switch (slot) {
      case 'day': return '☀️ Mañana (Trabajos Comunitarios)';
      case 'afternoon': return '🌇 Tarde (Hilos y Vínculos)';
      case 'night': return '🌙 Noche (Exploración del Coro)';
      case 'summary': return '🛌 Madrugada (Bitácora & Descanso)';
      default: return slot;
    }
  }

  advanceTimeSlot() {
    const slots = ['day', 'afternoon', 'night', 'summary'];
    const currentIdx = slots.indexOf(this.gameState.currentTimeSlot);

    if (currentIdx < slots.length - 1) {
      this.gameState.currentTimeSlot = slots[currentIdx + 1];
    } else {
      // Pasa al siguiente día
      this.gameState.currentTimeSlot = 'day';
      this.gameState.currentDay = Math.min(7, (this.gameState.currentDay || 1) + 1);
    }

    return {
      day: this.gameState.currentDay,
      slot: this.gameState.currentTimeSlot
    };
  }
}
