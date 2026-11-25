// Control de Mensajería Celular diegética (SMS / Hilos de Vecinos)
// Muestra mensajes de texto entrantes, notificaciones de rumores y solicitudes de ayuda

export const PHONE_CHATS = {
  mateo: [
    { sender: 'mateo', text: 'Hey bro, Doña Carmen me dijo que andabas por el parque. Si tienes un rato pásate por la esquina, saqué un riff nuevo para la feria.', time: '14:20' },
    { sender: 'mateo', text: 'Bro... soñé otra vez con ese megáfono que gritaba mentiras en la plaza. Ojalá la música nos alcance para taparlo.', time: '18:45' }
  ],
  carmen: [
    { sender: 'carmen', text: 'Mijo bendición. Saqué pan dulce de anís calientito. Si vienes a ayudarme a amasar te guardo tu porción.', time: '07:15' },
    { sender: 'carmen', text: 'Cuidado al volver esta noche. La calle 8 se siente pesadita, hay sombras rondando los postes.', time: '20:10' }
  ],
  sofia: [
    { sender: 'sofia', text: '¡Hola! Acabo de aislar una pista de audio increíble. Las chivas y las campanas se sincronizan en Do mayor. ¿Te paso la muestra?', time: '11:30' },
    { sender: 'sofia', text: 'El espectrograma de hoy marca disonancia nivel 4. Si vas a entrar al Coro esta noche avísame para sincronizar el dial.', time: '21:00' }
  ]
};

export class PhoneThreadsUI {
  constructor(containerEl, gameState) {
    this.container = containerEl;
    this.gameState = gameState;
    this.currentChat = 'mateo';
  }

  render() {
    if (!this.container) return;

    const contacts = [
      { id: 'mateo', name: 'Mateo (Bajo)', avatar: '🎸' },
      { id: 'carmen', name: 'Doña Carmen (Soprano)', avatar: '🥖' },
      { id: 'sofia', name: 'Sofía (Tenor)', avatar: '🎧' }
    ];

    const messages = PHONE_CHATS[this.currentChat] || [];

    this.container.innerHTML = `
      <div class="phone-frame glass-panel">
        <div class="phone-top-bar">
          <span class="phone-time">17:45</span>
          <span class="phone-brand">BARRIO•PHONE 5G</span>
          <span class="phone-battery">🔋 84%</span>
        </div>
        <div class="phone-body">
          <div class="phone-contacts-tab">
            ${contacts.map(c => `
              <button class="contact-pill-btn ${c.id === this.currentChat ? 'active' : ''}" data-chat="${c.id}">
                <span>${c.avatar}</span>
                <span>${c.name}</span>
              </button>
            `).join('')}
          </div>
          <div class="phone-chat-messages">
            ${messages.map(m => `
              <div class="chat-bubble ${m.sender === 'player' ? 'bubble-player' : 'bubble-neighbor'}">
                <p class="bubble-text">${m.text}</p>
                <span class="bubble-time">${m.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Conectar botones de pestañas
    this.container.querySelectorAll('.contact-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentChat = btn.getAttribute('data-chat');
        this.render();
      });
    });
  }
}
