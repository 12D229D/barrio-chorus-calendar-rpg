// Generador procedimental de pisos emocionales del "Coro"
// Cada piso nocturno es una dimensión de ensueño tejida con los miedos y esperanzas del barrio

import { CORO_ENCOUNTERS, BOSS_ENCOUNTER } from '../combat/bossAI.js';

export class DungeonGenerator {
  constructor(currentDay, socialThreadsStrength) {
    this.currentDay = currentDay;
    this.socialStrength = socialThreadsStrength;
  }

  generateFloor(floorIndex) {
    const isBossFloor = this.currentDay >= 7 || floorIndex >= 4;

    if (isBossFloor) {
      return {
        floorNumber: floorIndex,
        title: 'El Núcleo del Rumor: Tarima Quebrada',
        theme: 'Disonancia Máxima y Pánico Masivo',
        ambientColor: 'hsl(340, 80%, 25%)',
        nodeCount: 1,
        isBossFloor: true,
        nodes: [
          {
            id: 'node_boss',
            type: 'boss',
            title: 'Encuentro Clave: El Rumor Gigante',
            enemy: JSON.parse(JSON.stringify(BOSS_ENCOUNTER)),
            visited: false
          }
        ]
      };
    }

    // Nombres poéticos de pisos según la noche
    const floorThemes = [
      { name: 'Pasaje de Farolas Parpadeantes', theme: 'Dudas y Sombras Cortas' },
      { name: 'Patio de los Lavaderos Olvidados', theme: 'Rencores Añejos y Murmullos' },
      { name: 'Azotea de las Antenas Disonantes', theme: 'Interferencias y Teléfonos Rotos' },
      { name: 'Cruce de los Cuatro Vientos', theme: 'Vértigo del Desalojo' }
    ];

    const currentTheme = floorThemes[(floorIndex - 1) % floorThemes.length];

    // Generar 3 a 4 nodos por piso
    const nodeCount = 3;
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      let nodeType = 'combat';
      let enemy = null;
      let title = `Cámara Coral ${i + 1}`;

      if (i === 1 && Math.random() > 0.4) {
        nodeType = 'fountain'; // Fuente de Resonancia para sanar
        title = 'Remanso de Agua de Panela Caliente';
      } else {
        // Seleccionar enemigo acorde al día
        const enemyIdx = Math.min(CORO_ENCOUNTERS.length - 1, Math.floor(Math.random() * CORO_ENCOUNTERS.length));
        enemy = JSON.parse(JSON.stringify(CORO_ENCOUNTERS[enemyIdx]));
        // Escalar según día
        enemy.hp = Math.round(enemy.hp * (1 + (this.currentDay * 0.1)));
        enemy.maxHp = enemy.hp;
        title = `Resonancia Sombría: ${enemy.name}`;
      }

      nodes.push({
        id: `node_${floorIndex}_${i}`,
        index: i,
        type: nodeType,
        title,
        enemy,
        visited: false,
        cleared: false
      });
    }

    return {
      floorNumber: floorIndex,
      title: `${currentTheme.name} (Piso ${floorIndex})`,
      theme: currentTheme.theme,
      ambientColor: `hsl(${260 + floorIndex * 15}, 60%, 18%)`,
      nodeCount,
      isBossFloor: false,
      nodes
    };
  }
}
