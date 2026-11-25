-- Esquema declarativo SQLite para Barrio Chorus: RPG Calendario y Vida Social
-- Proporciona persistencia de calendario, estadísticas del protagonista, vínculos sociales (Hilos de Barrio), inventario y estado del Coro

CREATE TABLE IF NOT EXISTS game_save (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_day INTEGER NOT NULL DEFAULT 1,
    current_time_slot TEXT NOT NULL DEFAULT 'day', -- 'day', 'afternoon', 'night', 'summary'
    resonance_level INTEGER NOT NULL DEFAULT 1,
    courage INTEGER NOT NULL DEFAULT 10,
    empathy INTEGER NOT NULL DEFAULT 10,
    rhythm INTEGER NOT NULL DEFAULT 10,
    cash_pesos INTEGER NOT NULL DEFAULT 25000,
    voice_essence INTEGER NOT NULL DEFAULT 50,
    current_hp INTEGER NOT NULL DEFAULT 100,
    max_hp INTEGER NOT NULL DEFAULT 100,
    current_harmonia INTEGER NOT NULL DEFAULT 60,
    max_harmonia INTEGER NOT NULL DEFAULT 60,
    story_flag_boss_beaten INTEGER NOT NULL DEFAULT 0,
    saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    affinity INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    voice_type TEXT NOT NULL, -- 'Soprano', 'Tenor', 'Bajo'
    unlocked_skill TEXT,
    last_interaction_day INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS voice_deck (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    timbre TEXT NOT NULL, -- 'Soprano', 'Tenor', 'Bajo'
    harmonic_cost INTEGER NOT NULL,
    base_potency INTEGER NOT NULL,
    effect_type TEXT NOT NULL, -- 'damage', 'heal', 'tempo_boost', 'shield'
    description TEXT NOT NULL,
    equipped INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS calendar_events_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day INTEGER NOT NULL,
    time_slot TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales del protagonista y personajes clave del barrio
INSERT OR IGNORE INTO game_save (id, current_day, current_time_slot, resonance_level, courage, empathy, rhythm, cash_pesos, voice_essence, current_hp, max_hp, current_harmonia, max_harmonia)
VALUES (1, 1, 'day', 1, 10, 10, 10, 25000, 50, 100, 100, 60, 60);

INSERT OR IGNORE INTO social_links (id, name, role, affinity, level, voice_type, unlocked_skill) VALUES
('mateo', 'Mateo Valderrama', 'Músico Callejero & Bajista', 10, 1, 'Bajo', 'Pulso de Bajo (Defensa + Buff Tenor)'),
('carmen', 'Doña Carmen Salazar', 'Panadera & Matriarca Comunal', 15, 1, 'Soprano', 'Voz Dulce de Horno (Regeneración de Salud)'),
('sofia', 'Sofía Restrepo', 'Estudiante de Sonido & Tejedora', 10, 1, 'Tenor', 'Resonancia Urbana (Daño en Cadena Tenor)');

INSERT OR IGNORE INTO voice_deck (id, name, timbre, harmonic_cost, base_potency, effect_type, description, equipped) VALUES
('v_latido_urbano', 'Latido Urbano', 'Bajo', 15, 24, 'damage', 'Un golpe seco y firme con el eco de los tambores del andén.', 1),
('v_eco_esquina', 'Eco de la Esquina', 'Tenor', 20, 32, 'damage', 'Un coro rebelde que corta el aire nocturno y confunde a las sombras.', 1),
('v_canto_matinal', 'Canto Matinal', 'Soprano', 18, 30, 'heal', 'Aroma a pan caliente y esperanza matutina que revitaliza el corazón.', 1),
('v_polifonía_barrial', 'Polifonía Barrial', 'Tenor', 35, 55, 'damage', 'Sinfonía comunal que une todas las voces para disipar el pesimismo.', 1);
