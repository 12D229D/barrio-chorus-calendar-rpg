// Sistema de Combate "Armonía Coral"
// Mecánica propia y diferenciada:
// 1. Cada turno el jugador selecciona una "Voz" (Soprano, Tenor, Bajo)
// 2. Si el timbre encadena con la voz anterior (sinergia armónica), se desata un "Acorde Mayor":
//    - Bajo -> Tenor: aturde / retrasa el compás de la sombra
//    - Tenor -> Soprano: +35% potencia y golpe en cadena
//    - Soprano -> Bajo: barrera / escudo de esperanza
// 3. La barra de Armonía compartida alimenta los cantos; quedarse sin armonía produce 'Afonía' (desventaja temporal)
// 4. Dial de Compás: el tempo determina quién actúa antes

export class ChoralCombatEngine {
  constructor(playerData, enemyData, voicesList, onCombatEnd) {
    this.player = playerData; // { hp, maxHp, harmonia, maxHarmonia, stats }
    this.enemy = enemyData;   // { id, name, hp, maxHp, timbreWeakness, attackPower, actions, isBoss }
    this.voices = voicesList; // Array de voces equipadas
    this.onCombatEnd = onCombatEnd;

    this.turnHistory = [];
    this.lastVoicePlayed = null;
    this.playerShield = 0;
    this.enemyStunned = false;
    this.isOver = false;
    this.tempoGauge = 50; // Dial de 0 a 100. >50 favorece al jugador
    this.combatLog = [
      `¡Entras en resonancia contra ${this.enemy.name}!`,
      `Debilidad de timbre detectada: [${this.enemy.timbreWeakness}].`
    ];
  }

  canAffordVoice(voice) {
    return this.player.harmonia >= voice.cost;
  }

  // Ejecuta una acción de canto por parte del jugador
  playVoice(voiceId) {
    if (this.isOver) return null;

    const voice = this.voices.find(v => v.id === voiceId);
    if (!voice) return null;

    if (!this.canAffordVoice(voice)) {
      this.combatLog.unshift(`⚠️ ¡Armonía insuficiente! Necesitas ${voice.cost} pts.`);
      return { success: false, reason: 'low_harmonia' };
    }

    // Consumir costo
    this.player.harmonia = Math.max(0, this.player.harmonia - voice.cost);

    let synergyActive = false;
    let multiplier = 1.0;
    let bonusMessage = '';

    // Chequeo de sinergia coral con la voz previa
    if (this.lastVoicePlayed && this.lastVoicePlayed.timbre === voice.bonusTimbre) {
      synergyActive = true;
      multiplier = 1.35;
      bonusMessage = `✨ ¡ARMONÍA MAYOR! Encadenaste [${this.lastVoicePlayed.timbre}] con [${voice.timbre}].`;

      if (voice.effect === 'damage' && voice.timbre === 'Bajo') {
        this.enemyStunned = true;
        bonusMessage += ' La sombra tambalea y pierde el ritmo.';
      } else if (voice.effect === 'heal' || voice.effect === 'shield') {
        this.playerShield += 20;
        bonusMessage += ' Escudo protector reforzado (+20).';
      }
    }

    // Efectividad por debilidad de la sombra
    if (voice.timbre === this.enemy.timbreWeakness) {
      multiplier *= 1.4;
      bonusMessage += ` 🎯 ¡Disonancia vulnerada por timbre ${voice.timbre}!`;
    }

    // Cálculo según tipo de efecto
    let effectResult = 0;
    if (voice.effect === 'damage') {
      const statBonus = (this.player.stats.rhythm || 10) * 0.5;
      const finalDamage = Math.round((voice.potency + statBonus) * multiplier);
      this.enemy.hp = Math.max(0, this.enemy.hp - finalDamage);
      effectResult = finalDamage;
      this.combatLog.unshift(`🎤 Cantaste "${voice.name}" causando ${finalDamage} de daño armónico.`);
      this.tempoGauge = Math.min(100, this.tempoGauge + 15);
    } else if (voice.effect === 'heal') {
      const statBonus = (this.player.stats.empathy || 10) * 0.6;
      const finalHeal = Math.round((voice.potency + statBonus) * multiplier);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + finalHeal);
      effectResult = finalHeal;
      this.combatLog.unshift(`💖 Cantaste "${voice.name}" restaurando ${finalHeal} HP.`);
      this.tempoGauge = Math.min(100, this.tempoGauge + 10);
    } else if (voice.effect === 'shield') {
      const finalShield = Math.round(voice.potency * multiplier);
      this.playerShield += finalShield;
      effectResult = finalShield;
      this.combatLog.unshift(`🛡️ Alzaste "${voice.name}" levantando una barrera de ${finalShield} HP.`);
    }

