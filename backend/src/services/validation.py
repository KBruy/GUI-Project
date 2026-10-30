"""Reguły poprawności sceny (rozdz. 5.5 dokumentu technicznego).

check_scene to czysta funkcja: nie zmienia sceny, nie korzysta z bazy ani z HTTP i zwraca wszystkie problemy naraz.
Kształt i typy pól sprawdzają wcześniej modele Pydantic (src/schemas/).
"""

from collections.abc import Mapping

from src.config import ALLOWED_SCENE_SIZES, MAX_LAYERS, SUPPORTED_SCHEMA_VERSION
from src.errors import Issue
from src.schemas.asset import Asset
from src.schemas.scene import Scene, SceneObject


def check_scene(scene: Scene, assets: Mapping[str, Asset]) -> list[Issue]:
    """Zwraca listę wszystkich problemów sceny; pusta lista oznacza scenę poprawną.

    assets to biblioteka assetów w postaci słownika id assetu → Asset.
    """
    issues: list[Issue] = []
    issues += check_scene_fields(scene)
    issues += check_unique_ids(scene)
    issues += check_objects(scene, assets)
    return issues


def check_scene_fields(scene: Scene) -> list[Issue]:
    """Sprawdza pola całej sceny: wersję schematu, nazwę, rozmiar płótna i liczbę warstw."""
    issues: list[Issue] = []
    if scene.schemaVersion != SUPPORTED_SCHEMA_VERSION:
        issues.append(Issue.of("UNSUPPORTED_SCHEMA_VERSION"))
    # Nazwa z samych spacji liczy się jako pusta.
    if not scene.name.strip():
        issues.append(Issue.of("NAME_REQUIRED"))
    if (scene.width, scene.height) not in ALLOWED_SCENE_SIZES[scene.type]:
        issues.append(Issue.of("INVALID_SCENE_SIZE"))
    if len(scene.layers) > MAX_LAYERS:
        issues.append(Issue.of("LAYER_LIMIT"))
    return issues


def check_unique_ids(scene: Scene) -> list[Issue]:
    """Sprawdza, czy id warstw i obiektów się nie powtarzają; warstwy i obiekty mają jedną wspólną pulę id.

    Zgłasza każde kolejne wystąpienie id (pierwsze uznaje za poprawne), w kolejności warstw i obiektów.
    """
    issues: list[Issue] = []
    seen_ids: set[str] = set()
    for layer in scene.layers:
        if layer.id in seen_ids:
            issues.append(Issue.of("DUPLICATE_ID", layerId=layer.id))
        seen_ids.add(layer.id)
        for scene_object in layer.objects:
            if scene_object.id in seen_ids:
                issues.append(Issue.of("DUPLICATE_ID", layerId=layer.id, objectId=scene_object.id))
            seen_ids.add(scene_object.id)
    return issues


def check_objects(scene: Scene, assets: Mapping[str, Asset]) -> list[Issue]:
    """Sprawdza każdy obiekt każdej warstwy; problemy mają layerId i objectId tego obiektu."""
    issues: list[Issue] = []
    for layer in scene.layers:
        for scene_object in layer.objects:
            codes = check_object_asset(scene_object, scene.type, assets)
            issues += [Issue.of(code, layerId=layer.id, objectId=scene_object.id) for code in codes]
    return issues


def check_object_asset(scene_object: SceneObject, scene_type: str, assets: Mapping[str, Asset]) -> list[str]:
    """Zwraca kody problemów z assetem obiektu: brak w bibliotece, zły moduł, inny rozmiar bazowy."""
    asset = assets.get(scene_object.assetId)
    # Bez assetu nie da się sprawdzić modułu ani rozmiaru.
    if asset is None:
        return ["ASSET_NOT_FOUND"]
    codes: list[str] = []
    if asset.module != scene_type:
        codes.append("ASSET_WRONG_MODULE")
    # Rozmiar zmienia się tylko przez scaleX/scaleY, więc width i height muszą być równe wymiarom assetu.
    if (scene_object.width, scene_object.height) != (asset.width, asset.height):
        codes.append("ASSET_SIZE_MISMATCH")
    return codes
