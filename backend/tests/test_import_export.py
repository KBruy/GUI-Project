"""Testy usługi importu i eksportu bez serwera."""

import json

import pytest

from src.config import MAX_IMPORT_FILE_BYTES
from src.errors import AppError
from src.schemas.scene import Scene
from src.services.import_export import export_filename, parse_import_file


def file_content(data: object) -> bytes:
    """Zwraca dane zapisane tak jak w pliku .worldsmith.json (JSON w UTF-8)."""
    return json.dumps(data).encode("utf-8")


def rejected_file_issues(content: bytes, status_code: int = 400) -> list[dict]:
    """Sprawdza, że plik o tej zawartości jest odrzucany jako INVALID_FILE z podanym statusem HTTP.

    Zwraca problemy z błędu jako słowniki (tak jak w details.issues odpowiedzi).
    """
    with pytest.raises(AppError) as error:
        parse_import_file(content)

    assert error.value.code == "INVALID_FILE"
    assert error.value.status_code == status_code
    return [issue.to_dict() for issue in error.value.issues]


def invalid_field(field: str) -> dict:
    """Zwraca oczekiwany problem INVALID_FIELD dla podanej ścieżki pola."""
    return {"code": "INVALID_FIELD", "messageKey": "errors.invalidField", "field": field}


@pytest.mark.parametrize(
    ("project_name", "expected"),
    [
        ("Wioska", "Wioska.worldsmith.json"),
        ("Zażółć gęślą jaźń", "Zazolc-gesla-jazn.worldsmith.json"),
        ("ŁÓDŹ", "LODZ.worldsmith.json"),
        ("mapa_01-wersja", "mapa_01-wersja.worldsmith.json"),
    ],
)
def test_export_filename_removes_polish_letters(project_name, expected):
    assert export_filename(project_name) == expected


def test_export_filename_joins_other_characters_into_single_dash():
    assert export_filename('  Moja "mapa" / v2?  ') == "Moja-mapa-v2.worldsmith.json"


@pytest.mark.parametrize("project_name", ["", "   ", "???", "日本"])
def test_export_filename_uses_fallback_when_nothing_is_left(project_name):
    assert export_filename(project_name) == "projekt.worldsmith.json"


def test_parse_import_file_returns_scene(scene_data):
    assert parse_import_file(file_content(scene_data)) == Scene.model_validate(scene_data)


def test_parse_import_file_accepts_utf8_bom(scene_data):
    # Notatnik w Windows potrafi zapisać plik UTF-8 ze znacznikiem BOM na początku.
    assert parse_import_file(b"\xef\xbb\xbf" + file_content(scene_data)).name == "Wioska"


def test_parse_import_file_accepts_file_at_size_limit(scene_data):
    content = file_content(scene_data)
    # Spacje na końcu są poprawnym JSON-em, więc dopełniają plik do dokładnie 2 MB.
    content += b" " * (MAX_IMPORT_FILE_BYTES - len(content))

    assert parse_import_file(content).name == "Wioska"


def test_parse_import_file_rejects_file_over_size_limit(scene_data):
    content = file_content(scene_data)
    content += b" " * (MAX_IMPORT_FILE_BYTES + 1 - len(content))

    rejected_file_issues(content, status_code=413)


@pytest.mark.parametrize("content", [b"", b"to nie jest JSON", b'{"name": "Wioska"', b"\xff\xff\xff"])
def test_parse_import_file_rejects_content_that_is_not_json(content):
    # Zły JSON nie dotyczy żadnego pola, więc lista problemów jest pusta.
    assert rejected_file_issues(content) == []


def test_parse_import_file_rejects_json_that_is_not_object():
    assert rejected_file_issues(file_content([1, 2, 3])) == [
        {"code": "INVALID_FIELD", "messageKey": "errors.invalidField"}
    ]


def test_parse_import_file_rejects_missing_field(scene_data):
    del scene_data["name"]

    assert rejected_file_issues(file_content(scene_data)) == [invalid_field("name")]


def test_parse_import_file_rejects_unknown_field(scene_data):
    scene_data["author"] = "ktoś"

    assert rejected_file_issues(file_content(scene_data)) == [invalid_field("author")]


def test_parse_import_file_rejects_wrong_type(scene_data):
    scene_data["width"] = "1280"

    assert rejected_file_issues(file_content(scene_data)) == [invalid_field("width")]


def test_parse_import_file_rejects_nan(scene_data):
    # json.loads przyjmuje NaN jako liczbę, ale model sceny go odrzuca.
    content = file_content(scene_data).replace(b'"x": 100', b'"x": NaN')

    assert rejected_file_issues(content) == [invalid_field("layers[0].objects[0].x")]


def test_parse_import_file_does_not_check_scene_rules(scene_data):
    # Reguły (tu zakres skali) sprawdza dopiero zapis projektu, który zwraca 422.
    scene_data["layers"][0]["objects"][0]["scaleX"] = 100

    assert parse_import_file(file_content(scene_data)).layers[0].objects[0].scaleX == 100
