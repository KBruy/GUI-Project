"""Testy reguł poprawności sceny (check_scene); działają bez serwera, na samych modelach."""

import pytest

from src.schemas.asset import Asset
from src.schemas.scene import Scene
from src.services.validation import check_scene

# Mała biblioteka assetów do testów; dąb ma ten sam rozmiar co obiekt sceny z conftest.py.
TEST_ASSETS = {
    asset.id: asset
    for asset in [
        Asset(
            id="map_tree_oak_01",
            module="map",
            category="trees",
            nameKey="assets.map.tree_oak",
            file="map/trees/map_tree_oak_01.png",
            width=64,
            height=96,
        ),
        Asset(
            id="character_shirt_red_01",
            module="character",
            category="shirts",
            nameKey="assets.character.shirt_red",
            file="character/shirts/character_shirt_red_01.png",
            width=256,
            height=512,
        ),
    ]
}


def issue_codes(scene_data: dict) -> list[str]:
    """Buduje Scene z danych JSON i zwraca kody problemów znalezionych przez check_scene."""
    return [issue.code for issue in check_scene(Scene.model_validate(scene_data), TEST_ASSETS)]


def issue_dicts(scene_data: dict) -> list[dict]:
    """Zwraca problemy znalezione przez check_scene jako słowniki, tak jak trafiają do odpowiedzi API."""
    return [issue.to_dict() for issue in check_scene(Scene.model_validate(scene_data), TEST_ASSETS)]


def duplicate_id(**where: str) -> dict:
    """Zwraca oczekiwany problem DUPLICATE_ID; where to layerId i opcjonalnie objectId."""
    return {"code": "DUPLICATE_ID", "messageKey": "errors.duplicateId", **where}


def copy_object(scene_data: dict, object_id: str) -> dict:
    """Zwraca kopię pierwszego obiektu sceny z podanym id."""
    return {**scene_data["layers"][0]["objects"][0], "id": object_id}


def empty_layers(count: int) -> list[dict]:
    """Zwraca podaną liczbę pustych warstw o różnych id."""
    return [
        {"id": f"l{index}", "name": f"Warstwa {index}", "visible": True, "locked": False, "objects": []}
        for index in range(count)
    ]


def test_valid_scene_has_no_issues(scene_data):
    assert issue_codes(scene_data) == []


@pytest.mark.parametrize("version", [0, 2])
def test_schema_version_other_than_1_is_rejected(scene_data, version):
    scene_data["schemaVersion"] = version

    assert issue_codes(scene_data) == ["UNSUPPORTED_SCHEMA_VERSION"]


@pytest.mark.parametrize("name", ["", "   ", "\t\n"])
def test_blank_name_is_rejected(scene_data, name):
    scene_data["name"] = name

    assert issue_codes(scene_data) == ["NAME_REQUIRED"]


def test_name_with_surrounding_spaces_is_accepted(scene_data):
    scene_data["name"] = "  Wioska  "

    assert issue_codes(scene_data) == []


@pytest.mark.parametrize(("width", "height"), [(640, 480), (1280, 960), (2048, 1536)])
def test_allowed_map_sizes_are_accepted(scene_data, width, height):
    scene_data["width"], scene_data["height"] = width, height

    assert issue_codes(scene_data) == []


@pytest.mark.parametrize(("width", "height"), [(1280, 961), (960, 1280), (256, 512), (0, 0)])
def test_other_map_sizes_are_rejected(scene_data, width, height):
    scene_data["width"], scene_data["height"] = width, height

    assert issue_codes(scene_data) == ["INVALID_SCENE_SIZE"]


@pytest.mark.parametrize(
    ("width", "height", "expected"),
    [(256, 512, []), (512, 256, ["INVALID_SCENE_SIZE"]), (640, 480, ["INVALID_SCENE_SIZE"])],
)
def test_character_scene_accepts_only_256x512(scene_data, width, height, expected):
    scene_data["type"] = "character"
    scene_data["width"], scene_data["height"] = width, height
    scene_data["layers"] = empty_layers(4)

    assert issue_codes(scene_data) == expected


def test_ten_layers_are_accepted(scene_data):
    scene_data["layers"] = empty_layers(10)

    assert issue_codes(scene_data) == []


