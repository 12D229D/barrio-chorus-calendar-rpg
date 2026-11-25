// Gestión de Voces y Técnicas Corales
// Modela el mazo de cantos y la afinación de armónicos

export class VoiceDeckManager {
  constructor(allVoices, equippedIds) {
    this.allVoices = allVoices;
    this.equippedIds = equippedIds || ['v_latido_urbano', 'v_eco_esquina', 'v_canto_matinal', 'v_polifonía_barrial'];
  }

  getEquippedVoices() {
    return this.allVoices.filter(v => this.equippedIds.includes(v.id));
  }

  equipVoice(voiceId) {
    if (this.equippedIds.length >= 4) {
      throw new Error('Solo puedes equipar 4 Voces en tu diapasón');
    }
    if (!this.equippedIds.includes(voiceId)) {
      this.equippedIds.push(voiceId);
    }
  }

  unequipVoice(voiceId) {
    if (this.equippedIds.length <= 1) {
      throw new Error('Debes mantener al menos 1 Voz afinada');
    }
    this.equippedIds = this.equippedIds.filter(id => id !== voiceId);
  }

  getVoiceById(id) {
    return this.allVoices.find(v => v.id === id);
  }
}
