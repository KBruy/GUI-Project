"""Testy geometrii obiektów (narożniki po skalowaniu i obrocie); działają bez serwera."""

import math

from src.schemas.scene import SceneObject
from src.services.geometry import corners


def make_object(**changes) -> SceneObject:
    """Zwraca obiekt 64×96 ze środkiem w (100, 100), bez obrotu i skalowania; changes nadpisuje wybrane pola."""
    fields = {
        "id": "o1",
        "assetId": "map_tree_oak_01",
        "x": 100,
        "y": 100,
        "width": 64,
        "height": 96,
        "rotation": 0,
        "scaleX": 1,
        "scaleY": 1,
    }
    return SceneObject(**{**fields, **changes})


def rounded(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Zaokrągla współrzędne do 6 miejsc, bo sinus i cosinus dają drobne błędy (np. 1e-15 zamiast 0)."""
    return [(round(x, 6), round(y, 6)) for x, y in points]


def test_corners_without_rotation():
    assert rounded(corners(make_object())) == [(68, 52), (132, 52), (132, 148), (68, 148)]


def test_corners_use_scale():
    scene_object = make_object(scaleX=2, scaleY=0.5)

    assert rounded(corners(scene_object)) == [(36, 76), (164, 76), (164, 124), (36, 124)]


def test_corners_rotated_90_degrees_clockwise():
    # Lewy górny narożnik po obrocie o 90° zgodnie z ruchem wskazówek zegara trafia na prawą górę.
    scene_object = make_object(rotation=90)

    assert rounded(corners(scene_object)) == [(148, 68), (148, 132), (52, 132), (52, 68)]


def test_corners_rotated_45_degrees():
    # Kwadrat obrócony o 45° to romb: narożniki leżą na osiach przechodzących przez środek.
    scene_object = make_object(width=64, height=64, rotation=45)
    # Połowa przekątnej kwadratu 64×64.
    d = 32 * math.sqrt(2)

    assert rounded(corners(scene_object)) == rounded([(100, 100 - d), (100 + d, 100), (100, 100 + d), (100 - d, 100)])
