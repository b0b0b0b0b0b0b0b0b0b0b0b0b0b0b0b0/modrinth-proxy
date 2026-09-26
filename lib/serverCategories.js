import React from 'react'

export const SERVER_TYPES = [
  {
    id: 'type-vanilla',
    name: 'Ванильные',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11M17 7A5 5 0 0 0 7 7M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" /></svg>
  },
  {
    id: 'type-modded',
    name: 'Модовые',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
  }
]

export const SERVER_FEATURES = [
  {
    id: 'pokemon',
    name: 'Покемоны',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="4" r="2"></circle><circle cx="18" cy="8" r="2"></circle><circle cx="20" cy="16" r="2"></circle><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045q-.64-2.065-2.7-2.705A3.5 3.5 0 0 1 5.5 10Z"></path></svg>
  },
  {
    id: 'bosses',
    name: 'Боссы',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294zM5 21h14"></path></svg>
  },
  {
    id: 'questing',
    name: 'Квесты',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12h-5M15 8h-5M19 17V5a2 2 0 0 0-2-2H4"></path><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"></path></svg>
  },
  {
    id: 'classes',
    name: 'Классы',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76"></path></svg>
  },
  {
    id: 'teams',
    name: 'Команды',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"></path><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"></path><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"></path></svg>
  },
  {
    id: 'personal-worlds',
    name: 'Личные миры',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
  },
  {
    id: 'media',
    name: 'Медиа',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"></path></svg>
  },
  {
    id: 'op',
    name: 'Мощные предметы',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>
  },
  {
    id: 'custom-content',
    name: 'Новый контент',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16"></path><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"></path></svg>
  },
  {
    id: 'dungeons',
    name: 'Подземелья',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5V3M14 5V3M15 21v-3a3 3 0 0 0-6 0v3M18 3v8M18 5H6M22 11H2"></path><path d="M22 9v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9M6 3v8"></path></svg>
  },
  {
    id: 'plots',
    name: 'Участки',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"></path><circle cx="12" cy="8" r="2"></circle><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"></path></svg>
  },
  {
    id: 'economy',
    name: 'Экономика',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
  },
  {
    id: 'pve',
    name: 'PvE',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>
  },
  {
    id: 'pvp',
    name: 'PvP',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"></path></svg>
  }
]

export const SERVER_GAMEPLAY = [
  {
    id: 'anarchy',
    name: 'Анархия',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.5 17-.5-1-.5 1z"></path><path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="12" r="1"></circle></svg>
  },
  {
    id: 'vanilla-like',
    name: 'Ванильный вид',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11M17 7A5 5 0 0 0 7 7M17 7a2 2 0 0 1 0 4H7a2 2 0 0 1 0-4" /></svg>
  },
  {
    id: 'oneblock',
    name: 'Выживание на блоке',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16M12 22V12"></path></svg>
  },
  {
    id: 'racing',
    name: 'Гонки',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18M15 3v18M3 9h18M3 15h18"></path></svg>
  },
  {
    id: 'towns',
    name: 'Города',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 20H2M13.7 2h-3.4a1 1 0 0 0-1 .8L8.3 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4.3l-1-3.2a1 1 0 0 0-1-.8z"></path></svg>
  },
  {
    id: 'battle-royale',
    name: 'Королевская битва',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
  },
  {
    id: 'microgames',
    name: 'Микроигры',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
  },
  {
    id: 'minigames',
    name: 'Мини-игры',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
  },
  {
    id: 'parkour',
    name: 'Паркур',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h4M6 8h4M2 8h4M22 8h-4M13.8 3l-1 3.2M10.2 3l1 3.2M3 13.4V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6.6l-9-4z"></path></svg>
  },
  {
    id: 'prison',
    name: 'Тюрьма',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"></path></svg>
  },
  {
    id: 'factions',
    name: 'Фракции',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"></path></svg>
  },
  {
    id: 'bedwars',
    name: 'Bed Wars',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M12 4v6M2 18h20"></path></svg>
  },
  {
    id: 'gens',
    name: 'Gens',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 13-8.381 8.38a1 1 0 0 1-3-3L11 9.999M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"></path><path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"></path></svg>
  },
  {
    id: 'kitpvp',
    name: 'Kit PvP',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 19-6-6M5 21l-2-2M8 16l-4 4M9.5 17.5 21 6V3h-3L6.5 14.5"></path></svg>
  },
  {
    id: 'lifesteal',
    name: 'Lifesteal',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
  },
  {
    id: 'rpg',
    name: 'RPG',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"></path></svg>
  },
  {
    id: 'skyblock',
    name: 'Skyblock',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><path d="M12 22V12"></path></svg>
  }
]

export const SERVER_CONFIG = [
  {
    id: 'world-resets',
    name: 'Вайпы',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
  },
  {
    id: 'crossplay',
    name: 'Кроссплатформенные',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M8 21H3v-5M21 3L14 10M3 21l7-7"></path></svg>
  },
  {
    id: 'offline-mode',
    name: 'Офлайн-режим',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.5M5 12.5a10.94 10.94 0 0 1 5.83-2.84M8.9 5.1a16.84 16.84 0 0 1 12.2 4.4M2.9 8.9a16.85 16.85 0 0 1 2.2-1.3"></path></svg>
  },
  {
    id: 'whitelisted',
    name: 'Приватные',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
  },
  {
    id: 'survival-mode',
    name: 'Режим выживания',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
  },
  {
    id: 'adventure-mode',
    name: 'Режим приключений',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
  },
  {
    id: 'network',
    name: 'Сеть',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"></circle><circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><path d="M9 17l3-9 3 9M6 16h12"></path></svg>
  },
  {
    id: 'keep-inventory',
    name: 'Сохранение инвентаря',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path></svg>
  },
  {
    id: 'creative-mode',
    name: 'Творческий режим',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
  },
  {
    id: 'hardcore-mode',
    name: 'Хардкор',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 13a3 3 0 0 1 3 3H9a3 3 0 0 1 3-3z"></path></svg>
  }
]