def test_eleven_layers_are_rejected(scene_data):
    scene_data["layers"] = empty_layers(11)

    assert issue_codes(scene_data) == ["LAYER_LIMIT"]


def test_layers_with_same_id_are_rejected(scene_data):
    scene_data["layers"] = empty_layers(2)
    scene_data["layers"][1]["id"] = "l0"

    assert issue_dicts(scene_data) == [duplicate_id(layerId="l0")]


def test_objects_with_same_id_on_one_layer_are_rejected(scene_data):
    scene_data["layers"][0]["objects"].append(copy_object(scene_data, "o1"))

    assert issue_dicts(scene_data) == [duplicate_id(layerId="l1", objectId="o1")]


def test_objects_with_same_id_on_different_layers_are_rejected(scene_data):
    second_layer = empty_layers(1)[0]
    second_layer["objects"].append(copy_object(scene_data, "o1"))
    scene_data["layers"].append(second_layer)

    assert issue_dicts(scene_data) == [duplicate_id(layerId="l0", objectId="o1")]


def test_object_with_layer_id_is_rejected(scene_data):
    scene_data["layers"][0]["objects"].append(copy_object(scene_data, "l1"))

    assert issue_dicts(scene_data) == [duplicate_id(layerId="l1", objectId="l1")]


def test_layer_with_object_id_is_rejected(scene_data):
    second_layer = empty_layers(1)[0]
    second_layer["id"] = "o1"
    scene_data["layers"].append(second_layer)

    assert issue_dicts(scene_data) == [duplicate_id(layerId="o1")]


def test_each_repeated_id_is_reported(scene_data):
    scene_data["layers"][0]["objects"] += [copy_object(scene_data, "o1"), copy_object(scene_data, "o1")]

    assert issue_codes(scene_data) == ["DUPLICATE_ID", "DUPLICATE_ID"]


def test_unknown_asset_is_rejected(scene_data):
    scene_data["layers"][0]["objects"][0]["assetId"] = "map_tree_missing"

    assert issue_dicts(scene_data) == [
        {"code": "ASSET_NOT_FOUND", "messageKey": "errors.assetNotFound", "layerId": "l1", "objectId": "o1"}
    ]


def test_unknown_asset_skips_module_and_size_rules(scene_data):
    scene_object = scene_data["layers"][0]["objects"][0]
    scene_object["assetId"] = "map_tree_missing"
    scene_object["width"] = 1

    assert issue_codes(scene_data) == ["ASSET_NOT_FOUND"]


def test_character_asset_on_map_is_rejected(scene_data):
    scene_object = scene_data["layers"][0]["objects"][0]
    scene_object["assetId"] = "character_shirt_red_01"
    scene_object["width"], scene_object["height"] = 256, 512

    assert issue_codes(scene_data) == ["ASSET_WRONG_MODULE"]


@pytest.mark.parametrize(
    ("asset_id", "expected"),
    [("character_shirt_red_01", []), ("map_tree_oak_01", ["ASSET_WRONG_MODULE"])],
)
def test_character_scene_accepts_only_character_assets(scene_data, asset_id, expected):
    scene_data["type"] = "character"
    scene_data["width"], scene_data["height"] = 256, 512
    scene_object = scene_data["layers"][0]["objects"][0]
    scene_object["assetId"] = asset_id
    scene_object["width"], scene_object["height"] = TEST_ASSETS[asset_id].width, TEST_ASSETS[asset_id].height

    assert issue_codes(scene_data) == expected


@pytest.mark.parametrize(("width", "height"), [(65, 96), (64, 95), (128, 192)])
def test_object_size_other_than_asset_size_is_rejected(scene_data, width, height):
    scene_object = scene_data["layers"][0]["objects"][0]
    scene_object["width"], scene_object["height"] = width, height

    assert issue_codes(scene_data) == ["ASSET_SIZE_MISMATCH"]


def test_wrong_module_and_wrong_size_are_both_reported(scene_data):
    scene_data["layers"][0]["objects"][0]["assetId"] = "character_shirt_red_01"

    assert issue_codes(scene_data) == ["ASSET_WRONG_MODULE", "ASSET_SIZE_MISMATCH"]
