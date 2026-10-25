export type Language = 'pl' | 'en'

// Nowy klucz: dopisz parę i użyj t() — TypeScript zgłosi błąd przy literówce.
const dictionary = {
  'app.title': { pl: 'WorldSmith', en: 'WorldSmith' },
  'nav.editor': { pl: 'Edytor map', en: 'Map Editor' },
  'nav.characters': { pl: 'Postacie', en: 'Characters' },
  'nav.projects': { pl: 'Projekty', en: 'Projects' },
  'nav.settings': { pl: 'Ustawienia', en: 'Settings' },
  'theme.label': { pl: 'Motyw', en: 'Theme' },
  'theme.dark': { pl: 'Ciemny', en: 'Dark' },
  'theme.light': { pl: 'Jasny', en: 'Light' },
  'theme.contrast': { pl: 'Kontrastowy', en: 'Contrast' },
  'lang.label': { pl: 'Język', en: 'Language' },
  'lang.pl': { pl: 'Polski', en: 'Polish' },
  'lang.en': { pl: 'Angielski', en: 'English' },
  'dev.ui.title': { pl: 'Katalog komponentów', en: 'Component Catalog' },
} satisfies Record<string, Record<Language, string>>

export type TranslationKey = keyof typeof dictionary

export { dictionary }
