// Catálogo de sombras del Coro, disonancias emocionales y jefe de la semana

export const CORO_ENCOUNTERS = [
  {
    id: 'sombra_murmullo',
    name: 'Murmullo del Callejón',
    icon: '👤',
    hp: 75,
    maxHp: 75,
    harmonia: 30,
    timbreWeakness: 'Bajo', // Vulnerable a la firmeza del Bajo
    attackPower: 12,
    flavor: 'Eco de miradas juzgadoras y medias palabras que rondan por los pasajes oscuros.',
    actions: [
      { name: 'Susurro Inseguro', damage: 10, msg: 'Siembra dudas en tu mente reduciendo tu tempo.' },
      { name: 'Disonancia Leve', damage: 14, msg: 'Emite un chillido que rasga la calma.' }
    ]
  },
  {
    id: 'sombra_desconfianza',
    name: 'Espectro de la Desconfianza',
    icon: '👁️',
    hp: 95,
    maxHp: 95,
    harmonia: 40,
    timbreWeakness: 'Soprano', // Vulnerable a la dulzura y fe del Soprano
    attackPower: 16,
    flavor: 'Encarnación del miedo a ser estafado o traicionado por la propia comunidad.',
    actions: [
      { name: 'Mirada Sospechosa', damage: 15, msg: 'Cuestiona los motivos de tus compañeros de coro.' },
      { name: 'Cerrojo Helado', damage: 18, msg: 'Aísla un acorde e intenta silenciarte.' }
    ]
  },
  {
    id: 'sombra_desalojo',
    name: 'Bulldozer Espectral',
    icon: '🏚️',
    hp: 120,
    maxHp: 120,
    harmonia: 50,
    timbreWeakness: 'Tenor', // Vulnerable a la agilidad y filo del Tenor
    attackPower: 20,
    flavor: 'Fantasmas de torres de hormigón que amenazan con demoler la memoria histórica.',
    actions: [
      { name: 'Vibración de Escombros', damage: 18, msg: 'Sacude las aceras mentales con un ruido ensordecedor.' },
      { name: 'Valla Publicitaria', damage: 22, msg: 'Tapa el cielo con promesas falsas de modernidad.' }
    ]
  }
];

export const BOSS_ENCOUNTER = {
  id: 'boss_rumor_gigante',
  name: 'El Rumor Gigante (Megáfono de Mentiras)',
  isBoss: true,
  icon: '📢👹',
  hp: 280,
  maxHp: 280,
  harmonia: 100,
  timbreWeakness: 'Soprano', // Requiere verdad comunitaria
  attackPower: 26,
  flavor: 'Una monstruosidad inflada de desinformación, rencores vecinales y pánico que amenaza con sabotear la Gran Feria.',
  phases: [
    { threshold: 1.0, title: 'Fase I: Murmullos en la Esquina' },
    { threshold: 0.5, title: 'Fase II: Campaña de Odio y Pánico' }
  ],
  actions: [
    { name: 'Megafonazo Ensordecedor', damage: 24, msg: '¡"DICEN QUE TODO SE VA A ACABAR!" resuena en todo el Coro.' },
    { name: 'Distorsión Colectiva', damage: 28, msg: 'Terversa las voces de tus amigos volviéndolas dolorosas.' },
    { name: 'Fake News Desgarradora', damage: 32, msg: 'Lanza una oleada de miedo puro que absorbe armonía.' }
  ]
};
