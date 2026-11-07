"""Testy usługi importu i eksportu bez serwera."""

import pytest

from src.services.import_export import export_filename


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
