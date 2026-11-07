"""Import i eksport projektów jako pliki .worldsmith.json (zawartość pliku = Scene w formacie JSON)."""

import re
import unicodedata

EXPORT_EXTENSION = ".worldsmith.json"
# Nazwa pliku, gdy z nazwy projektu nie zostaje żaden dozwolony znak.
FALLBACK_FILE_NAME = "projekt"

# Litery, których normalizacja Unicode nie rozkłada na literę bazową i znak diakrytyczny.
EXTRA_LETTERS = str.maketrans({"ł": "l", "Ł": "L"})


def export_filename(project_name: str) -> str:
    """Zwraca nazwę pliku eksportu bez polskich znaków, np. "Wioska Żółć" → "Wioska-Zolc.worldsmith.json".

    Zostają tylko litery łacińskie, cyfry, "_" i "-"; każdy ciąg innych znaków zamienia się w jeden "-".
    """
    name = project_name.translate(EXTRA_LETTERS)
    # NFKD rozkłada np. "ó" na "o" + kreskę; encode("ascii", "ignore") usuwa kreskę.
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^A-Za-z0-9_-]+", "-", name).strip("-")
    return (name or FALLBACK_FILE_NAME) + EXPORT_EXTENSION
