// Grafo de relaciones "Hilos de Barrio"
// Modela la sinergia comunitaria entre Mateo, Doña Carmen y Sofía
// Fortalecer el hilo de un personaje irradia empatía y resonancia a los vecinos conectados

export class ThreadsGraph {
  constructor(charactersData, socialLinksState) {
    this.characters = charactersData.characters;
    this.socialLinks = socialLinksState;
    this.linksDefinition = [
      { from: 'carmen', to: 'mateo', strength: 0.6, label: 'Mecenazgo del Pan y Consejo' },
      { from: 'carmen', to: 'sofia', strength: 0.5, label: 'Memoria y Sabiduría Tradicional' },
      { from: 'sofia', to: 'mateo', strength: 0.4, label: 'Colaboración Sonora Urbana' }
    ];
  }

  getCharacter(id) {
    return this.characters.find(c => c.id === id);
  }

  getAffinity(id) {
    return this.socialLinks[id]?.affinity || 0;
  }

  getLevel(id) {
    return this.socialLinks[id]?.level || 1;
  }

  // Fortalece un vínculo y propaga resonancia a los vecinos interconectados
  addAffinity(targetId, amount) {
    if (!this.socialLinks[targetId]) return { primaryGain: 0, echoGains: [] };

    this.socialLinks[targetId].affinity += amount;
    const currentLvl = this.socialLinks[targetId].level;
    const charMeta = this.getCharacter(targetId);

    let leveledUp = false;
    let newPerk = null;

    if (charMeta && charMeta.ranks) {
      const nextRank = charMeta.ranks.find(r => r.level === currentLvl + 1);
      if (nextRank && this.socialLinks[targetId].affinity >= nextRank.minAffinity) {
        this.socialLinks[targetId].level += 1;
        leveledUp = true;
        newPerk = nextRank;
      }
    }

    // Propagación de resonancia vecinal (Efecto Hilo Comunitario)
    const echoGains = [];
    const connectedEdges = this.linksDefinition.filter(
      edge => edge.from === targetId || edge.to === targetId
    );

    connectedEdges.forEach(edge => {
      const neighborId = edge.from === targetId ? edge.to : edge.from;
      const echoAmount = Math.round(amount * edge.strength * 0.35);
      if (echoAmount > 0 && this.socialLinks[neighborId]) {
        this.socialLinks[neighborId].affinity += echoAmount;
        echoGains.push({
          targetId: neighborId,
          name: this.getCharacter(neighborId)?.name || neighborId,
          amount: echoAmount,
          reason: edge.label
        });
      }
    });

    return {
      primaryGain: amount,
      leveledUp,
      newPerk,
      echoGains
    };
  }

  // Calcula la Armonía de Equipo inicial para el Coro según la fuerza de todos los Hilos
  calculateTeamHarmony() {
    let totalLvl = 0;
    Object.values(this.socialLinks).forEach(link => {
      totalLvl += link.level;
    });
    // Base 60 + 10 por nivel social
    return 60 + (totalLvl * 10);
  }

  // Renderiza el grafo SVG interactivo de Hilos de Barrio
  renderGraphSvg(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Coordenadas triangulares de la red comunitaria
    const nodes = {
      carmen: { x: 200, y: 55, char: this.getCharacter('carmen') },
      mateo: { x: 90, y: 220, char: this.getCharacter('mateo') },
      sofia: { x: 310, y: 220, char: this.getCharacter('sofia') }
    };

    let edgesHtml = '';
    this.linksDefinition.forEach(link => {
      const p1 = nodes[link.from];
      const p2 = nodes[link.to];
      const avgAffinity = ((this.getAffinity(link.from) + this.getAffinity(link.to)) / 2);
      const strokeWidth = Math.max(2, Math.min(6, avgAffinity / 15));
      const opacity = Math.min(1, 0.4 + (avgAffinity / 100));

      edgesHtml += `
        <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" 
              stroke="hsl(175, 80%, 55%)" stroke-width="${strokeWidth}" 
              stroke-dasharray="6,4" stroke-opacity="${opacity}" class="thread-pulse-line">
          <title>${link.label} (Intensidad de Hilo)</title>
        </line>
        <circle cx="${(p1.x + p2.x)/2}" cy="${(p1.y + p2.y)/2}" r="4" fill="hsl(42, 90%, 60%)" />
      `;
    });

    let nodesHtml = '';
    Object.entries(nodes).forEach(([id, node]) => {
      const linkState = this.socialLinks[id];
      const lvl = linkState ? linkState.level : 1;
      const aff = linkState ? linkState.affinity : 0;

      nodesHtml += `
        <g class="graph-node" data-id="${id}" style="cursor: pointer;">
          <circle cx="${node.x}" cy="${node.y}" r="32" fill="hsl(260, 30%, 15%)" stroke="${node.char.color}" stroke-width="3" filter="drop-shadow(0 0 8px ${node.char.color})" />
          <text x="${node.x}" y="${node.y + 7}" text-anchor="middle" font-size="22">${node.char.avatar}</text>
          <text x="${node.x}" y="${node.y + 48}" text-anchor="middle" fill="#f0eef5" font-size="12" font-weight="bold">${node.char.name.split(' ')[0]}</text>
          <text x="${node.x}" y="${node.y + 62}" text-anchor="middle" fill="hsl(42, 90%, 65%)" font-size="10">Rango ${lvl} (${aff} pts)</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 400 300" class="threads-svg">
        <defs>
          <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="hsl(285, 75%, 65%)" />
            <stop offset="100%" stop-color="hsl(175, 85%, 55%)" />
          </linearGradient>
        </defs>
        ${edgesHtml}
        ${nodesHtml}
      </svg>
    `;
  }
}
