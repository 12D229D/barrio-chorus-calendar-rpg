// Micro-trabajos diurnos y actividades para mejorar estadísticas de vida cotidiana
// Permiten ganar Pesos, Esencia de Voz y potenciar Coraje, Empatía y Ritmo

export const JOBS_CATALOG = [
  {
    id: 'panaderia_ayudante',
    title: 'Amasado Matutino en La Espiga',
    location: 'Panadería de Doña Carmen',
    icon: '🥖',
    timeSlot: 'day',
    desc: 'Levantarse al alba a mezclar harina, calentar los hornos de barro y despachar a los vecinos madrugadores.',
    payout: 22000,
    voiceEssence: 12,
    statBonus: { empathy: 2, courage: 1 },
    flavor: 'El calor del horno te llena de vitalidad comunitaria.'
  },
  {
    id: 'taller_cables',
    title: 'Cableado y Calibración Acústica',
    location: 'Taller Ondas & Hebras',
    icon: '🎛️',
    timeSlot: 'day',
    desc: 'Soldar conectores XLR, desenredar cables para los parlantes de la tarima comunal y ajustar frecuencias.',
    payout: 25000,
    voiceEssence: 15,
    statBonus: { rhythm: 3 },
    flavor: 'Tus oídos se afinan al milímetro con cada frecuencia calibrada.'
  },
  {
    id: 'volantes_feria',
    title: 'Repartir Pasquines de la Gran Feria',
    location: 'Plazoleta de los Guayacanes',
    icon: '📢',
    timeSlot: 'day',
    desc: 'Caminar por las cuadras enfrentando miradas escépticas y motivando a los vecinos a acudir a la feria.',
    payout: 18000,
    voiceEssence: 10,
    statBonus: { courage: 3 },
    flavor: 'Tu voz gana firmeza al convocar a los vecinos más reticentes.'
  },
  {
    id: 'ensayo_callejero',
    title: 'Zapateo y Percusión en el Andén',
    location: 'Esquina de Mateo',
    icon: '🥁',
    timeSlot: 'day',
    desc: 'Marcar contratiempos con botes de pintura vacíos junto a Mateo mientras la chiva pasa pitando.',
    payout: 15000,
    voiceEssence: 20,
    statBonus: { rhythm: 2, empathy: 1 },
    flavor: 'La cadencia del barrio fluye como savia por tus manos.'
  }
];

export function executeJob(jobId, gameState) {
  const job = JOBS_CATALOG.find(j => j.id === jobId);
  if (!job) return null;

  gameState.cashPesos += job.payout;
  gameState.voiceEssence += job.voiceEssence;

  Object.entries(job.statBonus).forEach(([stat, val]) => {
    gameState.stats[stat] = (gameState.stats[stat] || 0) + val;
  });

  return {
    job,
    earnedCash: job.payout,
    earnedEssence: job.voiceEssence,
    statGains: job.statBonus
  };
}
