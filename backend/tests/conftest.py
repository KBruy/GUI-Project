"""Wspólne dane testowe; pytest automatycznie udostępnia fixture z tego pliku wszystkim testom."""

from pathlib import Path

import pytest


@pytest.fixture
def scene_data() -> dict:
    """Zwraca poprawną scenę-mapę w formacie JSON kontraktu (świeża kopia dla każdego testu)."""
    return {
        "schemaVersion": 1,
        "id": "3f2b8c1e-5d4a-4f6b-9a7c-1e2d3c4b5a69",
        "type": "map",
        "name": "Wioska",
        "width": 1280,
        "height": 960,
        "gridSize": 32,
        "background": {"color": "#7ec850"},
        "layers": [
            {
                "id": "l1",
                "name": "Teren",
                "visible": True,
                "locked": False,
                "objects": [
                    {
                        "id": "o1",
                        "assetId": "map_tree_oak_01",
                        "x": 100,
                        "y": 200.5,
                        "width": 64,
                        "height": 96,
                        "rotation": 0,
                        "scaleX": 1,
                        "scaleY": 1.5,
                    }
                ],
            }
        ],
        "createdAt": "2026-10-26T12:00:00Z",
        "updatedAt": "2026-10-26T12:00:00Z",
    }


@pytest.fixture
def assets_manifest() -> Path:
    """Zwraca ścieżkę do małego manifestu testowego (2 assety mapy, 1 postaci), niezależnego od assets/."""
    return Path(__file__).parent / "assets_manifest.json"
