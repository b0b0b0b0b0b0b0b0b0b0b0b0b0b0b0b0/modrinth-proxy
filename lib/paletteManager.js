export class Palette {
  constructor(id, name, variables) {
    this.id = id;
    this.name = name;
    this.variables = variables;
  }

  apply(element = document.documentElement) {
    Object.entries(this.variables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }
}

export const PALETTES = {
  pink: new Palette('pink', 'ModrinthProxy', {
    '--color-green': '#ec7fab',
    '--color-green-rgb': '236, 127, 171',
    '--color-green-hover-light': '#e0659f',
    '--color-green-hover-dark': '#f08fbb',
    '--color-green-bright': '#e0659f',
    '--color-green-light': '#c16fff',
    '--color-green-light-rgb': '193, 111, 255',
    '--color-download-link': '#ec7fab'
  }),
  discord: new Palette('discord', 'Синелетовый', {
    '--color-green': '#5865F2',
    '--color-green-rgb': '88, 101, 242',
    '--color-green-hover-light': '#4752c4',
    '--color-green-hover-dark': '#7c8cf8',
    '--color-green-bright': '#7c8cf8',
    '--color-green-light': '#7289da',
    '--color-green-light-rgb': '114, 137, 218',
    '--color-download-link': '#5865F2'
  }),
  cyan: new Palette('cyan', 'Бирюлмазный', {
    '--color-green': '#00bcd4',
    '--color-green-rgb': '0, 188, 212',
    '--color-green-hover-light': '#0097a7',
    '--color-green-hover-dark': '#4dd0e1',
    '--color-green-bright': '#00e5ff',
    '--color-green-light': '#26c6da',
    '--color-green-light-rgb': '38, 198, 218',
    '--color-download-link': '#00bcd4'
  }),
  red: new Palette('red', 'Рубинстоун', {
    '--color-green': '#e53935',
    '--color-green-rgb': '229, 57, 53',
    '--color-green-hover-light': '#c62828',
    '--color-green-hover-dark': '#ef5350',
    '--color-green-bright': '#ff1744',
    '--color-green-light': '#ff5252',
    '--color-green-light-rgb': '255, 82, 82',
    '--color-download-link': '#e53935'
  }),
  gold: new Palette('gold', 'Золотолавовый', {
    '--color-green': '#e67e22',
    '--color-green-rgb': '230, 126, 34',
    '--color-green-hover-light': '#d35400',
    '--color-green-hover-dark': '#f39c12',
    '--color-green-bright': '#f1c40f',
    '--color-green-light': '#f39c12',
    '--color-green-light-rgb': '243, 156, 18',
    '--color-download-link': '#e67e22'
  }),
  purple: new Palette('purple', 'Эндеметистовый', {
    '--color-green': '#8e44ad',
    '--color-green-rgb': '142, 68, 173',
    '--color-green-hover-light': '#702989',
    '--color-green-hover-dark': '#9b59b6',
    '--color-green-bright': '#e040fb',
    '--color-green-light': '#9b59b6',
    '--color-green-light-rgb': '155, 89, 182',
    '--color-download-link': '#8e44ad'
  }),
  gray: new Palette('gray', 'Желебро', {
    '--color-green': '#9ca3af',
    '--color-green-rgb': '156, 163, 175',
    '--color-green-hover-light': '#6b7280',
    '--color-green-hover-dark': '#d1d5db',
    '--color-green-bright': '#f3f4f6',
    '--color-green-light': '#d1d5db',
    '--color-green-light-rgb': '209, 213, 219',
    '--color-download-link': '#9ca3af'
  }),
  medelsin: new Palette('medelsin', 'Медельсиновый', {
    '--color-green': '#d77a56',
    '--color-green-rgb': '215, 122, 86',
    '--color-green-hover-light': '#b95c37',
    '--color-green-hover-dark': '#e49575',
    '--color-green-bright': '#f1a180',
    '--color-green-light': '#f1b390',
    '--color-green-light-rgb': '241, 179, 144',
    '--color-download-link': '#d77a56'
  }),
  dragon: new Palette('dragon', 'Драконелёвый', {
    '--color-green': '#22b369',
    '--color-green-rgb': '34, 179, 105',
    '--color-green-hover-light': '#1a9456',
    '--color-green-hover-dark': '#2ec97a',
    '--color-green-bright': '#3ee889',
    '--color-green-light': '#62eda0',
    '--color-green-light-rgb': '98, 237, 160',
    '--color-download-link': '#22b369'
  })
};

export function applyPalette(id, element = document.documentElement) {
  const palette = PALETTES[id] || PALETTES.pink;
  palette.apply(element);
}