export const SERVER_COMMUNITY = [
  {
    id: 'smp',
    name: 'Выживание',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  },
  {
    id: 'recording-smp',
    name: 'Выживание со съёмкой',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>
  },
  {
    id: 'mmo',
    name: 'ММО',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
  },
  {
    id: 'roleplay',
    name: 'Ролевые',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
  },
  {
    id: 'creator-community',
    name: 'Сообщество авторов',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M14.5 9.5a2.5 2.5 0 0 1-5 0v-1a2.5 2.5 0 0 1 5 0z"></path></svg>
  },
  {
    id: 'competitive',
    name: 'Соревновательные',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34M12 2a4 4 0 0 1 4 4v3H8V6a4 4 0 0 1 4-4z"></path></svg>
  },
  {
    id: 'social',
    name: 'Социальные',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
  },
  {
    id: 'technical',
    name: 'Технические',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  }
]

export const SERVER_REGIONS = [
  { id: 'australia', name: 'Австралия' },
  { id: 'asia', name: 'Азия' },
  { id: 'europe', name: 'Европа' },
  { id: 'russia', name: 'Россия' },
  { id: 'middle_east', name: 'Средний Восток' },
  { id: 'us_east', name: 'США — Восток' },
  { id: 'us_west', name: 'США — Запад' },
  { id: 'south_america', name: 'Южная Америка' }
]

export const SERVER_LANGUAGES = [
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'Английский' },
  { id: 'az', name: 'Азербайджанский' },
  { id: 'sq', name: 'Албанский' },
  { id: 'am', name: 'Амхарский' },
  { id: 'ar', name: 'Арабский' },
  { id: 'hy', name: 'Армянский' },
  { id: 'af', name: 'Африкаанс' },
  { id: 'eu', name: 'Баскский' },
  { id: 'be', name: 'Белорусский' },
  { id: 'bn', name: 'Бенгальский' },
  { id: 'my', name: 'Бирманский' },
  { id: 'bg', name: 'Болгарский' },
  { id: 'bs', name: 'Боснийский' },
  { id: 'hu', name: 'Венгерский' },
  { id: 'vi', name: 'Вьетнамский' },
  { id: 'gl', name: 'Галисийский' },
  { id: 'el', name: 'Греческий' },
  { id: 'ka', name: 'Грузинский' },
  { id: 'da', name: 'Датский' },
  { id: 'zu', name: 'Зулу' },
  { id: 'he', name: 'Иврит' },
  { id: 'id', name: 'Индонезийский' },
  { id: 'ga', name: 'Ирландский' },
  { id: 'is', name: 'Исландский' },
  { id: 'es', name: 'Испанский' },
  { id: 'it', name: 'Итальянский' },
  { id: 'yo', name: 'Йоруба' },
  { id: 'kk', name: 'Казахский' },
  { id: 'kn', name: 'Каннада' },
  { id: 'ca', name: 'Каталанский' },
  { id: 'zh', name: 'Китайский' },
  { id: 'ko', name: 'Корейский' },
  { id: 'km', name: 'Кхмерский' },
  { id: 'lo', name: 'Лаосский' },
  { id: 'lv', name: 'Латышский' },
  { id: 'lt', name: 'Литовский' },
  { id: 'mk', name: 'Македонский' },
  { id: 'ms', name: 'Малайский' },
  { id: 'ml', name: 'Малаялам' },
  { id: 'mr', name: 'Маратхи' },
  { id: 'mn', name: 'Монгольский' },
  { id: 'de', name: 'Немецкий' },
  { id: 'ne', name: 'Непальский' },
  { id: 'nl', name: 'Нидерландский' },
  { id: 'no', name: 'Норвежский' },
  { id: 'pa', name: 'Панджаби' },
  { id: 'fa', name: 'Персидский' },
  { id: 'pl', name: 'Польский' },
  { id: 'pt', name: 'Португальский' },
  { id: 'ro', name: 'Румынский' },
  { id: 'sr', name: 'Сербский' },
  { id: 'si', name: 'Сингальский' },
  { id: 'sk', name: 'Словацкий' },
  { id: 'sl', name: 'Словенский' },
  { id: 'sw', name: 'Суахили' },
  { id: 'th', name: 'Тайский' },
  { id: 'ta', name: 'Тамильский' },
  { id: 'te', name: 'Телугу' },
  { id: 'tr', name: 'Турецкий' },
  { id: 'uz', name: 'Узбекский' },
  { id: 'uk', name: 'Украинский' },
  { id: 'ur', name: 'Урду' },
  { id: 'fil', name: 'Филиппинский' },
  { id: 'fi', name: 'Финский' },
  { id: 'fr', name: 'Французский' },
  { id: 'hi', name: 'Хинди' },
  { id: 'hr', name: 'Хорватский' },
  { id: 'cs', name: 'Чешский' },
  { id: 'sv', name: 'Шведский' },
  { id: 'eo', name: 'Эсперанто' },
  { id: 'et', name: 'Эстонский' },
  { id: 'ja', name: 'Японский' }
]

export const SERVER_CATEGORIES = [
  ...SERVER_TYPES,
  ...SERVER_FEATURES,
  ...SERVER_GAMEPLAY,
  ...SERVER_CONFIG,
  ...SERVER_COMMUNITY
]

export function getServerCategoryName(id) {
  if (!id) return ''
  const category = SERVER_CATEGORIES.find((c) => c.id === id)
  return category?.name ?? id
}