    if (bonusMessage) {
      this.combatLog.unshift(bonusMessage);
    }

    this.lastVoicePlayed = voice;
    this.turnHistory.push({ actor: 'player', voice, synergyActive });

    // Chequear victoria del jugador
    if (this.enemy.hp <= 0) {
      this.isOver = true;
      this.combatLog.unshift(`🎉 ¡Has disipado la sombra de ${this.enemy.name}! La calma regresa al Coro.`);
      if (this.onCombatEnd) {
        this.onCombatEnd({ victory: true, enemy: this.enemy, log: this.combatLog });
      }
      return { success: true, victory: true };
    }

    // Turno de la Sombra / Jefe
    this.executeEnemyTurn();

    return { success: true, victory: this.isOver && this.player.hp > 0 };
  }

  // Turno de respuesta de la Sombra
  executeEnemyTurn() {
    if (this.enemyStunned) {
      this.combatLog.unshift(`⏳ ${this.enemy.name} está aturdido por la resonancia y pierde su compás.`);
      this.enemyStunned = false;
      return;
    }

    const actions = this.enemy.actions || [
      { name: 'Golpe Disonante', damage: this.enemy.attackPower, msg: 'Descarga un acorde agudo.' }
    ];
    const pickedAction = actions[Math.floor(Math.random() * actions.length)];

    let baseDamage = pickedAction.damage;
    // Resistencia del jugador basada en Coraje
    const courageReduction = Math.min(12, Math.floor((this.player.stats.courage || 10) * 0.3));
    baseDamage = Math.max(4, baseDamage - courageReduction);

    let actualDamage = baseDamage;
    if (this.playerShield > 0) {
      if (this.playerShield >= actualDamage) {
        this.playerShield -= actualDamage;
        this.combatLog.unshift(`🛡️ La barrera absorbió los ${actualDamage} de daño de "${pickedAction.name}".`);
        actualDamage = 0;
      } else {
        actualDamage -= this.playerShield;
        this.combatLog.unshift(`🛡️ La barrera absorbió ${this.playerShield} de daño antes de quebrarse.`);
        this.playerShield = 0;
      }
    }

    if (actualDamage > 0) {
      this.player.hp = Math.max(0, this.player.hp - actualDamage);
      this.combatLog.unshift(`💥 ${this.enemy.name} usó "${pickedAction.name}" infligiendo ${actualDamage} de daño. ${pickedAction.msg}`);
      this.tempoGauge = Math.max(0, this.tempoGauge - 15);
    }

    // Chequear derrota del jugador
    if (this.player.hp <= 0) {
      this.isOver = true;
      this.combatLog.unshift(`💔 Tu voz se quiebra... has sucumbido a la disonancia del Coro.`);
      if (this.onCombatEnd) {
        this.onCombatEnd({ victory: false, enemy: this.enemy, log: this.combatLog });
      }
    }
  }

  // Acción defensiva: Concentrarse y respirar para recuperar Armonía
  breatheAndFocus() {
    if (this.isOver) return;

    const recoveredHarmonia = 22 + Math.floor((this.player.stats.rhythm || 10) * 0.4);
    this.player.harmonia = Math.min(this.player.maxHarmonia, this.player.harmonia + recoveredHarmonia);
    this.playerShield += 10;
    this.combatLog.unshift(`🧘 Respiras hondo al compás de la cuadra: recuperas +${recoveredHarmonia} Armonía y +10 de escudo.`);

    this.executeEnemyTurn();
  }
}
