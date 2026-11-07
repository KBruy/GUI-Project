"""Import i eksport projektów jako pliki .worldsmith.json (zawartość pliku = Scene w formacie JSON)."""

import json
import re
import unicodedata

from pydantic import ValidationError

from src.config import MAX_IMPORT_FILE_BYTES
from src.errors import AppError, field_issue
from src.schemas.scene import Scene

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


def parse_import_file(content: bytes) -> Scene:
    """Zamienia zawartość pliku importu na Scene; reguł sceny nie sprawdza.

    Plik większy niż MAX_IMPORT_FILE_BYTES → 413 INVALID_FILE (jak przy za dużym ciele zapytania).
    Nie-JSON → 400 INVALID_FILE; JSON o kształcie innym niż Scene → 400 INVALID_FILE z listą błędnych pól.
    """
    if len(content) > MAX_IMPORT_FILE_BYTES:
        raise AppError("INVALID_FILE", 413)

    # json.loads rzuca ValueError przy złym JSON-ie i przy bajtach, które nie są tekstem UTF-8.
    try:
        data = json.loads(content)
    except ValueError:
        raise AppError("INVALID_FILE", 400)

    # model_validate sprawdza kształt tak samo jak przy POST /api/projects (ścisłe typy, nieznane pola to błąd).
    try:
        return Scene.model_validate(data)
    except ValidationError as error:
        # Każdy błąd Pydantic staje się problemem INVALID_FIELD, by frontend mógł pokazać, które pole jest złe.
        issues = [field_issue(item["loc"]) for item in error.errors()]
        raise AppError("INVALID_FILE", 400, issues)
