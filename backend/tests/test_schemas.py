"""Testy modeli kontraktu: poprawne dane przechodzą, zły kształt lub typ jest odrzucany."""

import pytest
from pydantic import ValidationError

from src.schemas.asset import Asset
from src.schemas.scene import Scene


def error_locations(exc_info) -> list[tuple]:
    """Zwraca ścieżki pól, których dotyczą błędy walidacji."""
    return [error["loc"] for error in exc_info.value.errors()]


def test_valid_scene_is_accepted(scene_data):
    scene = Scene.model_validate(scene_data)

    assert scene.layers[0].objects[0].assetId == "map_tree_oak_01"


def test_scene_round_trips_to_same_json_keys(scene_data):
    dumped = Scene.model_validate(scene_data).model_dump(mode="json")

    assert dumped.keys() == scene_data.keys()
    assert dumped["createdAt"] == "2026-10-26T12:00:00Z"


def test_unknown_field_is_rejected(scene_data):
    scene_data["layers"][0]["objects"][0]["tint"] = "#ff0000"

    with pytest.raises(ValidationError) as exc_info:
        Scene.model_validate(scene_data)

    assert error_locations(exc_info) == [("layers", 0, "objects", 0, "tint")]


def test_missing_field_is_rejected(scene_data):
    del scene_data["name"]

    with pytest.raises(ValidationError) as exc_info:
        Scene.model_validate(scene_data)

    assert error_locations(exc_info) == [("name",)]


@pytest.mark.parametrize(
    ("path", "value"),
    [
        (("width",), "1280"),  # napis zamiast liczby
        (("width",), 1280.5),  # ułamek zamiast liczby całkowitej
        (("layers", 0, "visible"), 1),  # liczba zamiast true/false
        (("layers", 0, "objects", 0, "x"), "100"),
        (("name",), 5),
    ],
)
def test_wrong_type_is_not_converted(scene_data, path, value):
    target = scene_data
    for part in path[:-1]:
        target = target[part]
    target[path[-1]] = value

    with pytest.raises(ValidationError) as exc_info:
        Scene.model_validate(scene_data)

    assert error_locations(exc_info) == [path]


@pytest.mark.parametrize(
    ("field", "value"),
    [("type", "dungeon"), ("gridSize", 16), ("createdAt", "wczoraj")],
)
def test_value_outside_contract_is_rejected(scene_data, field, value):
    scene_data[field] = value

    with pytest.raises(ValidationError):
        Scene.model_validate(scene_data)


@pytest.mark.parametrize("color", ["#7EC850", "#000000"])
def test_background_color_accepts_hex(scene_data, color):
    scene_data["background"]["color"] = color

    assert Scene.model_validate(scene_data).background.color == color


@pytest.mark.parametrize("color", ["7ec850", "#7ec85", "#7ec8500", "#gggggg", "green"])
def test_background_color_rejects_other_formats(scene_data, color):
    scene_data["background"]["color"] = color

    with pytest.raises(ValidationError):
        Scene.model_validate(scene_data)


def test_rules_are_not_checked_by_model(scene_data):
    # Reguły z rozdz. 5.5 sprawdza services/validation.py; model przepuszcza poprawny kształt.
    scene_data["schemaVersion"] = 2
    scene_data["name"] = ""
    scene_data["layers"][0]["objects"][0]["scaleX"] = 50

    assert Scene.model_validate(scene_data).schemaVersion == 2


def test_asset_from_manifest_is_accepted():
    asset = Asset.model_validate(
        {
            "id": "map_tree_oak_01",
            "module": "map",
            "category": "trees",
            "nameKey": "assets.map.tree_oak",
            "file": "map/trees/map_tree_oak_01.png",
            "width": 64,
            "height": 96,
        }
    )

    assert asset.module == "map"


def test_asset_with_unknown_module_is_rejected():
    with pytest.raises(ValidationError):
        Asset.model_validate(
            {
                "id": "x",
                "module": "weapon",
                "category": "swords",
                "nameKey": "assets.x",
                "file": "x.png",
                "width": 1,
                "height": 1,
            }
        )


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf")])
def test_nan_and_infinity_are_rejected(scene_data, value):
    scene_data["layers"][0]["objects"][0]["scaleX"] = value

    with pytest.raises(ValidationError) as exc_info:
        Scene.model_validate(scene_data)

    assert error_locations(exc_info) == [("layers", 0, "objects", 0, "scaleX")]
