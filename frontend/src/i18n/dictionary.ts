export type Language = 'pl' | 'en'

// Nowy klucz: dopisz parę i użyj t() — TypeScript zgłosi błąd przy literówce.
const dictionary = {
  'app.title': { pl: 'WorldSmith', en: 'WorldSmith' },
  'nav.editor': { pl: 'Edytor map', en: 'Map Editor' },
  'nav.characters': { pl: 'Postacie', en: 'Characters' },
  'nav.projects': { pl: 'Projekty', en: 'Projects' },
  'nav.label': { pl: 'Główna nawigacja', en: 'Main navigation' },
  'nav.settings': { pl: 'Ustawienia', en: 'Settings' },
  'theme.label': { pl: 'Motyw', en: 'Theme' },
  'theme.dark': { pl: 'Ciemny', en: 'Dark' },
  'theme.light': { pl: 'Jasny', en: 'Light' },
  'theme.contrast': { pl: 'Kontrastowy', en: 'Contrast' },
  'lang.label': { pl: 'Język', en: 'Language' },
  'lang.pl': { pl: 'Polski', en: 'Polish' },
  'lang.en': { pl: 'Angielski', en: 'English' },
  'actions.close': { pl: 'Zamknij', en: 'Close' },
  'project.saved': { pl: 'Projekt zapisany', en: 'Project saved' },
  'common.comingSoon': { pl: 'Ta funkcja będzie wkrótce', en: 'This feature is coming soon' },
  'errors.network': { pl: 'Brak połączenia z serwerem', en: 'Cannot connect to the server' },
  'notFound.title': { pl: '404', en: '404' },
  'notFound.text': { pl: 'Nie ma takiej strony.', en: 'This page does not exist.' },
  'notFound.back': { pl: 'Wróć na stronę główną', en: 'Back to the home page' },
  'dev.ui.title': { pl: 'Katalog komponentów', en: 'Component Catalog' },
  'footer.icons': { pl: 'Ikony pixel-art: Pxlkit, autor', en: 'Pixel-art icons: Pxlkit by' },
  'footer.license': { pl: 'Licencja ikon', en: 'Icon license' },
} satisfies Record<string, Record<Language, string>>

export type TranslationKey = keyof typeof dictionary

export { dictionary }
