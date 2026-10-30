"""Testy reguł poprawności sceny (check_scene); działają bez serwera, na samych modelach."""

import pytest

from src.schemas.scene import Scene
from src.services.validation import check_scene


def issue_codes(scene_data: dict) -> list[str]:
    """Buduje Scene z danych JSON i zwraca kody problemów znalezionych przez check_scene."""
    return [issue.code for issue in check_scene(Scene.model_validate(scene_data))]


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
