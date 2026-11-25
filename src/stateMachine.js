// Máquina de estados principal:
// DAY (Trabajo y estadísticas) -> AFTERNOON (Vínculos sociales y diálogos) -> NIGHT (Coro, exploración y combate) -> SUMMARY (Balance del día)

export const GameStates = {
  TITLE: 'TITLE',
  DAY_LIFE: 'DAY_LIFE',
  AFTERNOON_SOCIAL: 'AFTERNOON_SOCIAL',
  NIGHT_CORO: 'NIGHT_CORO',
  COMBAT: 'COMBAT',
  SUMMARY: 'SUMMARY',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

export class GameStateMachine {
  constructor(initialState = GameStates.DAY_LIFE, onStateChange = null) {
    this.currentState = initialState;
    this.onStateChange = onStateChange;
  }

  transitionTo(newState, payload = {}) {
    console.log(`[StateMachine] Transición: ${this.currentState} -> ${newState}`, payload);
    const prevState = this.currentState;
    this.currentState = newState;

    if (this.onStateChange) {
      this.onStateChange(newState, prevState, payload);
    }
  }

  getState() {
    return this.currentState;
  }
}
